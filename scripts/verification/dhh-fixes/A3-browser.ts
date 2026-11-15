// Real local setup and registry interaction with synthetic participant details.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || '/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors: string[] = [], uploads: string[] = [];
page.on('pageerror', (error: Error) => errors.push(error.message));
page.on('request', (request: any) => { if (['POST', 'PUT', 'PATCH'].includes(request.method())) uploads.push(request.url()); });
page.on('dialog', (dialog: any) => { void dialog.dismiss(); throw Error('Unexpected browser confirmation'); });
const read = () => {
  const registry = JSON.parse(localStorage.getItem('scenecaptions.study-registry.v1')!);
  const session: any = Object.values(registry.sessions)[0];
  const prefix = `scenecaptions.telemetry.v2.${session.id}`, manifest = JSON.parse(localStorage.getItem(prefix)!);
  return { session, manifest, events: Array.from({ length: manifest.chunks }, (_, index) => JSON.parse(localStorage.getItem(`${prefix}.${index}`)!)).flat() };
};
try {
  await page.goto(`${process.argv[2] || 'http://127.0.0.1:3000'}/session`);
  await page.getByLabel('Participant code', { exact: true }).fill('P-301');
  await page.getByLabel('Design', { exact: true }).selectOption('within-pilot');
  await page.getByLabel('Hair Love', { exact: true }).check();
  await page.getByLabel('I am preparing a local technical rehearsal; study consent is handled separately.', { exact: true }).check();
  assert.equal(await page.getByRole('button', { name: 'Create session', exact: true }).isDisabled(), true);
  await page.getByLabel('Researcher code', { exact: true }).fill('012345');
  await page.getByRole('button', { name: 'Create session', exact: true }).click();
  await page.getByRole('link', { name: 'Open saved session', exact: true }).click();
  const researcher = page.getByRole('button', { name: 'Researcher', exact: true });
  await researcher.waitFor();
  const initial = await page.evaluate(read);
  assert.equal(initial.session.researcher.hash.length, 64);
  assert.equal(initial.session.researcher.salt.length, 32);
  assert.deepEqual(Object.keys(initial.session.researcher).sort(), ['algorithm', 'hash', 'salt']);
  assert.equal(initial.manifest.recording, true);
  assert.equal(await researcher.evaluate((button: HTMLElement) => !!(document.querySelector('footer')!.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  async function locked() {
    for (const name of ['Stop recording', 'Export full JSON', 'Export events CSV', 'Export summary CSV', 'Leave study mode']) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 0, name);
    assert.equal(await page.getByLabel('Researcher note (no names or contact details)', { exact: true }).count(), 0);
  }
  await locked();
  await researcher.click();
  let dialog = page.getByRole('dialog', { name: 'Researcher controls', exact: true });
  await dialog.getByLabel('Researcher code', { exact: true }).fill('9999');
  await dialog.getByRole('button', { name: 'Unlock controls', exact: true }).click();
  await dialog.getByRole('alert').waitFor(); await locked();
  await page.keyboard.press('Escape');
  assert.equal(await researcher.evaluate((element: HTMLElement) => element === document.activeElement), true);
  async function unlock() {
    await researcher.click(); dialog = page.getByRole('dialog', { name: 'Researcher controls', exact: true });
    await dialog.getByLabel('Researcher code', { exact: true }).fill('012345');
    await dialog.getByRole('button', { name: 'Unlock controls', exact: true }).click();
    await dialog.getByLabel('Researcher note (no names or contact details)', { exact: true }).waitFor();
  }
  await unlock();
  const note = dialog.getByLabel('Researcher note (no names or contact details)', { exact: true });
  await note.fill('Synthetic note only'); await note.press('Tab');
  for (const name of ['Export full JSON', 'Export events CSV', 'Export summary CSV']) {
    const download = page.waitForEvent('download'); await dialog.getByRole('button', { name, exact: true }).click(); await download;
  }
  await dialog.getByRole('button', { name: 'Stop recording', exact: true }).click();
  assert.equal((await page.evaluate(read)).manifest.recording, false);
  await page.keyboard.press('Escape'); await locked();
  await page.reload(); await researcher.waitFor(); await locked();
  await unlock();
  assert.equal(await dialog.getByLabel('Researcher note (no names or contact details)', { exact: true }).inputValue(), 'Synthetic note only');
  const beforeLeave = await page.evaluate(read);
  assert.ok(beforeLeave.events.filter((event: any) => event.type === 'researcher_unlock').length >= 2);
  for (const action of ['export_json', 'export_events', 'export_summary', 'note_edit']) assert.ok(beforeLeave.events.some((event: any) => event.type === 'researcher_action' && event.action === action && event.source === 'researcher'), action);
  await dialog.getByRole('button', { name: 'Leave study mode', exact: true }).click();
  await page.waitForURL('**/session');
  const final = await page.evaluate(read);
  assert.ok(final.events.some((event: any) => event.type === 'researcher_action' && event.action === 'leave_study' && event.source === 'researcher'));
  assert.deepEqual(errors, []); assert.deepEqual(uploads, []);
  mkdirSync('artifacts/dhh-fixes', { recursive: true });
  writeFileSync('artifacts/dhh-fixes/A3-browser.json', JSON.stringify({ passed: true, events: final.events.length, credentialKeys: Object.keys(final.session.researcher), errors, uploads }, null, 2));
  console.log('A3 passed: real session creation, wrong/correct code, relocking, reload, all exports, note, stop/leave and researcher audit events.');
} catch(error) { mkdirSync('artifacts/dhh-fixes', {recursive:true}); await page.screenshot({path:'artifacts/dhh-fixes/A3-failure.png',fullPage:true}); console.log(await page.locator('body').innerText()); throw error; } finally { await browser.close(); }
