import {test} from 'node:test';
import assert from 'node:assert/strict';
import {permutedBlocks,balancedLatinSquare,pilotSequence,betweenSequence,allocationCsv,importAllocation} from '../src/lib/allocation.ts';
import type {StudyCondition} from '../src/lib/allocation.ts';
import {participantIdSchema,studySessionSchema,validateRegistry,nextPilotSlot,resolvePilotSlot,pilotSlotId,profileNamespace,sessionDefaults} from '../src/lib/study-session.ts';
import type {StudySession} from '../src/lib/study-session.ts';

function pilotSession(n:number,conditionCount:2|3,slot:number,extra:Partial<StudySession>={}):StudySession{
 const films=conditionCount===2?['soar','hair-love']:['soar','hair-love','sintel'];
 const conditions:StudyCondition[]=conditionCount===2?['baseline','personalized']:['essential','balanced','rich'];
 return studySessionSchema.parse({id:`synthetic-${String(n).padStart(3,'0')}`,participantId:`P-${String(n).padStart(3,'0')}`,group:'adult',background:'frequent',design:'within-pilot',seed:'frozen',allocationSlot:pilotSlotId(conditionCount,slot),sequence:pilotSequence(films,conditions,slot),readingSpeed:17,createdAt:'2026-11-13T00:00:00.000Z',...extra});
}
function registryOf(sessions:StudySession[]){return JSON.stringify({seed:'frozen',allocations:[],sessions:Object.fromEntries(sessions.map(s=>[s.id,s]))})}

test('seeded stratified blocks balance every block and CSV round-trips fixed assignments',()=>{const rows=permutedBlocks('frozen',8);assert.deepEqual(rows,permutedBlocks('frozen',8));for(let i=0;i<rows.length;i+=4){assert.equal(rows.slice(i,i+4).filter(r=>r.condition==='baseline').length,2);assert.equal(new Set(rows.slice(i,i+4).map(r=>r.stratum)).size,1)}rows[0].participantId='P-001';assert.deepEqual(importAllocation(allocationCsv(rows)),rows);assert.throws(()=>importAllocation('wrong,header'));assert.equal(participantIdSchema.safeParse('Hamza').success,false);assert.equal(participantIdSchema.safeParse('P-001').success,true);});

test('four two-condition pilot sequences cross films and condition order; Williams balances carry-over',()=>{
 const expected=[
  [{filmId:'soar',condition:'baseline'},{filmId:'hair-love',condition:'personalized'}],
  [{filmId:'hair-love',condition:'baseline'},{filmId:'soar',condition:'personalized'}],
  [{filmId:'soar',condition:'personalized'},{filmId:'hair-love',condition:'baseline'}],
  [{filmId:'hair-love',condition:'personalized'},{filmId:'soar',condition:'baseline'}],
 ];
 const sequences=Array.from({length:4},(_,i)=>pilotSequence(['soar','hair-love'],['baseline','personalized'],i));
 assert.deepEqual(sequences,expected);
 assert.equal(new Set(sequences.map(s=>JSON.stringify(s))).size,4);
 assert.equal(JSON.stringify(pilotSequence(['soar','hair-love'],['baseline','personalized'],4)),JSON.stringify(sequences[0]));
 assert.throws(()=>pilotSequence(['soar','soar'],['baseline','personalized'],0));
 for(const n of [3,4]){const rows=balancedLatinSquare(n);for(let col=0;col<n;col++)for(let value=0;value<n;value++)assert.equal(rows.filter(r=>r[col]===value).length,rows.length/n);const pairs=new Map<string,number>();for(const r of rows)for(let i=1;i<n;i++){const k=`${r[i-1]}-${r[i]}`;pairs.set(k,(pairs.get(k)||0)+1)}assert.equal(pairs.size,n*(n-1));assert.equal(new Set(pairs.values()).size,1);}
});

