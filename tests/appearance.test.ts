import {test} from 'node:test';import assert from 'node:assert/strict';import {loadProfile} from '../src/lib/profile.ts';import {DEFAULT_PROFILE} from '../src/lib/captions.ts';
const luminance=(rgb:number[])=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
test('backdrop presets exceed 4.5:1 for white and yellow even over a white video frame',()=>{for(const bg of [[8,12,8],[102,102,102]])for(const fg of [[255,255,255],[255,235,59]])assert.ok((luminance(fg)+.05)/(luminance(bg)+.05)>=4.5);const old={...DEFAULT_PROFILE};delete (old as Partial<typeof old>).backdrop;delete (old as Partial<typeof old>).textColor;assert.equal(loadProfile(JSON.stringify(old)).backdrop,'solid');assert.equal(loadProfile(JSON.stringify(old)).textColor,'white');});
import {readFileSync} from 'node:fs';
test('sound captions are upright and symmetric by default; italics are an opt-in profile field',()=>{
 const css=readFileSync('src/app/globals.css','utf8');
 assert.equal(DEFAULT_PROFILE.italicSound,false);
 assert.equal(loadProfile(JSON.stringify((({italicSound,...rest})=>rest)(DEFAULT_PROFILE))).italicSound,false);
 assert.doesNotMatch(css,/\.sound-type\{[^}]*font-style:italic/);
 assert.doesNotMatch(css,/border-inline-start:4px solid #dbe8be/);
 assert.match(css,/\.sound-type:not\(\.sound-music\)\{box-shadow:0 0 0 2px #dbe8be\}/);
 assert.match(css,/\.caption-overlay \.sound-italic\{font-style:italic\}/);
 // The ring is outside the caption background, so the existing white/yellow x solid/translucent contrast floor is unchanged.
});
