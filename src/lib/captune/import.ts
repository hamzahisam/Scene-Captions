import { parseSrt } from "../srt.ts";
import { projectSchema } from "./project.ts";
import type { Project } from "./project.ts";
/** Bracket/parenthesis detection is a reviewable heuristic, not semantic classification. */
export function splitNSI(text:string) {
  const matches=text.match(/\[[^\]]+\]|\([^\)]+\)/g)||[];
  return {nsi:matches.length>0,sound:matches.join("\n"),dialogue:matches.length?text.replace(/\[[^\]]+\]|\([^\)]+\)/g,"").replace(/\n\s*\n/g,"\n").trim():text};
}
export function projectFromSrt(srt:string,title="Untitled video"):Project {
  const source=parseSrt(srt);if(!source.length)throw Error("The SRT has no captions.");
  return projectSchema.parse({format:"scenecaptions-anchored-v1",revision:0,metadata:{id:"local-video",title,genre:"",synopsis:"",duration:Math.max(...source.map(c=>c.end_s)),source_url:"",credit:"Your caption file",video_sha256:""},baseline:{detail:3,expression:2},baseline_method:"manual",bounds:{lower:{detail:1,expression:1},upper:{detail:10,expression:10}},cues:source.map(c=>{
    const split=splitNSI(c.text),original=split.nsi?split.sound:c.text;
    return {id:c.id,start:c.start_s,end:c.end_s,source_text:c.text,original,dialogue:split.nsi?split.dialogue:"",nsi:split.nsi,category:split.nsi?"Unclassified sound":"Dialogue",lower:original,upper:original,edited:"",locked:false,context:{description:"",status:"missing",model:""},variants:[]};
  })});
}
export function parseProject(text:string):Project {if(text.length>50*1024*1024)throw Error("Choose a configuration smaller than 50 MB.");return projectSchema.parse(JSON.parse(text));}
export function srtTime(seconds:number){const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,"0")}:${String(Math.floor(ms/60000)%60).padStart(2,"0")}:${String(Math.floor(ms/1000)%60).padStart(2,"0")},${String(ms%1000).padStart(3,"0")}`;}
