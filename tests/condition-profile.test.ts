import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PROFILE} from '../src/lib/captions.ts';
import {conditionProfile,studySessionSchema,sessionDefaults} from '../src/lib/study-session.ts';
import type {CaptionProfile} from '../src/lib/captions.ts';
const appearance={size:'extra-large',position:'top',backdrop:'outline',textColor:'yellow',announceCaptions:true,shortcuts:false,pageWideShortcuts:true} as const;
const chosen:CaptionProfile={...DEFAULT_PROFILE,...appearance,detail:3,expression:1,adaptive:true,representation:'plain',readingSpeed:15,typeStyling:false,italicSound:true,markShortened:true};
for(const condition of ['baseline','personalized','essential','balanced','rich'] as const)test(`${condition} preserves every appearance/accessibility setting while fixing only assigned sounds`,()=>{
 const session=studySessionSchema.parse({id:`test-${condition}`,participantId:'P-100',group:'adult',background:'frequent',design:'between',seed:'fixed',allocationSlot:'test',sequence:[{filmId:'big-buck-bunny',condition}],readingSpeed:20,createdAt:'2026-11-15T00:00:00.000Z'});
 const before=JSON.stringify(chosen),effective=conditionProfile(chosen,session);
 for(const field of Object.keys(appearance) as (keyof typeof appearance)[])assert.equal(effective[field],chosen[field]);
 if(condition==='personalized')assert.equal(effective,chosen);
 else {const fixed=sessionDefaults(session);for(const field of ['detail','expression','adaptive','representation','readingSpeed','typeStyling','italicSound','markShortened'] as const)assert.equal(effective[field],fixed[field]);assert.equal(effective.adaptive,false)}
 assert.equal(JSON.stringify(chosen),before);
 assert.deepEqual(conditionProfile({...chosen,...DEFAULT_PROFILE,...appearance},session),condition==='personalized'?{...chosen,...DEFAULT_PROFILE,...appearance}:{...effective});
});
test('demo profiles are returned unchanged without a study assignment',()=>{assert.equal(conditionProfile(chosen),chosen)});
