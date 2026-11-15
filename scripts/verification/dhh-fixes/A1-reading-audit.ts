import {readFileSync,writeFileSync} from 'node:fs';
import {DEFAULT_PROFILE,captionExpectations,resolveCaption,videoSchema} from '../../../src/lib/captions.ts';
const rows=[];
for(const film of ['big-buck-bunny-controls','hair-love','soar','sintel','tears-of-steel']){
 const folder=['sintel','tears-of-steel'].includes(film)?'captions':'source-assisted-captions';
 const data=videoSchema.parse(JSON.parse(readFileSync(`data/${folder}/${film}.json`,'utf8')));
 for(const readingSpeed of [17,20] as const){
  const rich=data.cues.map(c=>resolveCaption(c,{...DEFAULT_PROFILE,detail:3,readingSpeed},'personalized'));
  const balanced=data.cues.map(c=>resolveCaption(c,{...DEFAULT_PROFILE,detail:2,readingSpeed},'personalized'));
  rows.push({film:data.video_id,cps:readingSpeed,total:data.cues.length,rich_shortened:rich.filter(c=>c.adapted).length,rich_vs_balanced_different:rich.filter((c,i)=>c.text!==balanced[i].text).length,rich_over_limit:rich.filter(c=>c.overLimit).length,extension_off:captionExpectations(data,{...DEFAULT_PROFILE,detail:3,readingSpeed},'personalized'),extension_on:captionExpectations(data,{...DEFAULT_PROFILE,detail:3,readingSpeed},'personalized',false,true)});
 }
}
const output=JSON.stringify(rows,null,2)+'\n';console.log(output);if(process.argv[2])writeFileSync(process.argv[2],output);
