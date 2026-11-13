'use client';
import {useEffect,useState} from 'react';import type {RefObject} from 'react';
export type NativeCaption={start:number;end:number;text:string};
const tracks=new WeakMap<HTMLVideoElement,TextTrack>();
const escapeText=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function useFullscreenTextTrack(video:RefObject<HTMLVideoElement|null>,captions:NativeCaption[]){
 const [native,setNative]=useState(false);const key=JSON.stringify(captions);
 useEffect(()=>{const el=video.current;if(!el)return;let track=tracks.get(el);if(!track){track=el.addTextTrack('captions','SceneCaptions','en');tracks.set(el,track)}track.mode='hidden';
 const begin=()=>{setNative(true);track!.mode='showing'},end=()=>{setNative(false);track!.mode='hidden'},change=()=>{if(document.fullscreenElement===el)begin();else end()};
 el.addEventListener('webkitbeginfullscreen',begin);el.addEventListener('webkitendfullscreen',end);document.addEventListener('fullscreenchange',change);return()=>{end();el.removeEventListener('webkitbeginfullscreen',begin);el.removeEventListener('webkitendfullscreen',end);document.removeEventListener('fullscreenchange',change)};
 },[video]);
 useEffect(()=>{const el=video.current;if(!el)return;const track=tracks.get(el);if(!track)return;track.mode='hidden';for(const cue of Array.from(track.cues||[]))track.removeCue(cue);
 if(typeof VTTCue!=='undefined')for(const cue of JSON.parse(key) as NativeCaption[])if(cue.end>cue.start)track.addCue(new VTTCue(cue.start,cue.end,escapeText(cue.text)));
 track.mode=native?'showing':'hidden';
 },[key,native,video]);
 return native;
}
