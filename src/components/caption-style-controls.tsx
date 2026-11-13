'use client';
import type {CaptionProfile,CaptionCue,Level} from '@/lib/captions';
export function CaptionStyleControls({profile,onChange,conservative,sample,explanation}: {profile:CaptionProfile;onChange:(p:CaptionProfile)=>void;conservative:boolean;sample?:CaptionCue;explanation?:string;sceneTagsReady?:boolean;densityBased?:boolean;punctuationOnly?:boolean}) {
 return <>
  <fieldset role="radiogroup" aria-label="Amount of detail" className="amount-options"><legend>Amount of detail</legend>{(['Essential','Balanced','Rich'] as const).map((label,index)=><label key={label}><input type="radio" name="amount" value={index+1} checked={profile.detail===index+1} onChange={()=>onChange({...profile,detail:(index+1) as Level})}/><span>{label}<small>{['Just the sound','Sound and its source','More context'][index]}</small></span></label>)}</fieldset>
  <label className="keep-up"><input type="checkbox" role="switch" checked={profile.adaptive} onChange={e=>onChange({...profile,adaptive:e.target.checked})}/> Help me keep up</label>
  <p>Shorter sound captions when needed, within your detail limit.</p>
  <p className="caption-explanation">{explanation} ▿ means a caption was shortened to help you keep up.</p>
  <details className="more-sound-options"><summary>More sound options</summary>
   <fieldset disabled={conservative}><legend>Punctuation inside sound captions</legend>{['None','Full stop','Exclamation'].map((label,i)=><label key={label}><input type="radio" name="punctuation" checked={profile.expression===i+1} onChange={()=>onChange({...profile,expression:(i+1) as Level})}/>{label}<small>{sample?.grid[`${profile.detail}-${i+1}`]||['[Sound]','[Sound.]','[Sound!]'][i]}</small></label>)}</fieldset>
   <p>An exclamation mark does not mean the sound is louder.</p>{conservative&&<p>Punctuation changes are unavailable for this track.</p>}
   <label htmlFor="reading-speed">Reading pace</label><select id="reading-speed" value={profile.readingSpeed} onChange={e=>onChange({...profile,readingSpeed:Number(e.target.value) as 15|17|20})}><option value={15}>Slower · 15 characters per second</option><option value={17}>17 characters per second</option><option value={20}>20 characters per second</option></select><p>Choose a comfortable pace. No single reading speed suits everyone.</p>
   <label htmlFor="representation">Sound representation</label><select id="representation" value={profile.representation} onChange={e=>onChange({...profile,representation:e.target.value as CaptionProfile['representation']})}><option value="descriptive">Descriptive</option><option value="plain">Plain sound labels</option><option value="onomatopoeic">Onomatopoeia when available</option></select><p>Unavailable sound spellings use descriptive captions.</p>
  </details>
 </>;
}
