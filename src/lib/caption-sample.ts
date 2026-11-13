import type {CaptionCue} from './captions.ts';
/** Only a past/current cue; first cue is the explicitly requested pre-play sample. */
export function captionSample(cues:CaptionCue[],time:number):CaptionCue|undefined {return cues.find(c=>c.start_s<=time&&time<c.end_s)||[...cues].reverse().find(c=>c.start_s<=time)||cues[0];}
