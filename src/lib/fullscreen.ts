type WebkitFrame=HTMLElement&{webkitRequestFullscreen?:()=>Promise<void>|void};
type WebkitVideo=HTMLVideoElement&{webkitEnterFullscreen?:()=>void};
export async function toggleFullscreen(frame:HTMLElement|null,video:HTMLVideoElement|null){
 if(document.fullscreenElement){await document.exitFullscreen();return}
 if(frame?.requestFullscreen){try{await frame.requestFullscreen();return}catch{/* Try native fallback on unsupported containers. */}}
 if((frame as WebkitFrame)?.webkitRequestFullscreen){try{await (frame as WebkitFrame).webkitRequestFullscreen!();return}catch{/* Try the video fallback. */}}
 if((video as WebkitVideo)?.webkitEnterFullscreen){(video as WebkitVideo).webkitEnterFullscreen!();return}
 throw Error('Fullscreen is unavailable in this browser.');
}