test('eighteen three-condition slots balance films, conditions and film-condition pairs',()=>{
 const films=['soar','hair-love','sintel'];
 const conditions:StudyCondition[]=['essential','balanced','rich'];
 const sequences=Array.from({length:18},(_,slot)=>pilotSequence(films,conditions,slot));
 assert.equal(new Set(sequences.map(s=>JSON.stringify(s))).size,18);
 for(let position=0;position<3;position++){
  for(const film of films)assert.equal(sequences.filter(s=>s[position].filmId===film).length,6);
  for(const condition of conditions)assert.equal(sequences.filter(s=>s[position].condition===condition).length,6);
 }
 const pairs=new Map<string,number>();
 for(const sequence of sequences)for(const {filmId,condition} of sequence){const key=`${filmId}:${condition}`;pairs.set(key,(pairs.get(key)||0)+1)}
 assert.equal(pairs.size,9);
 for(const count of pairs.values())assert.equal(count,6);
 assert.throws(()=>pilotSequence(films,conditions,18));
 assert.throws(()=>pilotSequence(['soar','hair-love'],conditions,0));
});

test('between sessions rotate film order by allocation row index within stratum and save the sequence',()=>{
 const films=['soar','hair-love','sintel'];
 assert.deepEqual(betweenSequence(films,'baseline',0).map(x=>x.filmId),films);
 assert.deepEqual(betweenSequence(films,'baseline',1).map(x=>x.filmId),['hair-love','sintel','soar']);
 assert.deepEqual(betweenSequence(films,'baseline',2).map(x=>x.filmId),['sintel','soar','hair-love']);
 assert.deepEqual(betweenSequence(films,'baseline',3).map(x=>x.filmId),films);
 assert.ok(betweenSequence(films,'personalized',1).every(x=>x.condition==='personalized'));
 const sequence=betweenSequence(films,'baseline',1);
 const s=studySessionSchema.parse({id:'synthetic-010',participantId:'P-010',group:'adult',background:'frequent',design:'between',seed:'frozen',allocationSlot:'frequent-2',sequence,readingSpeed:17,createdAt:'2026-11-13T00:00:00.000Z'});
 assert.deepEqual(validateRegistry(JSON.stringify({seed:'frozen',allocations:permutedBlocks('frozen',4),sessions:{[s.id]:s}})).sessions[s.id].sequence,sequence);
});

test('saved assignments stay fixed and participant defaults never use the shared demo namespace',()=>{const s=studySessionSchema.parse({id:'synthetic-001',participantId:'P-001',group:'child',background:'frequent',design:'between',seed:'frozen',allocationSlot:'frequent-1',sequence:[{filmId:'soar',condition:'baseline'}],readingSpeed:17,createdAt:'2026-11-13T00:00:00.000Z'});const raw=JSON.stringify({seed:'frozen',allocations:permutedBlocks('frozen',4),sessions:{[s.id]:s}});assert.deepEqual(validateRegistry(raw).sessions[s.id],s);assert.equal(sessionDefaults(s).adaptive,false);assert.equal(sessionDefaults(s).readingSpeed,17);assert.notEqual(profileNamespace(s),profileNamespace({...s,id:'synthetic-002',participantId:'P-002'}));assert.throws(()=>studySessionSchema.parse({...s,sequence:[...s.sequence,{filmId:'hair-love',condition:'personalized'}]}));});

