"use client";
import {useState} from 'react';import type {RehearsalLogSummary} from '@/lib/rehearsal-index';import type {TelemetryRecorder} from '@/lib/telemetry-storage';import {eventCsv,summaryCsv} from '@/lib/telemetry';import {download} from './captune/storage';

function when(createdAt:string|null){return createdAt?new Date(createdAt).toLocaleString():'Start time unknown'}

// A same-film demo/lab log left open by an earlier visit. It is shown, never resumed automatically.
export function PriorRehearsal({prior,openLog,onResume,onDiscard}:{prior:RehearsalLogSummary|null;openLog:(id:string)=>TelemetryRecorder;onResume:()=>void;onDiscard:()=>void}){
 const [consent,setConsent]=useState(false),[error,setError]=useState('');
 if(!prior)return null;
 const id=prior.id;
 function exportPrior(){try{download(`scenecaptions-${id}.json`,openLog(id).export());setError('')}catch{setError('This saved rehearsal could not be read for export.')}}
 function discard(){if(window.confirm('Permanently delete this saved rehearsal from this browser? Export it first if you need it.'))onDiscard()}
 return <section className="card rehearsal prior-rehearsal" aria-labelledby="prior-rehearsal-title"><h2 id="prior-rehearsal-title">A previous rehearsal was left open</h2>
  <p>{prior.filmId} · started {when(prior.createdAt)}. Recording is paused: nothing from this saved log is played, logged or recorded until you choose Resume and confirm consent again.</p>
  {error&&<p role="alert" className="inline-error">{error}</p>}
  <div className="rehearsal-actions"><button onClick={exportPrior}>Export</button><button onClick={discard}>Discard</button></div>
  <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I agree to continue recording this technical rehearsal locally.</label>
  <button disabled={!consent} onClick={()=>{setConsent(false);onResume()}}>Resume recording</button>
 </section>;
}

// Research tools list: every saved demo/lab log with exports and deletion. The active recording cannot be deleted.
export function RehearsalLogs({logs,openLog,onDelete,recordingId}:{logs:RehearsalLogSummary[];openLog:(id:string)=>TelemetryRecorder;onDelete:(id:string)=>void;recordingId?:string|null}){
 const [error,setError]=useState('');
 function exportLog(id:string,kind:'json'|'events'|'summary'){try{const r=openLog(id);const base=`scenecaptions-${id}`;if(kind==='json')download(`${base}.json`,r.export());else if(kind==='events')download(`${base}-events.csv`,eventCsv(r.events));else download(`${base}-summary.csv`,summaryCsv(r.context,r.events,r.elapsed()));setError('')}catch{setError('That saved rehearsal could not be read for export.')}}
 function remove(id:string){if(window.confirm('Permanently delete this saved rehearsal and all its events from this browser? Export it first if you need it.'))onDelete(id)}
 return <section className="rehearsal-logs" aria-labelledby="rehearsal-logs-title"><h3 id="rehearsal-logs-title">Saved rehearsals in this browser</h3>
  {error&&<p role="alert" className="inline-error">{error}</p>}
  {logs.length===0?<p>No saved rehearsals yet.</p>:<ul className="rehearsal-log-list">{logs.map(l=><li key={l.id}>
   <div><strong>{l.filmId}</strong>{l.legacy&&<span> · earlier format</span>}<p>{when(l.createdAt)} · {l.available?`${l.recording?'Left open':'Closed'} · ${Math.round(l.elapsed_ms/1000)} s`:'Saved data unavailable'}</p></div>
   <div className="rehearsal-actions">{l.available&&<><button onClick={()=>exportLog(l.id,'json')}>Export JSON</button><button onClick={()=>exportLog(l.id,'events')}>Export events CSV</button><button onClick={()=>exportLog(l.id,'summary')}>Export summary CSV</button></>}<button disabled={l.id===recordingId} onClick={()=>remove(l.id)}>Delete</button></div>
  </li>)}</ul>}
 </section>;
}
