'use client';
import {useEffect,useId,useRef,useState} from 'react';import type {RefObject} from 'react';
import type {StudySession} from '@/lib/study-session';import {checkpointItems,endItems,TLX_TASK} from '@/lib/study-surveys';import type {QuestionFile,SurveyItem} from '@/lib/study-surveys';import type {TelemetryRecorder} from '@/lib/telemetry-storage';import {Face} from './survey-face';import {useStudySession} from './study-context';import {useDialogFocus} from './hooks/use-dialog-focus';
type Pending={kind:'checkpoint'|'end';at:number;items:SurveyItem[];resume:boolean;prefix:string};
export function StudySurveys({session,recorder,questions,time,playing,ended,pause,resume,trigger,onActiveChange}:{session:StudySession;recorder:TelemetryRecorder;questions?:QuestionFile;time:number;playing:boolean;ended:boolean;pause:()=>void;resume:()=>void;trigger:RefObject<HTMLButtonElement|null>;onActiveChange:(active:boolean)=>void}){
 const [pending,setPending]=useState<Pending|null>(null);const {advance}=useStudySession();const film=session.sequence[session.sequenceIndex].filmId,last=useRef(time),key=`pending:${film}`;
 useEffect(()=>{onActiveChange(!!pending)},[pending,onActiveChange]);
 useEffect(()=>()=>onActiveChange(false),[onActiveChange]);
 const callbacks=useRef({pause,resume,advance});callbacks.current={pause,resume,advance};
 function enter(kind:'checkpoint'|'end',at:number,restore=false){const prefix=`${kind}:${film}:${kind==='end'?'end':at}`;const wasPlaying=restore?recorder.answers[`${key}:playing`]===1:playing;recorder.setAnswer(key,kind==='end'?-1:at);recorder.setAnswer(`${key}:playing`,wasPlaying?1:0);if(playing)callbacks.current.pause();setPending({kind,at,items:kind==='end'?endItems(session):checkpointItems(session,at,questions),resume:wasPlaying,prefix});}
 useEffect(()=>{if(pending||!recorder.recording)return;const saved=recorder.answers[key];if(typeof saved==='number'){enter(saved===-1?'end':'checkpoint',saved,true);return}if(ended&&!recorder.answers[`end:${film}:complete`]){enter('end',time);return}
 const previous=last.current;last.current=time;
 for(const at of session.checkpoints[film]||[]){const prefix=`checkpoint:${film}:${at}`;if(recorder.answers[`${prefix}:complete`]||time<at)continue;if(time-previous>2&&time-at>1){for(const item of checkpointItems(session,at,questions)){recorder.setAnswer(`${prefix}:${item.key}`,null);recorder.append({type:'survey',item:`${prefix}:${item.key}`,scale:item.scale,value:null,response_ms:0,video_s:time,source:'system'})}recorder.setAnswer(`${prefix}:complete`,1);continue}if(playing){enter('checkpoint',at);break}}
 },[time,playing,ended,pending,recorder,film,session]);
 const complete=()=>{if(!pending)return;recorder.setAnswer(pending.kind==='end'?`end:${film}:complete`:`${pending.prefix}:complete`,1);recorder.setAnswer(key,null);const done=pending;setPending(null);if(done.kind==='end'){recorder.stop(time,'system');if(session.sequenceIndex+1<session.sequence.length)callbacks.current.advance()}else if(done.resume)callbacks.current.resume()};
 if(!pending)return null;return <SurveyDialog key={pending.prefix} pending={pending} recorder={recorder} time={time} trigger={trigger} complete={complete}/>;
}
const ignoreEscape=()=>{};
function SurveyDialog({pending,recorder,time,trigger,complete}:{pending:Pending;recorder:TelemetryRecorder;time:number;trigger:RefObject<HTMLButtonElement|null>;complete:()=>void}){
 const [index,setIndex]=useState(()=>{const first=pending.items.findIndex(i=>!Object.hasOwn(recorder.answers,`${pending.prefix}:${i.key}`));return first<0?pending.items.length:first});const panel=useRef<HTMLDivElement>(null);useDialogFocus(true,panel,trigger,ignoreEscape,false,{escapeDismiss:false});
 const item=pending.items[index];
 function answer(value:number|string|null){if(!item){complete();return}const itemKey=`${pending.prefix}:${item.key}`,started=Number(recorder.answers[`${itemKey}:shown_at`]||Date.now());recorder.setAnswer(itemKey,value);recorder.append({type:'survey',item:itemKey,scale:item.scale,value,response_ms:Math.max(0,Date.now()-started),video_s:time,source:'participant'});if(index+1>=pending.items.length)complete();else setIndex(index+1)}
 useEffect(()=>{if(!item)return;const k=`${pending.prefix}:${item.key}:shown_at`;if(!recorder.answers[k])recorder.setAnswer(k,Date.now());panel.current?.querySelector<HTMLElement>('input,button')?.focus()},[item?.key,recorder,pending.prefix]);
 return <div className="survey-dialog" role="dialog" aria-modal="true" aria-label={pending.kind==='end'?'End-of-film questions':'Quick check-in'} ref={panel}><h2>{pending.kind==='end'?'Your experience':'Quick check-in'}</h2><p>The video is paused. Use Continue to save an answer or Skip this item to leave it unanswered.</p>{item?<SurveyStep key={item.key} item={item} answer={answer}/>:<><p>Your answers are saved in this browser.</p><button onClick={complete}>{pending.kind==='end'?'Finish film':'Continue watching'}</button></>}</div>;
}
function SurveyStep({item,answer}:{item:SurveyItem;answer:(value:number|string|null)=>void}){
 const [value,setValue]=useState<number|string|null>(null),[videoError,setVideoError]=useState(false);
 const description=useId();
 return <>
  <fieldset>
   <legend>{item.prompt}</legend>
   {item.segmented&&<p id={`${description}-task`}>{TLX_TASK}</p>}
   {item.signVideo&&<><video className="sign-video" src={item.signVideo} controls playsInline aria-label="Sign-language version of this question" onError={()=>setVideoError(true)}/>{videoError&&<p role="status">The sign-language clip is unavailable. The text question remains available.</p>}</>}
   {item.scale.kind==='rating'&&<div className="range-labels" id={`${description}-endpoints`}><span>{item.scale.min} · {item.scale.low}</span><span>{item.scale.max} · {item.scale.high}</span></div>}
   <div className={item.segmented?'survey-segments':'survey-choices'} role="radiogroup" aria-label={item.prompt} aria-describedby={item.scale.kind==='rating'?`${item.segmented?`${description}-task `:''}${description}-endpoints`:undefined}>
    {item.choices?.map(choice=><label key={choice.value}>
     <input type="radio" name={item.key} value={choice.value} checked={value===choice.value} onChange={()=>setValue(choice.value)}/>
     {item.pictorial&&<Face value={Number(choice.value)}/>}<span>{choice.label}</span>
    </label>)}
   </div>
  </fieldset>
  <div className="survey-actions"><button disabled={value===null} onClick={()=>answer(value)}>Continue</button><button onClick={()=>answer(null)}>Skip this item</button></div>
 </>;
}
