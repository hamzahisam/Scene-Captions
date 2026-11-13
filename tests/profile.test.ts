import {test} from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_PROFILE} from '../src/lib/captions.ts';
import {loadProfile,changeProfileField} from '../src/lib/profile.ts';
test('profile storage validates malformed values and keeps detail independent of punctuation',()=>{
 assert.deepEqual(loadProfile('{broken'),DEFAULT_PROFILE);assert.deepEqual(loadProfile('{"detail":99}'),DEFAULT_PROFILE);
 const changed=changeProfileField({...DEFAULT_PROFILE,expression:1},'detail',3);assert.equal(changed.detail,3);assert.equal(changed.expression,1);
 const punctuation=changeProfileField(changed,'expression',2);assert.equal(punctuation.detail,3);assert.equal(punctuation.expression,2);
 assert.deepEqual(loadProfile(JSON.stringify(changed)),changed);
});
