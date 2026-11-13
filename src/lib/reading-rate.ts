type Detail=1|2|3;
export function characterCount(text:string){return [...text.replace(/[\r\n]/g,'')].length;}
export function readingRate(text:string,duration:number){return duration>0?characterCount(text)/duration:Infinity;}
export function readingBoundedDetail(maximum:Detail,duration:number,cap:number,text:(d:Detail)=>string){
 for(let d=maximum;d>=1;d--)if(readingRate(text(d as Detail),duration)<=cap)return {detail:d as Detail,overLimit:false};
 return {detail:1 as Detail,overLimit:true};
}
