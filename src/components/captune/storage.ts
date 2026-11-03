import { parseProject } from "@/lib/captune/import";
import { settingSchema } from "@/lib/captune/project";
import type { Project,Setting } from "@/lib/captune/project";
export const PROJECT_KEY="scenecaptions.anchored-project.v1",PROFILE_KEY="scenecaptions.anchored-profile.v1";
export function loadProject(){const raw=localStorage.getItem(PROJECT_KEY);return raw?parseProject(raw):null;}
export function saveProject(p:Project){localStorage.setItem(PROJECT_KEY,JSON.stringify(p));}
export function loadSetting():Setting|null {const raw=localStorage.getItem(PROFILE_KEY);if(!raw)return null;const parsed=settingSchema.safeParse(JSON.parse(raw));return parsed.success?parsed.data:null;}
export function download(name:string,value:unknown){const url=URL.createObjectURL(new Blob([typeof value==="string"?value:JSON.stringify(value,null,2)],{type:typeof value==="string"?"text/plain":"application/json"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function readFile(file:File){if(file.size>50*1024*1024)throw Error("Choose a caption/configuration file smaller than 50 MB.");return file.text();}
