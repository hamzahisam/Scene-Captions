import {createHash} from "node:crypto";
import prepared from "../../../data/captune/big-buck-bunny.json";
import review from "../../../data/captune/big-buck-bunny.review.json";
import {projectSchema} from "./project";
export function loadDemo(){
 const project=projectSchema.parse(prepared);
 const digest=createHash('sha256').update(JSON.stringify(project)).digest('hex');
 if(digest!==review.project_sha256||!review.complete_source_text_receipt||review.acoustic_validation!=='unverified'||review.dhh_study!=='not-conducted')throw Error('Prepared sample review binding failed.');
 return project;
}
export function demoSource(){const raw=process.env.DEMO_VIDEO_URL?.trim();if(raw){const u=new URL(raw);if(u.protocol!=="https:")throw Error("DEMO_VIDEO_URL must use HTTPS.");return u.href;}return "/media/big-buck-bunny.mp4";}
