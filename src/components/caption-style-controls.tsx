'use client';
import {useMemo} from 'react';
import {captionExpectations} from '@/lib/captions';
import type {CaptionVideo,Condition,CaptionProfile,CaptionCue,Level} from '@/lib/captions';
export function CaptionStyleControls({profile,onChange,conservative,sample,explanation,data,condition="personalized",extendDisplay=false,defaultReadingSpeed}: {defaultReadingSpeed?:15|17|20;data?:CaptionVideo|null;condition?:Condition;extendDisplay?:boolean;profile:CaptionProfile;onChange:(p:CaptionProfile)=>void;conservative:boolean;sample?:CaptionCue;explanation?:string;sceneTagsReady?:boolean;densityBased?:boolean;punctuationOnly?:boolean}) {
 const counts=useMemo(()=>data?captionExpectations(data,profile,condition,false,extendDisplay):null,[data,profile,condition,extendDisplay]);
 return <>
  <fieldset role="radiogroup" aria-label="Amount of detail" className="amount-options"><legend>Amount of detail</legend>{(['Essential','Balanced','Rich'] as const).map((label,index)=><label key={label}><input type="radio" name="amount" value={index+1} checked={profile.detail===index+1} onChange={()=>onChange({...profile,detail:(index+1) as Level})}/><span>{label}<small>{['Just the sound','Sound and its source','More context'][index]}</small></span></label>)}</fieldset>
  {counts&&<p className="caption-expectations" role="status">{counts.shortened===0?`All ${counts.total} sounds use your chosen amount; none are shortened.`:`At ${profile.readingSpeed} characters per second, ${['','Essential','Balanced','Rich'][profile.detail]} fits ${counts.total-counts.shortened} of ${counts.total} sounds in this film. The rest are shortened for reading pace or closely spaced sounds.`}</p>}
  <fieldset role="radiogroup" aria-label="Reading pace" aria-describedby="pace-help" className="seg pace-options"><legend>Reading pace</legend>{([15,17,20] as const).map(n=><label key={n}><input type="radio" name="reading-pace" value={n} checked={profile.readingSpeed===n} onChange={()=>onChange({...profile,readingSpeed:n})}/><span>{n} · {({15:'Slower',17:'Standard',20:'Faster'} as const)[n]}{defaultReadingSpeed===n?" (session default)":""}</span></label>)}</fieldset>
  <p id="pace-help" className="hint">Characters per second. Choose a comfortable pace; no single reading speed suits everyone.</p>
  <label className="keep-up"><input type="checkbox" role="switch" aria-describedby="keep-up-help" checked={profile.adaptive} onChange={e=>onChange({...profile,adaptive:e.target.checked})}/> Help me keep up</label>
  <p id="keep-up-help">Shorter sound captions when needed, within your detail limit.</p>
  <p className="caption-explanation">{explanation}{profile.markShortened&&" ▿ means a caption was shortened to help you keep up."}</p>
  <details className="more-sound-options"><summary>More sound options</summary>
   <fieldset disabled={conservative}><legend>Punctuation inside sound captions</legend>{['None','Full stop','Exclamation'].map((label,i)=><label key={label}><input type="radio" name="punctuation" checked={profile.expression===i+1} onChange={()=>onChange({...profile,expression:(i+1) as Level})}/>{label}<small>{sample?.grid[`${profile.detail}-${i+1}`]||['[Sound]','[Sound.]','[Sound!]'][i]}</small></label>)}</fieldset>
   <p>An exclamation mark does not mean the sound is louder.</p>{conservative&&<p>Punctuation changes are unavailable for this track.</p>}
   <label><input type="checkbox" checked={profile.markShortened} onChange={e=>onChange({...profile,markShortened:e.target.checked})}/>Mark shortened captions</label>
   <label><input type="checkbox" role="switch" checked={profile.typeStyling} onChange={e=>onChange({...profile,typeStyling:e.target.checked})}/>Show sound type styling</label>
   <label htmlFor="representation">Sound representation</label><select id="representation" value={profile.representation} onChange={e=>onChange({...profile,representation:e.target.value as CaptionProfile['representation']})}><option value="descriptive">Descriptive</option><option value="plain">Plain sound labels</option><option value="onomatopoeic">Onomatopoeia when available</option></select><p>Unavailable sound spellings use descriptive captions.</p>
  </details>
 </>;
}