test('next pilot slot comes from saved sessions and groups two- and three-condition schemes',()=>{
 const two0=pilotSession(1,2,0),two1=pilotSession(2,2,1),three0=pilotSession(3,3,0);
 const sessions={[two0.id]:two0,[two1.id]:two1,[three0.id]:three0};
 assert.equal(nextPilotSlot(sessions,2),2);
 assert.equal(nextPilotSlot(sessions,3),1);
 assert.equal(resolvePilotSlot(sessions,2).allocationSlot,'pilot-2-2');
 assert.equal(resolvePilotSlot(sessions,3).allocationSlot,'pilot-3-1');
 const legacy=studySessionSchema.parse({...pilotSession(4,2,0),allocationSlot:'pilot-0'});
 assert.equal(nextPilotSlot({[legacy.id]:legacy},2),1);
 assert.equal(pilotSlotId(2,0),'pilot-2-0');
 assert.notEqual(pilotSlotId(2,0),pilotSlotId(3,0));
 const full:Record<string,StudySession>={};
 for(let slot=0;slot<18;slot++){const s=pilotSession(100+slot,3,slot);full[s.id]=s}
 assert.equal(nextPilotSlot(full,3),18);
 assert.throws(()=>resolvePilotSlot(full,3),/All 18/);
 assert.equal(resolvePilotSlot(full,3,{slot:0,reason:'Repeat after all slots are assigned.'}).allocationSlot,'pilot-3-0');
 assert.throws(()=>resolvePilotSlot(full,3,{slot:18,reason:'Out of range.'}));
});

test('a repeated pilot slot needs an explicit reasoned override stored in the session',()=>{
 const first=pilotSession(1,2,0),duplicate=pilotSession(2,2,0);
 assert.throws(()=>validateRegistry(registryOf([first,duplicate])),/assigned more than once/);
 const reason='Same slot needed for the second pilot room.';
 const reasoned=studySessionSchema.parse({...duplicate,slotOverride:{reason}});
 const saved=validateRegistry(registryOf([first,reasoned])).sessions[reasoned.id];
 assert.deepEqual(saved.slotOverride,{reason});
 assert.doesNotThrow(()=>validateRegistry(registryOf([reasoned,first])));
 assert.throws(()=>studySessionSchema.parse({...duplicate,slotOverride:{reason:'   '}}));
 assert.throws(()=>resolvePilotSlot({[first.id]:first},2,{slot:0,reason:'  '}));
 assert.deepEqual(resolvePilotSlot({[first.id]:first},2,{slot:0,reason:` ${reason} `}),{slot:0,allocationSlot:'pilot-2-0',slotOverride:{reason}});
 const three=pilotSession(3,3,0);
 assert.doesNotThrow(()=>validateRegistry(registryOf([first,three])));
});
import {canonicalFilms,claimBetweenRow} from '../src/lib/study-session.ts';
test('film checkbox order never changes the saved rotation',()=>{
 const forward=canonicalFilms(['soar','hair-love','big-buck-bunny']),reversed=canonicalFilms(['big-buck-bunny','hair-love','soar']);
 assert.deepEqual(forward,['big-buck-bunny','soar','hair-love']);assert.deepEqual(forward,reversed);
 for(let row=0;row<6;row++)assert.deepEqual(betweenSequence(forward,'personalized',row),betweenSequence(reversed,'personalized',row));
});
test('a stale tab claims the next fresh row and never reuses or overwrites a consumed slot',()=>{
 const rows=[{slot:'frequent-1',stratum:'frequent',condition:'baseline'},{slot:'frequent-2',stratum:'frequent',condition:'personalized'},{slot:'occasional-1',stratum:'occasional',condition:'baseline'}] as never[];
 const tabA=claimBetweenRow(rows,'frequent','P-001')!;
 assert.equal(tabA.row.slot,'frequent-1');assert.equal(tabA.index,0);
 // Tab B still holds the old rows, but create() reads the registry saved by tab A.
 const fresh=tabA.rows,tabB=claimBetweenRow(fresh,'frequent','P-002')!;
 assert.equal(tabB.row.slot,'frequent-2');assert.equal(tabB.index,1);
 const final=tabB.rows as {slot:string;participantId?:string}[];
 assert.deepEqual(final.map(r=>[r.slot,r.participantId]),[['frequent-1','P-001'],['frequent-2','P-002'],['occasional-1',undefined]]);
 assert.equal(claimBetweenRow(final as never,'frequent','P-003'),null);
});
