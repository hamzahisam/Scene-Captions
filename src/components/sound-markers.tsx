import type {CaptionCue} from '@/lib/captions';import type {CueAnnotations} from '@/lib/cue-annotations';import {densityBins} from '@/lib/sound-navigation';
export function SoundMarkers({cues,duration,annotations}:{cues:CaptionCue[];duration:number;annotations?:CueAnnotations}){
 if(!duration)return null;return <div className="sound-markers" aria-hidden="true">{densityBins(cues,duration).filter(b=>b.count>0).map(b=>{const span=Math.min(5,duration-b.start);return <i key={b.start} className="sound-bin" style={{left:`${b.start/duration*100}%`,width:`calc(${span/duration*100}% - 2px)`,marginLeft:1,height:`${Math.min(100,25+b.count*25)}%`}}/>})}</div>;
}
