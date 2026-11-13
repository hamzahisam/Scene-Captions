import type {CaptionCue} from '@/lib/captions';import type {CueAnnotations} from '@/lib/cue-annotations';import {densityBins} from '@/lib/sound-navigation';
export function SoundMarkers({cues,duration,annotations}:{cues:CaptionCue[];duration:number;annotations?:CueAnnotations}){
 if(!duration)return null;return <div className="sound-markers" aria-hidden="true">{densityBins(cues,duration).map(b=><i key={b.start} className="sound-bin" style={{left:`${b.start/duration*100}%`,width:`${Math.min(5,duration-b.start)/duration*100}%`,opacity:Math.min(.35,b.count*.07)}}/>)}{cues.map(c=><i key={c.cue_id} className={`sound-tick tick-${annotations?.sounds[c.cue_id]?.kind||'sfx'}`} style={{left:`${c.start_s/duration*100}%`}}/>)}</div>;
}
