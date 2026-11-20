'use client';
import {useRef} from 'react';import type {RefObject} from 'react';
import type {CaptionProfile,CaptionVideo,CaptionCue,Condition} from '@/lib/captions';
import {CaptionStyleControls} from './caption-style-controls';import {CaptionReadability} from './caption-readability';
import {useDialogFocus} from './hooks/use-dialog-focus';
export function CaptionSettingsPanel({open,close,trigger,profile,onApply,data,condition,sample,explanation,extendDisplay=false,soundSettingsAllowed=true,defaultReadingSpeed,docked=false}: {docked?:boolean;defaultReadingSpeed?:15|17|20;soundSettingsAllowed?:boolean;extendDisplay?:boolean;open:boolean;close:()=>void;trigger:RefObject<HTMLButtonElement|null>;profile:CaptionProfile;onApply:(p:CaptionProfile)=>void;data:CaptionVideo|null;condition:Condition;sample?:CaptionCue;explanation:string}){
 const panel=useRef<HTMLDivElement>(null);useDialogFocus(open&&!docked,panel,trigger,close);if(!open&&!docked)return null;
 const unavailable=!data?.cues.length,fixed=!soundSettingsAllowed||condition==='baseline';
 const previewText=sample?.grid[`${profile.detail}-${profile.expression}`]||'[Calm music plays.]';
 const body=<>
   <div className="settings-preview"><span className="sp-label" id="sp-label">Preview</span><div className="sp-stage" aria-labelledby="sp-label"><p className={`sp-caption size-${profile.size} bd-${profile.backdrop} tc-${profile.textColor}${profile.italicSound?' sp-italic':''}`}>{previewText}</p></div></div>
   {fixed&&<p className="dock-note">Sound captions are fixed for this session.</p>}{unavailable&&<p className="dock-note">This film has dialogue subtitles only. Sound settings do not apply.</p>}
   {!fixed&&!unavailable&&<fieldset className="dock-sound"><legend className="dock-legend">Sound captions</legend><CaptionStyleControls data={data} condition={condition} extendDisplay={extendDisplay} defaultReadingSpeed={defaultReadingSpeed} profile={profile} onChange={onApply} sample={sample} explanation={explanation} conservative={data?.generated_with.expressiveness==='conservative'}/></fieldset>}
   <CaptionReadability profile={profile} onApply={onApply}/>
 </>;
 if(docked)return <div ref={panel} id="caption-settings" className="caption-settings docked" role="region" aria-labelledby="caption-settings-title">
   <div className="dock-head"><h2 id="caption-settings-title">Caption settings</h2><p>Changes apply instantly and are saved on this device.</p></div>{body}
  </div>;
 return <div ref={panel} id="caption-settings" className="caption-settings" role="dialog" aria-label="Caption settings" aria-modal="true"><div className="settings-heading"><h2>Caption settings</h2><button type="button" onClick={()=>{close();trigger.current?.focus()}} aria-label="Close caption settings">×</button></div>
 {body}
 <div className="settings-done"><button type="button" className="done-button" onClick={()=>{close();trigger.current?.focus()}}>Done</button></div>
</div>;
}
