import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFromSrt} from '../src/lib/captune/import.ts';
import {projectSchema,resolve,revise,editCaption} from '../src/lib/captune/project.ts';
import {preparedMatrixSchema,paletteSchema} from '../src/lib/captune/matrix.ts';
function prepared(){
 const p=projectFromSrt('1\n00:00:01,000 --> 00:00:03,000\n[Music]\n[Wind]');
 const palette={texts:['Test fixture caption'],regions:[{detail:[1,10],expression:[1,10],modes:['default','source','onomatopoeia','sensory'],genre:[0,1],text:0}]};
 const raw={format:'scenecaptions-compact-matrix-v1',model:'synthetic-test-fixture',prompt_version:'fixture',provenance:{kind:'source-assisted-generated-and-edited',reviewer:'test fixture, not a real review',review_kind:'source-text-editorial',acoustic_validation:'unverified',context_validation:'unverified-model-drafts',limits:'Synthetic test fixture only; not model inference or a factual caption.'},binding:{video_sha256:p.metadata.video_sha256,genre:p.metadata.genre,baseline:p.baseline,bounds:p.bounds,cues:p.cues.map(c=>({id:c.id,start:c.start,end:c.end,original:c.original,lower:c.lower,upper:c.upper}))},by_reference:[{reference:'[Music]',palette},{reference:'[Wind]',palette}]};
 p.prepared_matrix=preparedMatrixSchema.parse(raw);return projectSchema.parse(p);
}
test('compact model-selected regions cover every setting and preserve simultaneous caption lines',()=>{
 const p=prepared();let checked=0;
 for(let d=1;d<=10;d++)for(let e=1;e<=10;e++)for(const representation of ['default','source','onomatopoeia','sensory'] as const)for(const genre of [false,true]){
  const result=resolve(p.cues[0],p,{detail:d,expression:e,representation,genre});assert.equal(result.ready,true);assert.equal(result.text.split('\n').length,2);checked++;
 }assert.equal(checked,800);
});
test('compact cache rejects holes, overlaps, out-of-range text indices and stale caption/video/anchor bindings',()=>{
 const p=prepared(),palette=p.prepared_matrix!.by_reference[0].palette;
 assert.equal(paletteSchema.safeParse({...palette,regions:[]}).success,false);
 assert.equal(paletteSchema.safeParse({...palette,regions:[palette.regions[0],palette.regions[0]]}).success,false);
 assert.equal(paletteSchema.safeParse({...palette,regions:[{...palette.regions[0],text:7}]}).success,false);
 assert.equal(projectSchema.safeParse({...p,metadata:{...p.metadata,genre:'changed'}}).success,false);
 assert.equal(projectSchema.safeParse({...p,cues:[{...p.cues[0],upper:'changed'}]}).success,false);
 const revised=revise(p,{metadata:{...p.metadata,title:'edited'}});assert.equal(revised.prepared_matrix,undefined);
});
test('locks and original override take priority over complete prepared matrices',()=>{
 const p=prepared();p.cues[0].locked=true;p.cues[0].edited='Locked by the fixture';
 const s={detail:10,expression:10,representation:'sensory' as const,genre:true};
 assert.equal(resolve(p.cues[0],p,s).text,'Locked by the fixture');assert.equal(resolve(p.cues[0],p,s,true).text,'[Music]\n[Wind]');
});

test('editing/locking exact wording keeps other prepared settings; changing source anchors invalidates the matrix',()=>{
 const p=prepared(),next=editCaption(p,p.cues[0].id,{locked:true,edited:'Exact creator wording'});
 assert.ok(next.prepared_matrix);assert.equal(resolve(next.cues[0],next,{detail:10,expression:10,representation:'source',genre:true}).text,'Exact creator wording');
 assert.equal(editCaption(next,next.cues[0].id,{upper:'New anchor'}).prepared_matrix,undefined);
});
