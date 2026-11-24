'use client';
import {useEffect} from 'react';import type {RefObject} from 'react';
export function useDialogFocus(open:boolean,panel:RefObject<HTMLElement|null>,trigger:RefObject<HTMLButtonElement|null>,close:()=>void,dismissOutside=true,{escapeDismiss=true}:{escapeDismiss?:boolean}={}){
 useEffect(()=>{if(!open)return;const el=panel.current;if(!el)return;
 const first=el.querySelector<HTMLElement>('[data-dialog-initial]:not(:disabled)')||el.querySelector<HTMLElement>('input[type="radio"]:checked:not(:disabled)')||el.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),video[controls],[tabindex="0"]');if (el.closest(".viewer-player")) el.scrollIntoView({ block: "nearest" });
 first?.focus({preventScroll:true});el.scrollTop=0;
 function key(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(escapeDismiss){close();requestAnimationFrame(()=>trigger.current?.focus())}return}
 if(e.key==='Tab'){const items=[...el!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),video[controls],summary,a[href],[tabindex="0"]')].filter(x=>x.getClientRects().length>0);const start=items[0],end=items.at(-1);if(e.shiftKey&&document.activeElement===start){e.preventDefault();end?.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();start?.focus()}}}
 function outside(e:PointerEvent){if(dismissOutside&&!el!.contains(e.target as Node)&&!trigger.current?.contains(e.target as Node)){close();requestAnimationFrame(()=>trigger.current?.focus())}}
 document.addEventListener('keydown',key,true);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',outside)};
 },[open,panel,trigger,close,dismissOutside,escapeDismiss]);
}
