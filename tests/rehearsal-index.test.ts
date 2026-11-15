import {test} from 'node:test';import assert from 'node:assert/strict';
import {TelemetryRecorder} from '../src/lib/telemetry-storage.ts';
import type {TelemetryContext} from '../src/lib/telemetry.ts';
import {REHEARSAL_INDEX_KEY,deleteRehearsalLog,findOpenRehearsal,listRehearsalLogs,migrateLegacyLogs,newRehearsalId,openRehearsalRecorder,parseRehearsalId,randomUuid,readIndex,rehearsalContext,touchIndexEntry} from '../src/lib/rehearsal-index.ts';

function fakeStore(){const data=new Map<string,string>();return {data,getItem:(k:string)=>data.has(k)?data.get(k)!:null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)},keys:()=>[...data.keys()]}}
const UUID_A='11111111-1111-4111-8111-111111111111',UUID_B='22222222-2222-4222-8222-222222222222',UUID_C='33333333-3333-4333-8333-333333333333';
function clock(){let t=0;return ()=>++t}
// Records `events` play events into a rehearsal. `close` stops it; otherwise the log stays open.
function run(store:ReturnType<typeof fakeStore>,id:string,film:string,events:number,close:boolean,kind:'demo'|'lab'='demo',at='2026-11-15T10:00:00.000Z'){
 const r=new TelemetryRecorder(rehearsalContext(id,film,'test'),store,clock());r.start(0);for(let i=0;i<events;i++)r.append({type:'play',video_s:i});if(close)r.stop(events);
 touchIndexEntry(store,{id,kind,filmId:film,createdAt:at,legacy:parseRehearsalId(id)!.legacy});return r;
}
function snapshot(store:ReturnType<typeof fakeStore>){return JSON.stringify([...store.data.entries()].sort())}

test('the real recorder defaults to paused read-only for a saved demo, while a fresh run can start',()=>{
 const store=fakeStore(),context=rehearsalContext(newRehearsalId('demo','bbb',UUID_A),'bbb','test');
 const first=new TelemetryRecorder(context,store,clock());first.start(0);first.append({type:'play',video_s:4});
 const before=snapshot(store),loaded=new TelemetryRecorder(context,store,clock());
 assert.equal(loaded.recording,false);assert.equal(loaded.readOnly,true);assert.equal(loaded.resumed,false);
 loaded.start(4);loaded.append({type:'play',video_s:5});
 assert.equal(snapshot(store),before);
 const resumed=openRehearsalRecorder(store,context.session_id,'resume',clock());
 assert.equal(resumed.recording,true);assert.equal(resumed.events.at(-1)?.type,'session_resume');
});

