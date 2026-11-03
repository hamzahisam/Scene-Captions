import { projectSchema } from "./project.ts";
import type { Project } from "./project.ts";
import type { CaptionVideo } from "../captions.ts";
/** Reuses only actual prepared wording. Empty grid cells are never invented by string interpolation. */
export function demoProject(base:CaptionVideo,prepared:CaptionVideo):Project {
 return projectSchema.parse({format:"scenecaptions-anchored-v1",revision:0,metadata:{id:base.video_id,title:base.title,genre:"Animation",synopsis:"",duration:base.duration_seconds,source_url:base.source_url,credit:base.attribution+" · "+(base.generated_with.caption_source?.author||"")+" · "+base.license,video_sha256:base.generated_with.source_sha256||""},baseline:{detail:3,expression:2},baseline_method:"manual",bounds:{lower:{detail:1,expression:1},upper:{detail:10,expression:10}},cues:base.cues.map((c,i)=>{
 const existing=prepared.cues[i];const original=c.reference_text||c.original_text;
 return {id:c.cue_id,start:c.start_s,end:c.end_s,source_text:original,original,dialogue:"",nsi:true,category:c.sound_key,lower:existing.grid["1-2"],upper:existing.grid["3-2"],edited:"",locked:false,context:{description:"",status:"missing",model:""},variants:([1,2,3] as const).map(d=>({setting:{detail:({1:1,2:6,3:10} as const)[d],expression:2,representation:"default",genre:false},text:existing.grid[`${d}-2`],status:"draft",model:prepared.generated_with.model||"Recorded source-guided draft"}))};
 })});
}
