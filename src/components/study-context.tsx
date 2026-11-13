'use client';
import {createContext,useContext,useEffect,useState} from 'react';import type {ReactNode} from 'react';import {STUDY_REGISTRY,studySessionSchema,validateRegistry} from '@/lib/study-session';import type {StudySession} from '@/lib/study-session';
type Context={session:StudySession|null;ready:boolean;error:string;advance:()=>void;leave:()=>void};
const StudyContext=createContext<Context>({session:null,ready:false,error:'',advance:()=>{},leave:()=>{}});
export function StudyProvider({children}:{children:ReactNode}){const [session,setSession]=useState<StudySession|null>(null),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const id=new URLSearchParams(location.search).get('session');if(id){try{const registry=validateRegistry(localStorage.getItem(STUDY_REGISTRY));if(!registry.sessions[id])throw Error('This session is not saved in this browser. Ask the researcher to open the saved session on this device.');setSession(studySessionSchema.parse(registry.sessions[id]))}catch(e){setError(e instanceof Error?e.message:'Saved session unavailable.')}}setReady(true)},[]);
 function advance(){if(!session)return;if(session.sequenceIndex+1>=session.sequence.length)return;try{const next=studySessionSchema.parse({...session,sequenceIndex:session.sequenceIndex+1}),r=validateRegistry(localStorage.getItem(STUDY_REGISTRY));localStorage.setItem(STUDY_REGISTRY,JSON.stringify({...r,sessions:{...r.sessions,[session.id]:next}}));setSession(next)}catch{setError('The next film could not be saved. Export the session before continuing.')}}
 function leave(){if(confirm('Researcher: leave study mode? Saved local data will be retained.'))location.href='/session'}
 return <StudyContext.Provider value={{session,ready,error,advance,leave}}>{children}</StudyContext.Provider>;
}
export const useStudySession=()=>useContext(StudyContext);