test('each rehearsal run gets a unique ID that keeps its film and kind; legacy fixed IDs are recognised',()=>{
 const ids=Array.from({length:1000},()=>newRehearsalId('demo','bbb',randomUuid()));
 assert.equal(new Set(ids).size,1000);
 assert.deepEqual(parseRehearsalId(ids[0]),{kind:'demo',filmId:'bbb',legacy:false});
 assert.deepEqual(parseRehearsalId(newRehearsalId('lab','soar-v2',UUID_A)),{kind:'lab',filmId:'soar-v2',legacy:false});
 assert.deepEqual(parseRehearsalId('rehearsal-bbb'),{kind:'demo',filmId:'bbb',legacy:true});
 assert.deepEqual(parseRehearsalId('lab-bbb'),{kind:'lab',filmId:'bbb',legacy:true});
 assert.equal(parseRehearsalId('study-uuid-without-prefix'),null);
 assert.match(randomUuid(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('separate rehearsal logs stay separate and are listed newest first, with lab kept apart',()=>{
 const store=fakeStore();
 const a=newRehearsalId('demo','bbb',UUID_A),b=newRehearsalId('demo','bbb',UUID_B),c=newRehearsalId('lab','bbb',UUID_C);
 run(store,a,'bbb',3,false,'demo','2026-11-15T10:00:00.000Z');
 run(store,b,'bbb',5,true,'demo','2026-11-15T11:00:00.000Z');
 run(store,c,'bbb',2,true,'lab','2026-11-15T09:00:00.000Z');
 const demo=listRehearsalLogs(store,'demo');
 assert.deepEqual(demo.map(l=>l.id),[b,a]);
 assert.equal(listRehearsalLogs(store,'lab').length,1);
 const readA=openRehearsalRecorder(store,a,'read');
 assert.ok(readA.events.every(e=>e.session_id===a));
 assert.equal(readA.events.filter(e=>e.type==='play').length,3);
 assert.equal(openRehearsalRecorder(store,b,'read').events.filter(e=>e.type==='play').length,5);
});

test('legacy fixed rehearsal-film and lab-film logs are detected, migrated once and kept readable',()=>{
 const store=fakeStore();
 const legacyEvents=run(store,'rehearsal-bbb',"bbb",4,true,'demo').events.length;
 run(store,'lab-bbb','bbb',2,false,'lab');
 store.data.delete(REHEARSAL_INDEX_KEY);                  // simulate an index that never recorded them
 const demo=listRehearsalLogs(store,'demo');
 assert.equal(demo.length,1);
 assert.equal(demo[0].id,'rehearsal-bbb');assert.equal(demo[0].legacy,true);assert.equal(demo[0].createdAt,null);assert.equal(demo[0].recording,false);
 assert.equal(migrateLegacyLogs(store),2);
 assert.equal(migrateLegacyLogs(store),0);
 assert.equal(readIndex(store).entries.length,2);
 assert.equal(openRehearsalRecorder(store,'rehearsal-bbb','read').events.length,legacyEvents);   // migration keeps every event
 assert.equal(findOpenRehearsal(store,'lab','bbb')?.id,'lab-bbb');
 assert.equal(findOpenRehearsal(store,'demo','bbb'),null);
});

test('demo load never auto-resumes: a left-open log is found but nothing is appended, started or written',()=>{
 const store=fakeStore();
 const open=newRehearsalId('demo','bbb',UUID_A);
 run(store,open,'bbb',3,false);
 const before=snapshot(store);
 const prior=findOpenRehearsal(store,'demo','bbb');
 assert.equal(prior?.id,open);assert.equal(prior?.recording,true);
 // A demo mount creates a brand-new, unstarted recorder rather than reopening the saved log.
 const fresh=new TelemetryRecorder(rehearsalContext(newRehearsalId('demo','bbb',UUID_B),'bbb',"test"),store,clock());
 assert.equal(fresh.recording,false);assert.equal(fresh.resumed,false);assert.equal(fresh.events.length,0);
 assert.equal(snapshot(store),before);
});

test('study sessions still auto-resume on reload, with cross-film continuity unchanged',()=>{
 const store=fakeStore();
 const ctx:TelemetryContext={session_id:'study-session-1',participant_id:'P-001',design:'between',assigned_condition:'personalized',sequence_index:0,film_id:'bbb',app_version:'test'};
 const r=new TelemetryRecorder(ctx,store,clock());r.start(0);r.append({type:'play',video_s:42});
 const again=new TelemetryRecorder(ctx,store,clock());
 assert.equal(again.resumed,true);assert.equal(again.recording,true);assert.equal(again.resumePosition,42);
 assert.equal(again.events.at(-1)?.type,'session_resume');
 const nextFilm=new TelemetryRecorder({...ctx,sequence_index:1,film_id:'soar'},store,clock());
 assert.equal(nextFilm.resumePosition,0);
});

test('explicit consent resumes only the chosen log and appends a single session_resume',()=>{
 const store=fakeStore();
 const open=newRehearsalId('demo','bbb',UUID_A),closed=newRehearsalId('demo','bbb',UUID_B);
 run(store,open,'bbb',3,false);run(store,closed,'bbb',2,true);
 const closedBefore=snapshot(store).split(closed).length;
 const before=openRehearsalRecorder(store,open,'read').events.length;
 const r=openRehearsalRecorder(store,open,'resume');
 assert.equal(r.resumed,true);assert.equal(r.recording,true);
 assert.equal(r.events.length,before+1);assert.equal(r.events.at(-1)?.type,'session_resume');
 r.append({type:'play',video_s:9});
 assert.equal(openRehearsalRecorder(store,open,'read').events.length,before+2);
 assert.equal(snapshot(store).split(closed).length,closedBefore);   // the closed log was not touched
});

test('export opens a saved log read-only: no session_resume and no writes, even when the log was open',()=>{
 const store=fakeStore();
 const open=newRehearsalId('lab','bbb',UUID_A);
 run(store,open,'bbb',3,false,'lab');
 const before=snapshot(store);
 const r=openRehearsalRecorder(store,open,'read');
 assert.equal(r.resumed,false);assert.equal(r.readOnly,true);
 const count=r.events.length;
 r.append({type:'play',video_s:50});r.setAnswer('end:bbb:complete',1);r.setNote('note');r.stop(60);r.start(0);r.flush();
 assert.equal(r.events.length,count);
 assert.equal(r.events.some(e=>e.type==='session_resume'),false);
 assert.equal(snapshot(store),before);
 assert.equal(r.export().events.length,count);
});

test('deleting one rehearsal removes every chunk, its manifest and its index entry; other logs stay intact',()=>{
 const store=fakeStore();
 const big=newRehearsalId('demo','bbb',UUID_A),keep=newRehearsalId('demo','bbb',UUID_B);
 run(store,big,'bbb',450,true);                          // more than 200 events, so several chunks
 run(store,keep,'bbb',4,true);
 const keepBefore=openRehearsalRecorder(store,keep,'read').events.length;
 assert.ok(store.data.has(`scenecaptions.telemetry.v2.${big}.2`));
 deleteRehearsalLog(store,big);
 assert.deepEqual([...store.data.keys()].filter(k=>k.includes(big)),[]);
 assert.deepEqual(readIndex(store).entries.map(e=>e.id),[keep]);
 assert.deepEqual(listRehearsalLogs(store,'demo').map(l=>l.id),[keep]);
 assert.equal(openRehearsalRecorder(store,keep,'read').events.length,keepBefore);
});

test('an unreadable index is backed up before it is replaced, and a missing manifest shows as unavailable',()=>{
 const store=fakeStore();
 store.setItem(REHEARSAL_INDEX_KEY,'{not json');
 const id=newRehearsalId('demo','bbb',UUID_A);
 touchIndexEntry(store,{id,kind:'demo',filmId:'bbb',createdAt:null,legacy:false});
 assert.equal(store.getItem(`${REHEARSAL_INDEX_KEY}.corrupt`),'{not json');
 assert.equal(readIndex(store).corrupt,false);
 const listed=listRehearsalLogs(store,'demo');
 assert.equal(listed.length,1);assert.equal(listed[0].available,false);
});
