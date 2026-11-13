import {DEFAULT_PROFILE,profileSchema} from './captions.ts';
import type {CaptionProfile} from './captions.ts';
export const PROFILE_KEY='scenecaptions.profile.v1';
export function loadProfile(raw:string|null):CaptionProfile {
 try {return raw ? profileSchema.parse(JSON.parse(raw)) : {...DEFAULT_PROFILE};} catch {return {...DEFAULT_PROFILE};}
}
export function changeProfileField<K extends keyof CaptionProfile>(profile:CaptionProfile,field:K,value:CaptionProfile[K]):CaptionProfile {return profileSchema.parse({...profile,[field]:value});}
