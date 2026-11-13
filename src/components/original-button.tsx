'use client';
import {useEffect,useRef} from 'react';
export function OriginalButton({enabled,disabled,onChange}:{enabled:boolean;disabled:boolean;onChange:(value:boolean,mode:'hold'|'toggle')=>void}){
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),held=useRef(false),previous=useRef(false),suppress=useRef(false);
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 function release(){clear();if(held.current){held.current=false;suppress.current=true;onChange(previous.current,'hold')}}
 return <button type="button" className="original-video" aria-label="Original captions" aria-pressed={enabled} disabled={disabled}
 onPointerDown={e=>{if(e.button!==0)return;suppress.current=false;previous.current=enabled;e.currentTarget.setPointerCapture(e.pointerId);timer.current=setTimeout(()=>{held.current=true;onChange(true,'hold')},350)}}
 onPointerUp={release} onPointerCancel={()=>{release();suppress.current=true}}
 onClick={e=>{if(e.detail===0){onChange(!enabled,'toggle');return}if(suppress.current){suppress.current=false;return}onChange(!enabled,'toggle')}}>Original</button>;
}
