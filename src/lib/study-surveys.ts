import {z} from 'zod';import type {StudySession} from './study-session.ts';import {ratingQuestions} from './experiment.ts';
export const signVideoSchema=z.string().regex(/^\/study\/[a-zA-Z0-9_./-]+\.mp4$/).refine(s=>!s.includes('..'),'Use a local study clip.');
export const questionFileSchema=z.object({film_id:z.string(),questions:z.array(z.object({id:z.string().regex(/^[a-z0-9-]+$/),at:z.number().finite().nonnegative(),prompt:z.string().min(1).max(1000),choices:z.array(z.object({id:z.string(),label:z.string().min(1).max(300)})).min(2).max(6),example:z.boolean().default(false),signVideo:signVideoSchema.optional()})).max(100)});
export type QuestionFile=z.infer<typeof questionFileSchema>;
// Metadata travels with responses so numeric codes remain interpretable after export.
export const surveyScaleSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('rating'),min:z.number().finite(),max:z.number().finite(),low:z.string(),high:z.string(),direction:z.enum(['negative-to-positive','positive-to-negative'])}),
 z.object({kind:z.literal('categorical')}),
]);
export type SurveyScale=z.infer<typeof surveyScaleSchema>;
export type SurveyItem={scale:SurveyScale;pictorial?:boolean;key:string;prompt:string;choices?:{value:number|string;label:string}[];min?:number;max?:number;step?:number;low?:string;high?:string;signVideo?:string};
export const TLX_KEYS=['mental','physical','temporal','performance','effort','frustration'] as const;
export function rawTlxScore(answers:Record<string,number|string|null>,prefix='tlx-'){const values=TLX_KEYS.map(k=>answers[prefix+k]);return values.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100)?(values as number[]).reduce((s,x)=>s+x,0)/6:null;}
const labels5=['Very hard','Hard','In between','Easy','Very easy'];
const controlLabels5=['Not at all','A little','Some','Mostly','Yes'];
function ratingScale(min:number,max:number,low:string,high:string,direction:'negative-to-positive'|'positive-to-negative'):SurveyScale{return {kind:'rating',min,max,low,high,direction}}
export function checkpointItems(session:StudySession,at:number,questions?:QuestionFile):SurveyItem[]{
 const child=session.group==='child';
 const items:SurveyItem[]=[{
  key:'effort',prompt:child?'How easy was it to follow the captions?':'How hard was it to follow the captions?',
  scale:child?ratingScale(1,5,'Very hard','Very easy','negative-to-positive'):ratingScale(1,7,'Very easy','Very hard','positive-to-negative'),
  pictorial:child,
  choices:Array.from({length:child?5:7},(_,i)=>({value:i+1,label:child?labels5[i]:`${i+1}${i===0?' · Very easy':i===6?' · Very hard':''}`})),
  signVideo:session.signVideos['checkpoint-effort'],
 }];
 if(session.comprehension){const q=questions?.questions.find(q=>!q.example&&Math.abs(q.at-at)<.01);if(q)items.push({key:q.id,prompt:q.prompt,scale:{kind:'categorical'},choices:[...q.choices.map(c=>({value:c.id,label:c.label})),{value:'unsure',label:'Unsure'}],signVideo:q.signVideo})}
 return items;
}
export function endItems(session:StudySession):SurveyItem[]{
 if(session.group==='child')return session.instruments.childItems.map(key=>{
  const labels=key==='control'?controlLabels5:labels5;
  return {key:`child-${key}`,prompt:({readability:'How easy were the captions to read?',control:'Could you make the captions work for you?',story:'How easy was it to follow the story?'})[key],scale:ratingScale(1,5,labels[0],labels[4],'negative-to-positive'),pictorial:true,choices:labels.map((label,i)=>({value:i+1,label})),signVideo:session.signVideos[`child-${key}`]};
 });
 const result:SurveyItem[]=session.instruments.custom?ratingQuestions.map(q=>({key:q.key,prompt:q.label,scale:ratingScale(1,7,q.low,q.high,q.key==='effort'?'positive-to-negative':'negative-to-positive'),choices:Array.from({length:7},(_,i)=>({value:i+1,label:`${i+1}${i===0?' · '+q.low:i===6?' · '+q.high:''}`})),signVideo:session.signVideos[q.key]})):[];
 if(session.instruments.tlx)result.push(...TLX_KEYS.map((key,i)=>({key:`tlx-${key}`,prompt:['Mental demand','Physical demand','Time pressure','Performance','Effort','Frustration'][i],min:0,max:100,step:5,low:key==='performance'?'Good':'Low',high:key==='performance'?'Poor':'High',scale:ratingScale(0,100,key==='performance'?'Good':'Low',key==='performance'?'Poor':'High','positive-to-negative'),signVideo:session.signVideos[`tlx-${key}`]})));
 return result;
}
