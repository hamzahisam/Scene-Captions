'use client';
import {useEffect} from 'react';import type {RefObject} from 'react';
export function useDialogFocus(open:boolean,panel:RefObject<HTMLElement|null>,trigger:RefObject<HTMLButtonElement|null>,close:()=>void){
 useEffect(()=>{if(!open)return;const el=panel.current;if(!el)return;
 const first=el.querySelector<HTMLElement>('input[type="radio"]:checked:not(:disabled)')||el.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]');first?.focus();
 function key(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();close();trigger.current?.focus()}
 if(e.key==='Tab'){const items=[...el!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href],[tabindex="0"]')].filter(x=>x.getClientRects().length>0);const start=items[0],end=items.at(-1);if(e.shiftKey&&document.activeElement===start){e.preventDefault();end?.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();start?.focus()}}}
 function outside(e:PointerEvent){if(!el!.contains(e.target as Node)&&!trigger.current?.contains(e.target as Node)){close();trigger.current?.focus()}}
 document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside)};
 },[open,panel,trigger,close]);
}
