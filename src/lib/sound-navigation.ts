export function adjacentSound(cues:{start_s:number}[],time:number,direction:'previous'|'next'){
 const anchor=time+.5;const cue=direction==='next'?cues.find(c=>c.start_s>anchor+.001):[...cues].reverse().find(c=>c.start_s<anchor-.001);
 return cue?Math.max(0,cue.start_s-.5):null;
}
export function densityBins(cues:{start_s:number}[],duration:number){return Array.from({length:Math.ceil(duration/5)},(_,i)=>({start:i*5,count:cues.filter(c=>c.start_s>=i*5&&c.start_s<(i+1)*5).length}));}
