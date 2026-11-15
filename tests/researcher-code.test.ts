import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashResearcherCode, verifyResearcherCode, researcherCredentialSchema } from '../src/lib/researcher-code.ts';
import { TelemetryRecorder } from '../src/lib/telemetry-storage.ts';

test('researcher codes use a fresh salt, SHA-256 digest and no stored plaintext', async () => {
  const first = await hashResearcherCode('012345');
  const second = await hashResearcherCode('012345');
  assert.deepEqual(Object.keys(first).sort(), ['algorithm', 'hash', 'salt']);
  assert.equal(researcherCredentialSchema.safeParse(first).success, true);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(await verifyResearcherCode('012345', first), true);
  assert.equal(await verifyResearcherCode('012346', first), false);
  assert.equal(await verifyResearcherCode('12345', first), false);
  assert.equal(await verifyResearcherCode('012345', { ...first, salt: second.salt }), false);
  assert.equal(await verifyResearcherCode('012345', null), false);
});
test('only 4–8 digits can be used and invalid saved credentials fail closed', async () => {
  for (const code of ['', '123', '123456789', '12ab', ' 1234', '1234\n']) {
    await assert.rejects(hashResearcherCode(code));
    assert.equal(await verifyResearcherCode(code, {}), false);
  }
  for (const code of ['0000', '12345678']) assert.equal(await verifyResearcherCode(code, await hashResearcherCode(code)), true);
  assert.equal(await verifyResearcherCode('1234', { algorithm: 'sha256', salt: '', hash: '' }), false);
});
test('researcher access/actions stay auditable after recording stops without resuming participant capture', () => {
  const data = new Map<string, string>();
  const store = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  const recorder = new TelemetryRecorder({ session_id: 'unlock-test', participant_id: 'P-001', design: 'between', assigned_condition: 'baseline', sequence_index: 0, film_id: 'soar', app_version: 'test' }, store, () => 100);
  recorder.append({ type: 'researcher_unlock', source: 'researcher', video_s: 0 });
  assert.equal(recorder.events.length, 0);
  recorder.start(0); recorder.stop(10);
  const count = recorder.events.length;
  recorder.append({ type: 'researcher_unlock', source: 'researcher', video_s: 10 });
  recorder.append({ type: 'researcher_action', action: 'export_json', source: 'researcher', video_s: 10 });
  recorder.append({ type: 'play', video_s: 11 });
  assert.equal(recorder.recording, false);
  assert.equal(recorder.events.length, count + 2);
  const restored = new TelemetryRecorder(recorder.context, store, () => 100);
  assert.equal(restored.recording, false);
  assert.deepEqual(restored.events.slice(-2).map(event => [event.type, event.source]), [['researcher_unlock', 'researcher'], ['researcher_action', 'researcher']]);
});
