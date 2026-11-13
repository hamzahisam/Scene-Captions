'use client';
import {useEffect,useRef} from 'react';import type {RefObject} from 'react';
export function usePlayerShortcuts(frame:RefObject<HTMLElement|null>,enabled:boolean,pageWide:boolean,actions:{toggle:()=>void;seek:(delta:number)=>void;settings:()=>void;original:(value:boolean,mode:'hold'|'toggle')=>void;originalEnabled:boolean;amount:(delta:number)=>void;size:(delta:number)=>void;fullscreen:()=>void;sound:(direction:'previous'|'next')=>void;help:()=>void;close:()=>void}){
 const latest=useRef(actions);latest.current=actions;
 useEffect(()=>{const target=pageWide?document:frame.current;if(!target)return;let timer:ReturnType<typeof setTimeout>|undefined,held=false,previous=false,pressed=false;
 function down(event:Event){const e=event as KeyboardEvent,el=e.target as HTMLElement;const a=latest.current;
 if(el.closest('input,select,textarea,[contenteditable="true"],[role="radiogroup"],[role="dialog"]'))return;
 if(e.key==='Escape'){a.close();return}if(e.key===' '&&el.closest('button,a,summary'))return;
 if(!enabled&&![' ','ArrowLeft','ArrowRight'].includes(e.key))return;
 const key=e.key.toLowerCase();const commands:Record<string,()=>void>={' ':a.toggle,k:a.toggle,j:()=>a.seek(-5),l:()=>a.seek(5),arrowleft:()=>a.seek(-5),arrowright:()=>a.seek(5),c:a.settings,'[':()=>a.amount(-1),']':()=>a.amount(1),'-':()=>a.size(-1),'=':()=>a.size(1),f:a.fullscreen,p:()=>a.sound('previous'),n:()=>a.sound('next'),'?':a.help};
 if(key==='o'){e.preventDefault();if(e.repeat||pressed)return;pressed=true;previous=a.originalEnabled;timer=setTimeout(()=>{held=true;latest.current.original(true,'hold')},350);return}
 if(commands[key]){e.preventDefault();commands[key]()}}
 function up(event:Event){const e=event as KeyboardEvent;if(e.key.toLowerCase()!=='o'||!pressed)return;pressed=false;if(timer)clearTimeout(timer);if(held){held=false;latest.current.original(previous,'hold')}else latest.current.original(!previous,'toggle')}
 function cancel(){if(timer)clearTimeout(timer);if(held)latest.current.original(previous,'hold');held=false;pressed=false}
 target.addEventListener('keydown',down);target.addEventListener('keyup',up);window.addEventListener('blur',cancel);return()=>{cancel();target.removeEventListener('keydown',down);target.removeEventListener('keyup',up);window.removeEventListener('blur',cancel)};
 },[frame,enabled,pageWide]);
}
