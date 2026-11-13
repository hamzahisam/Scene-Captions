import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const count = text => [...text.replace(/[\r\n]/g, '')].length;
export function rates(track, resolver) {
 return [1,2,3].map(detail=>({detail, cues:track.cues.length,over17:track.cues.filter(c=>count(resolver?resolver(c,detail,17):c.grid[`${detail}-2`])/(c.end_s-c.start_s)>17).length,over20:track.cues.filter(c=>count(resolver?resolver(c,detail,20):c.grid[`${detail}-2`])/(c.end_s-c.start_s)>20).length,shorterThan083:track.cues.filter(c=>c.end_s-c.start_s<.83).length}));
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 let resolver;
 if(process.argv.includes('--adapted')){
  const {resolveCaption,DEFAULT_PROFILE}=await import('../../src/lib/captions.ts');
  resolver=(cue,detail,readingSpeed)=>resolveCaption(cue,{...DEFAULT_PROFILE,detail,readingSpeed,adaptive:true},'personalized').text;
 }
 console.log(JSON.stringify(readdirSync('data/source-assisted-captions').filter(f=>f.endsWith('.json')).map(file=>({file,levels:rates(JSON.parse(readFileSync(`data/source-assisted-captions/${file}`,'utf8')),resolver)})),null,2));
}
