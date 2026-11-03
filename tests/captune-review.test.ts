import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFromSrt} from '../src/lib/captune/import.ts';
import {reviewPacket,checkReview} from '../scripts/captune/review.ts';
import {acceptResult} from '../src/lib/captune/results.ts';
const setting={detail:2,expression:1,representation:'default' as const,genre:false};
function project(){const p=projectFromSrt('1\n00:00:01,000 --> 00:00:02,000\n[Music]');p.baseline={detail:1,expression:1};p.bounds={lower:{detail:1,expression:1},upper:{detail:1,expression:1}};return p;}
test('review packet exposes missing styles and cannot convert an incomplete matrix into reviewed output',()=>{
 const p=project(),packet=reviewPacket(p);assert.equal(packet.coverage.settings,8);assert.equal(packet.coverage.missing,7);assert.equal(packet.coverage.baseline,1);assert.equal(packet.groups.length,0);
 assert.throws(()=>checkReview(p,{format:packet.format,project_sha256:packet.project_sha256,reviewer:'Test fixture',groups:[]}));
});
test('source-text receipt is snapshot-bound, group-complete and explicitly not an acoustic or participant approval',()=>{
 let p=project();
 for(const representation of ['default','source','onomatopoeia','sensory'] as const)for(const genre of [false,true]){
  if(representation==='default'&&!genre)continue;
  p=acceptResult(p,{detail:1,expression:1,representation,genre},{captions:[{id:'1',text:'[Music plays]'}],assessed:{detail:1,expression:1}},'test-fixture');
 }
 const packet=reviewPacket(p);assert.equal(packet.coverage.missing,0);assert.equal(packet.groups.length,1);assert.equal(packet.groups[0].occurrences.length,7);
 const receipt={format:packet.format,project_sha256:packet.project_sha256,reviewer:'Synthetic test fixture, not a real review',groups:packet.groups.map(g=>({...g,decision:'accept',checks:Object.fromEntries(Object.keys(g.checks).map(k=>[k,true])),note:'Synthetic test of receipt validation only.'}))};
 const checked=checkReview(p,receipt);assert.equal(checked.complete_source_text_receipt,true);assert.equal(checked.acoustic_validation,'unverified');assert.equal(checked.dhh_study,'not-conducted');
 assert.throws(()=>checkReview(p,{...receipt,groups:[]}));assert.throws(()=>checkReview(p,{...receipt,groups:[receipt.groups[0],receipt.groups[0]]}));assert.throws(()=>checkReview({...p,revision:1},receipt));
});
