'use client';
import {useCallback,useEffect,useState} from 'react';
import {DEFAULT_PROFILE,profileSchema} from '@/lib/captions';
import type {CaptionProfile} from '@/lib/captions';
import {loadProfile,PROFILE_KEY} from '@/lib/profile';
export function useCaptionProfile(key=PROFILE_KEY,initial?:CaptionProfile) {
 const [profile,setProfile]=useState<CaptionProfile>(initial||DEFAULT_PROFILE),[storageError,setStorageError]=useState(''),[hydrated,setHydrated]=useState(false);
 useEffect(()=>{try{setProfile(loadProfile(localStorage.getItem(key)))}catch{setStorageError('Preferences work for this visit. Browser storage is unavailable.')}setHydrated(true)},[key]);
 const update=useCallback((next:CaptionProfile)=>{const valid=profileSchema.parse(next);setProfile(valid);try{localStorage.setItem(key,JSON.stringify(valid));setStorageError('')}catch{setStorageError('Preferences work for this visit. Browser storage is unavailable.')}},[key]);
 return {profile,update,storageError,hydrated};
}
