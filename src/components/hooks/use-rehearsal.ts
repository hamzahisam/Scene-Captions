'use client';
import {useCallback,useEffect,useRef,useState} from 'react';import {TelemetryRecorder} from '@/lib/telemetry-storage';import type {TelemetryInput} from '@/lib/telemetry';import type {StudyEvent} from '@/lib/session';import type {CaptionProfile,Condition} from '@/lib/captions';import {sessionDefaults} from '@/lib/study-session';import type {StudySession} from '@/lib/study-session';
import {browserRehearsalStore,deleteRehearsalLog,findOpenRehearsal,listRehearsalLogs,migrateLegacyLogs,newRehearsalId,openRehearsalRecorder,parseRehearsalId,randomUuid,rehearsalContext,touchIndexEntry,type RehearsalKind,type RehearsalLogSummary} from '@/lib/rehearsal-index';
const appVersion=()=>process.env.NEXT_PUBLIC_APP_VERSION||'local';
// Study sessions keep session.id and auto-resume exactly as before. Demo/lab rehearsals get a new ID per run, never auto-resume, and are listed in the index.
export function useRehearsal({filmId,session,lab=false}:{filmId:string;session?:StudySession;lab?:boolean}){
 const kind:RehearsalKind=lab?'lab':'demo';
 const [demoId,setDemoId]=useState(()=>newRehearsalId(kind,filmId,randomUuid()));
 const [recorder,setRecorder]=useState<TelemetryRecorder|null>(null),[recording,setRecording]=useState(false),[initError,setInitError]=useState('');
 const [prior,setPrior]=useState<RehearsalLogSummary|null>(null),[logs,setLogs]=useState<RehearsalLogSummary[]>([]);
 const lastProfile=useRef<CaptionProfile|null>(null);const videoTime=useRef(0),currentRecorder=useRef<TelemetryRecorder|null>(null);currentRecorder.current=recorder;const setVideoTime=useCallback((time:number)=>{videoTime.current=time;currentRecorder.current?.updatePosition(time)},[]);
 const sessionId=session?.id||demoId;
 const refreshLogs=useCallback(()=>{if(session)return;try{setLogs(listRehearsalLogs(browserRehearsalStore(),kind))}catch{setLogs([])}},[session,kind]);
 useEffect(()=>{if(session)return;try{migrateLegacyLogs(browserRehearsalStore())}catch{/* listing below reports unavailable storage */}refreshLogs()},[session,refreshLogs]);
 useEffect(()=>{try{
  if(session){const r=new TelemetryRecorder({session_id:sessionId,participant_id:session.participantId||null,design:session.design||'rehearsal',assigned_condition:session.sequence[session.sequenceIndex].condition||'personalized',sequence_index:session.sequenceIndex||0,film_id:filmId,app_version:appVersion()},localStorage);if(!r.started||r.loadedSequence!==session.sequenceIndex){r.start(0);r.append({type:"profile_change",video_s:0,field:"extendDisplay",from:null,to:session.extendDisplay,source:"system"});const defaults=sessionDefaults(session);for(const field of Object.keys(defaults) as (keyof CaptionProfile)[])r.append({type:"profile_change",video_s:0,field,from:null,to:defaults[field],source:"system"})}setRecorder(r);setRecording(r.recording);return}
  const store=browserRehearsalStore();
  const open=findOpenRehearsal(store,kind,filmId);
  if(open){setPrior(open);setRecorder(null);setRecording(false);return}  // no recorder for the saved log: nothing is logged, played or recorded until explicit consent
  setPrior(null);setRecorder(new TelemetryRecorder(rehearsalContext(sessionId,filmId,appVersion()),store));setRecording(false);
 }catch{setInitError('Browser storage is unavailable. A session cannot start safely.')}},[sessionId,filmId,session?.sequenceIndex]);
 useEffect(()=>{if(!recorder)return;let active=recorder.recording;const off=recorder.subscribe(()=>{if(recorder.recording!==active){active=recorder.recording;setRecording(active)}});return off},[recorder]);
 useEffect(()=>{if(!recorder)return;const unload=(e:BeforeUnloadEvent)=>{if(recorder.recording){recorder.flush();e.preventDefault();e.returnValue=''}};const visibility=()=>recorder.append({type:'visibility',video_s:videoTime.current,visible:document.visibilityState==='visible',source:'system'});window.addEventListener('beforeunload',unload);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('visibilitychange',visibility)}},[recorder]);
 useEffect(()=>{lastProfile.current=null},[recorder]);
 const telemetry=useCallback((e:TelemetryInput)=>recorder?.append(e),[recorder]);
 const record=useCallback((e:StudyEvent)=>{if(!recorder?.recording)return;const source=e.source||'participant';if(e.type==='play'||e.type==='pause')telemetry({type:e.type,video_s:e.video_s,source});else if(e.type==='seek')telemetry({type:'seek',video_s:e.video_s,from_s:e.from_s??e.video_s,method:e.method||'jump',source});else if(e.type==='original')telemetry({type:'original',video_s:e.video_s,enabled:e.enabled,mode:e.mode||'toggle',source});else if(e.type==='profile'){for(const field of Object.keys(e.profile) as (keyof CaptionProfile)[])if(lastProfile.current?.[field]!==e.profile[field])telemetry({type:'profile_change',video_s:e.video_s,field,from:lastProfile.current?.[field]??null,to:e.profile[field],source});lastProfile.current=e.profile}else if(e.type==='rate'||e.type==='mute'||e.type==='fullscreen'||e.type==='error')telemetry(e as TelemetryInput)},[recorder,telemetry]);
 function indexLog(id:string){const p=parseRehearsalId(id);if(!p)return;try{touchIndexEntry(browserRehearsalStore(),{id,kind:p.kind,filmId:p.filmId,createdAt:p.legacy?null:new Date().toISOString(),legacy:p.legacy})}catch{/* the log itself is still saved */}refreshLogs()}
 function start(video_s:number,condition:Condition,profile:CaptionProfile,enabled:boolean){if(!recorder||(!session&&recorder.started&&!recorder.recording))return;recorder.context={...recorder.context,assigned_condition:condition};recorder.start(video_s);setRecording(recorder.recording);if(!session&&recorder.recording)indexLog(recorder.context.session_id);record({type:'profile',video_s,profile});record({type:'original',video_s,enabled})}
 function stop(seconds?:number){recorder?.stop(seconds??recorder.events.at(-1)?.video_s??0);setRecording(false);refreshLogs()}
 // Explicit consent for the saved log: the only path that appends session_resume to it.
 function resumePrior(){if(!prior)return;try{const r=openRehearsalRecorder(browserRehearsalStore(),prior.id,'resume');setPrior(null);setRecorder(r);setRecording(r.recording);refreshLogs()}catch{setInitError('The saved rehearsal could not be reopened. Export it, or ask the researcher for help.')}}
 function discardPrior(){if(!prior)return;removeLog(prior.id)}
 function newRehearsal(){if(session||recording)return;setDemoId(newRehearsalId(kind,filmId,randomUuid()))}
 function openLog(id:string){return openRehearsalRecorder(browserRehearsalStore(),id,'read')}
 function removeLog(id:string){try{deleteRehearsalLog(browserRehearsalStore(),id)}catch{setInitError('The saved rehearsal could not be deleted. Export it, or clear browser storage for this site only after exporting.');return}
  if(prior?.id===id)setPrior(null);
  if(prior?.id===id||recorder?.context.session_id===id)setDemoId(newRehearsalId(kind,filmId,randomUuid()));
  refreshLogs()}
 return {recorder,setVideoTime,record,telemetry,recording,startedAt:recorder?.recording?0:null,start,stop,error:initError,prior,logs,resumePrior,discardPrior,newRehearsal,openLog,removeLog};
}
