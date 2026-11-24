import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_PROFILE,resolveCaption,resolveCaptionWindows,captionExpectations,videoSchema} from '../src/lib/captions.ts';
import type {CaptionCue,CaptionVideo} from '../src/lib/captions.ts';
import {studySessionSchema} from '../src/lib/study-session.ts';
const source=videoSchema.parse(JSON.parse(readFileSync('data/source-assisted-captions/big-buck-bunny-controls.json','utf8')));
const profile={...DEFAULT_PROFILE,detail:3 as const,readingSpeed:20 as const,adaptive:true};
function cue(id:string,start:number,end:number,text='x'.repeat(35)):CaptionCue {
 return {...source.cues[0],cue_id:id,start_s:start,end_s:end,scene_load:'quiet',grid:Object.fromEntries([1,2,3].flatMap(d=>[1,2,3].map(e=>[`${d}-${e}`,d===3?text:d===2?'x'.repeat(25):'short'])))};
}
function data(cues:CaptionCue[],duration=20):CaptionVideo{return {...source,cues,duration_seconds:duration}}
test('extension fits selected Rich text before fallback, starts at source and uses only needed time',()=>{
 const c=cue('a',2,3),d=data([c]),before=JSON.stringify(d),w=resolveCaptionWindows(d,profile,'personalized',false,true)[0];
 assert.equal(w.caption.detail,3);assert.equal(w.start_s,2);assert.equal(w.source_end_s,3);assert.equal(w.display_end_s,3.75);assert.equal(w.extended,true);assert.equal(w.caption.overLimit,false);assert.equal(JSON.stringify(d),before);
 assert.equal(resolveCaptionWindows(d,profile,'personalized')[0].caption.detail,1);
 const long=resolveCaptionWindows(data([cue('long',0,8)]),profile,'personalized',false,true)[0];assert.equal(long.display_end_s,8);assert.equal(long.extended,false);
});
test('one-second limit and next-sound gap cause fallback, never shrinking source windows',()=>{
 const d=data([cue('a',0,1,'x'.repeat(60)),cue('b',1.6,4)]),[a,b]=resolveCaptionWindows(d,profile,'personalized',false,true);
 assert.equal(a.caption.detail,2);assert.equal(a.display_end_s,1.25);assert.ok(a.display_end_s<=b.start_s-.1);assert.equal(b.display_end_s,4);
 const [tight]=resolveCaptionWindows(data([cue('a',0,1),cue('b',1.05,3)]),profile,'personalized',false,true);assert.equal(tight.display_end_s,1);
 const [limit]=resolveCaptionWindows(data([cue('a',0,1,'x'.repeat(60))]),{...profile,adaptive:false},'personalized',false,true);assert.equal(limit.display_end_s,2);assert.equal(limit.caption.overLimit,true);
 const [filmEnd]=resolveCaptionWindows(data([cue('a',0,1)],1.4),profile,'personalized',false,true);assert.ok(filmEnd.display_end_s<=1.4);
});
test('active, simultaneous and touching source sounds block added overlap, preserving existing overlap',()=>{
 for(const cues of [[cue('a',0,1),cue('b',.5,3)],[cue('a',0,1),cue('b',.5,1)],[cue('a',0,1),cue('b',1,3)]]){
  const windows=resolveCaptionWindows(data(cues),profile,'personalized',false,true);assert.equal(windows[0].display_end_s,1);
 }
 const [a,b]=resolveCaptionWindows(data([cue('a',0,3),cue('b',1,2)]),profile,'personalized',false,true);assert.equal(a.source_end_s,3);assert.equal(b.display_end_s,2);
});
test('extension off exactly matches old caption resolution; baseline and Original retain source timing',()=>{
 for(const c of source.cues){const w=resolveCaptionWindows(data([c],source.duration_seconds),profile,'personalized')[0];assert.deepEqual(w.caption,resolveCaption(c,profile,'personalized'));assert.equal(w.display_end_s,c.end_s)}
 for(const [condition,original] of [['baseline',false],['personalized',true]] as const){const w=resolveCaptionWindows(data([cue('a',0,1)]),profile,condition,original,true)[0];assert.equal(w.display_end_s,1);assert.equal(w.caption.text,w.cue.reference_text)}
});
test('expectation count matches playback, includes density separately, and Rich/Balanced differences',()=>{
 const c=cue('dense',0,5);c.scene_load='dense';const d=data([c,cue('fast',6,7),cue('rich',9,15)]);
 const counts=captionExpectations(d,profile,'personalized');assert.deepEqual(counts,{total:3,shortened:2,paceShortened:1,densityShortened:1,overLimit:0,extended:0,differentFromBalanced:1});
 assert.equal(captionExpectations(d,{...profile,adaptive:false},'personalized').shortened,0);
 assert.deepEqual(captionExpectations(data([]),profile,'personalized'),{total:0,shortened:0,paceShortened:0,densityShortened:0,overLimit:0,extended:0,differentFromBalanced:0});
});
test('BBB, Hair Love and Soar reproduce original Rich counts at 17/20 cps with extension off',()=>{
 const expected={'big-buck-bunny-controls':[[62,24],[55,31]],'hair-love':[[9,6],[9,6]],soar:[[14,35],[12,37]]};
 for(const [film,values] of Object.entries(expected))for(const [i,readingSpeed] of ([17,20] as const).entries()){
  const d=videoSchema.parse(JSON.parse(readFileSync(`data/source-assisted-captions/${film}.json`,'utf8'))),counts=captionExpectations(d,{...profile,readingSpeed},'personalized');assert.deepEqual([counts.shortened,counts.differentFromBalanced],values[i]);
  const windows=resolveCaptionWindows(d,{...profile,readingSpeed},'personalized',false,true);
  for(const w of windows){assert.ok(w.display_end_s>=w.source_end_s);assert.ok(w.display_end_s<=Math.min(w.source_end_s+1,d.duration_seconds));if(w.extended)for(const other of d.cues)if(other!==w.cue){assert.ok(!(other.start_s<w.source_end_s&&other.end_s>=w.source_end_s));if(other.start_s>=w.source_end_s)assert.ok(w.display_end_s<=other.start_s-.1+1e-9)}}
 }
});
test('legacy profiles hide shortening marks and legacy sessions disable display extension',()=>{
 assert.equal(DEFAULT_PROFILE.markShortened,false);
 const s=studySessionSchema.parse({id:'synthetic-001',participantId:'P-001',group:'adult',background:'frequent',design:'between',seed:'frozen',allocationSlot:'frequent-1',sequence:[{filmId:'soar',condition:'personalized'}],readingSpeed:17,createdAt:'2026-11-13T00:00:00.000Z'});assert.equal(s.extendDisplay,false);assert.equal(studySessionSchema.parse({...s,extendDisplay:true}).extendDisplay,true);
});

test('dialogue blocks extension into speech and rate describes actual fallback window',()=>{
 const d=data([cue('a',0,1)]);d.dialogue=[{cue_id:'speech',start_s:1.2,end_s:3,text:'Hello'}];
 assert.ok(Math.abs(resolveCaptionWindows(d,{...profile,adaptive:false},'personalized',false,true)[0].display_end_s-1.1)<1e-9);
 d.dialogue[0].start_s=.5;assert.equal(resolveCaptionWindows(d,profile,'personalized',false,true)[0].display_end_s,1);
 const fallback=cue('fallback',0,1,'x'.repeat(100));fallback.grid['2-2']='x'.repeat(10);
 const w=resolveCaptionWindows(data([fallback]),profile,'personalized',false,true)[0];assert.equal(w.caption.detail,2);assert.equal(w.display_end_s,1);assert.equal(w.caption.cps,10);assert.equal(w.caption.overLimit,false);
});
