import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {validateAnnotations,speakerText} from '../src/lib/cue-annotations.ts';import {videoSchema} from '../src/lib/captions.ts';
test('annotation sidecars bind known cues without mutating protected captions',()=>{const data=videoSchema.parse(JSON.parse(readFileSync('data/source-assisted-captions/hair-love.json','utf8')));const before=JSON.stringify(data);const a=validateAnnotations(data,JSON.parse(readFileSync('data/cue-annotations/hair-love.json','utf8')));assert.equal(a.status,'heuristic-draft');assert.equal(a.dialogue['hair-love-dialogue-001'].speaker,'Angela');assert.equal(speakerText('Angela: hello','Angela'),'hello');assert.equal(speakerText('Angela: hello'),'Angela: hello');assert.equal(JSON.stringify(data),before);assert.throws(()=>validateAnnotations(data,{...a,video_id:'other'}));assert.throws(()=>validateAnnotations(data,{...a,sounds:{bad:{kind:'sfx'}}}));});
import {reviewedSpeaker,dialogueParts,dialogueNativeText} from '../src/lib/cue-annotations.ts';
const base={video_id:'v',status:'reviewed' as const,sounds:{},dialogue:{d1:{speaker:'Angela'}}};
test('speaker chips need reviewed dialogue; dialogue_status overrides the global status',()=>{
 assert.equal(reviewedSpeaker(base,'d1'),'Angela');
 assert.equal(reviewedSpeaker({...base,status:'heuristic-draft'},'d1'),undefined);
 assert.equal(reviewedSpeaker({...base,dialogue_status:'heuristic-draft'},'d1'),undefined);
 assert.equal(reviewedSpeaker({...base,status:'heuristic-draft',dialogue_status:'reviewed'},'d1'),'Angela');
 assert.equal(reviewedSpeaker(base,'missing'),undefined);assert.equal(reviewedSpeaker(undefined,'d1'),undefined);
});
test('reviewed speakers drop the source prefix for the chip and restore ": " for native/telemetry text',()=>{
 assert.deepEqual(dialogueParts('Angela: hello\nthere','Angela'),{speaker:'Angela',text:'hello\nthere'});
 assert.deepEqual(dialogueParts('hello','Angela'),{speaker:'Angela',text:'hello'});
 assert.equal(dialogueNativeText('Angela: hello','Angela'),'Angela: hello');
 assert.equal(dialogueNativeText('hello','Angela'),'Angela: hello');
 // Unreviewed attributions use the source unchanged, including any source prefix.
 assert.deepEqual(dialogueParts('Angela: hello'),{text:'Angela: hello'});
 assert.equal(dialogueNativeText('Angela: hello'),'Angela: hello');
 assert.equal(dialogueNativeText('plain'),'plain');
});
