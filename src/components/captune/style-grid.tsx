"use client";
import type {KeyboardEvent} from "react";
import { allowed } from "@/lib/captune/project";
import type { Project,Point } from "@/lib/captune/project";
export function StyleGrid({project,value,onChange}:{project:Project;value:Point;onChange:(p:Point)=>void}){
 const first={detail:Math.ceil(project.bounds.lower.detail),expression:Math.floor(project.bounds.upper.expression)};
 function navigate(e:KeyboardEvent<HTMLButtonElement>,p:Point){
  const shift:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
  if(!shift[e.key])return;e.preventDefault();const [dx,dy]=shift[e.key],next={detail:p.detail+dx,expression:p.expression+dy};
  if(allowed(project,next)){const el=e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-detail="${next.detail}"][data-expression="${next.expression}"]`);el?.focus();onChange(next);}
 }
 const integerSelected=Number.isInteger(value.detail)&&Number.isInteger(value.expression)&&allowed(project,value);
 return <section className="anchor-grid-section" aria-label="Detail and expressiveness style grid"><div className="anchor-grid-corners"><span>Evocative</span><span>Cinematic</span></div><p className="anchor-axis">Expressiveness ↑</p><div className="anchor-grid" role="radiogroup" aria-label="Choose detail and expressiveness">{Array.from({length:100},(_,i)=>{const detail=i%10+1,expression=10-Math.floor(i/10),selected=value.detail===detail&&value.expression===expression;return <button key={i} type="button" data-detail={detail} data-expression={expression} disabled={!allowed(project,{detail,expression})} aria-label={`Detail ${detail}, expressiveness ${expression}`} role="radio" aria-checked={selected} tabIndex={selected||!integerSelected&&detail===first.detail&&expression===first.expression?0:-1} onKeyDown={e=>navigate(e,{detail,expression})} title={`Detail ${detail} / Expressiveness ${expression}`} onClick={()=>onChange({detail,expression})}>{selected?"●":<span className="sr-only">{detail}, {expression}</span>}</button>})}</div><div className="anchor-grid-corners"><span>Minimalist</span><span>Informative</span></div><p className="anchor-axis">Level of detail →</p><p className="helper-text">Selected: detail {value.detail}, expressiveness {value.expression}. Shaded cells are within the creator’s anchors. Use arrow keys to choose a nearby style.</p></section>;
}
