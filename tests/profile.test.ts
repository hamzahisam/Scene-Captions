import {test} from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_PROFILE} from '../src/lib/captions.ts';
import {loadProfile,changeProfileField} from '../src/lib/profile.ts';
test('profile storage validates malformed values and keeps detail independent of punctuation',()=>{
 assert.deepEqual(loadProfile('{broken'),DEFAULT_PROFILE);assert.deepEqual(loadProfile('{"detail":99}'),DEFAULT_PROFILE);
 const changed=changeProfileField({...DEFAULT_PROFILE,expression:1},'detail',3);assert.equal(changed.detail,3);assert.equal(changed.expression,1);
 const punctuation=changeProfileField(changed,'expression',2);assert.equal(punctuation.detail,3);assert.equal(punctuation.expression,2);
 assert.deepEqual(loadProfile(JSON.stringify(changed)),changed);
});
test('shortening marks default off in old profiles and persist independently of adaptation',()=>{const {markShortened,...legacy}=DEFAULT_PROFILE;assert.equal(loadProfile(JSON.stringify(legacy)).markShortened,false);const on=changeProfileField(DEFAULT_PROFILE,'markShortened',true);assert.equal(loadProfile(JSON.stringify(on)).markShortened,true);assert.equal(on.adaptive,DEFAULT_PROFILE.adaptive);});
