import {test} from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_PROFILE} from '../src/lib/captions.ts';
import {loadProfile,changeProfileField} from '../src/lib/profile.ts';
test('profile storage validates malformed values and keeps detail independent of punctuation',()=>{
 assert.deepEqual(loadProfile('{broken'),DEFAULT_PROFILE);assert.deepEqual(loadProfile('{"detail":99}'),DEFAULT_PROFILE);
 const changed=changeProfileField({...DEFAULT_PROFILE,expression:1},'detail',3);assert.equal(changed.detail,3);assert.equal(changed.expression,1);
 const punctuation=changeProfileField(changed,'expression',2);assert.equal(punctuation.detail,3);assert.equal(punctuation.expression,2);
 assert.deepEqual(loadProfile(JSON.stringify(changed)),changed);
});
import {captionSample} from '../src/lib/caption-sample.ts';
import {readFileSync} from 'node:fs';
test('sample uses current or most recent past cue, never the next cue in a gap',()=>{
 const cues=JSON.parse(readFileSync('data/source-assisted-captions/soar.json','utf8')).cues;
 assert.equal(captionSample(cues,12)?.cue_id,cues.filter((c:{start_s:number})=>c.start_s<=12).at(-1).cue_id);
 assert.equal(captionSample(cues,-1)?.cue_id,cues[0].cue_id);
 assert.equal(captionSample([],12),undefined);
});
