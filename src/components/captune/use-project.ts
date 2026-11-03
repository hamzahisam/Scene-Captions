"use client";
import { useEffect,useRef,useState } from "react";
import type { Project } from "@/lib/captune/project";
import { loadProject,saveProject,readFile } from "./storage";
import { parseProject } from "@/lib/captune/import";
export function useProject(initial:Project,demoSource:string){
 const [project,setProject]=useState(initial),[notice,setNotice]=useState(""),[source,setSource]=useState(demoSource),[localVideo,setLocalVideo]=useState(false),[hydrated,setHydrated]=useState(false),[storageWarning,setStorageWarning]=useState("");
 const blob=useRef<string|null>(null),videoRequest=useRef(0);
 useEffect(()=>{try{const saved=loadProject();if(saved){setProject(saved);if(saved.metadata.video_sha256!==initial.metadata.video_sha256){setSource("");setNotice("Open the MP4 matching this saved project.");}}}catch{setNotice("Saved project could not be loaded. Import its JSON to recover it.");}setHydrated(true);return()=>{if(blob.current)URL.revokeObjectURL(blob.current);};},[initial.metadata.video_sha256]);
 function change(next:Project){setProject(next);try{saveProject(next);setStorageWarning("");setNotice("Project saved in this browser.");}catch{setStorageWarning("Browser storage is full or unavailable. Export JSON to keep this project, then import it in the other workspace.");}}
 function replace(next:Project){videoRequest.current++;change(next);setLocalVideo(false);if(blob.current){URL.revokeObjectURL(blob.current);blob.current=null;}if(next.metadata.video_sha256&&next.metadata.video_sha256===initial.metadata.video_sha256){setSource(demoSource);}else{setSource("");setNotice("Configuration imported. Open its matching video.");}}
 async function openProject(file:File){try{replace(parseProject(await readFile(file)));}catch(e){setNotice(e instanceof Error?e.message:"Configuration could not be imported.");}}
 async function openVideo(file:File){const request=++videoRequest.current;setSource("");setNotice("Checking local video…");try{
 if(project.metadata.video_sha256){if(file.size>1024*1024*1024)throw Error("Hash checking supports local videos up to 1 GB. Use a prepared smaller edit.");const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",await file.arrayBuffer()))].map(b=>b.toString(16).padStart(2,"0")).join("");if(hash!==project.metadata.video_sha256)throw Error("This MP4 does not match the configuration's exact video hash.");}
 if(request!==videoRequest.current)return;if(blob.current)URL.revokeObjectURL(blob.current);blob.current=URL.createObjectURL(file);setSource(blob.current);setLocalVideo(true);setNotice(project.metadata.video_sha256?"Exact video hash matched. Playback is local.":"Local video opened. No hash is supplied; confirm this is the exact captioned edit.");
 }catch(e){if(request===videoRequest.current)setNotice(e instanceof Error?e.message:"Video could not be opened.");}}
 return {project,change,notice,setNotice,source,localVideo,openVideo,openProject,replace,hydrated,storageWarning};
}
