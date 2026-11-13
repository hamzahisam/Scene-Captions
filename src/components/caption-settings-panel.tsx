'use client';
import {useRef} from 'react';import type {RefObject} from 'react';
import type {CaptionProfile,CaptionVideo,CaptionCue,Condition} from '@/lib/captions';
import {CaptionStyleControls} from './caption-style-controls';import {CaptionReadability} from './caption-readability';
import {useDialogFocus} from './hooks/use-dialog-focus';
export function CaptionSettingsPanel({open,close,trigger,profile,onApply,data,condition,sample,explanation}: {open:boolean;close:()=>void;trigger:RefObject<HTMLButtonElement|null>;profile:CaptionProfile;onApply:(p:CaptionProfile)=>void;data:CaptionVideo|null;condition:Condition;sample?:CaptionCue;explanation:string}){
 const panel=useRef<HTMLDivElement>(null);useDialogFocus(open,panel,trigger,close);if(!open)return null;
 const unavailable=!data?.cues.length,baseline=condition==='baseline';
 return <div ref={panel} id="caption-settings" className="caption-settings" role="dialog" aria-label="Caption settings" aria-modal="true"><div className="settings-heading"><h2>Caption settings</h2><button type="button" onClick={()=>{close();trigger.current?.focus()}} aria-label="Close caption settings">×</button></div>
 {baseline&&<p>Original sound captions are fixed. You can still change their appearance.</p>}{unavailable&&<p>This film has dialogue subtitles only. Sound settings do not apply.</p>}
 <fieldset disabled={baseline||unavailable}><legend className="sr-only">Sound settings</legend><CaptionStyleControls profile={profile} onChange={onApply} sample={sample} conservative={data?.generated_with.expressiveness==='conservative'}/></fieldset>
 <p className="caption-explanation">{explanation}</p><CaptionReadability profile={profile} onApply={onApply}/></div>;
}
