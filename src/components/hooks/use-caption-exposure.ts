'use client';
import {useEffect,useRef,useState} from 'react';import type {TelemetryInput} from '@/lib/telemetry';
export type CaptionExposure={sample?:boolean;cue_id:string;cue_type:'sound'|'dialogue';displayed_level:number|'original';adapted:boolean;rule:string;text:string};
export function useCaptionExposure(records:CaptionExposure[],time:number,enabled:boolean,onEvent:(e:TelemetryInput)=>void){
 const key=JSON.stringify(records),last=useRef<Map<string,CaptionExposure>>(new Map()),latest=useRef({time,onEvent});latest.current={time,onEvent};const [visible,setVisible]=useState(true);
 useEffect(()=>{const change=()=>setVisible(document.visibilityState==='visible');change();document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change)},[]);
 useEffect(()=>{if(!enabled){last.current.clear();return}const next=new Map<string,CaptionExposure>((visible?JSON.parse(key) as CaptionExposure[]:[]).map(c=>[`${c.cue_type}:${c.cue_id}`,c]));
 for(const [id,old] of last.current)if(!next.has(id)||JSON.stringify(old)!==JSON.stringify(next.get(id)))latest.current.onEvent({...old,type:'caption_hidden',video_s:latest.current.time,source:'system'});
 for(const [id,current] of next)if(!last.current.has(id)||JSON.stringify(current)!==JSON.stringify(last.current.get(id)))latest.current.onEvent({...current,type:'caption_shown',video_s:latest.current.time,source:'system'});
 last.current=next;
 },[key,visible,enabled]);
 useEffect(()=>()=>{for(const old of last.current.values())latest.current.onEvent({...old,type:'caption_hidden',video_s:latest.current.time,source:'system'});last.current.clear()},[]);
}
