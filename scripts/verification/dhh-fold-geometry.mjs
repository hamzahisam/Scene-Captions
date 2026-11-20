// Laptop fold geometry check for the watch page (B5).
// Real DOM geometry from the installed Chrome. Media is SYNTHETIC: a short WebM is generated in-page
// with MediaRecorder, and the HTMLMediaElement duration/currentTime are shimmed to the bunny caption
// track (596.46 s) so that caption timing can be displayed. Labelled as such in the output JSON.
// Usage: node scripts/verification/dhh-fold-geometry.mjs <outDir>
// Env: BASE_URL (default http://127.0.0.1:3000), LABEL (before|after), PLAYWRIGHT_MODULE, SYNTH_MEDIA (cached clip path).
import {pathToFileURL} from 'node:url';
import {mkdir, writeFile, readFile, access} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const playwrightModule = process.env.PLAYWRIGHT_MODULE || '/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs';
const {chromium: runner} = await import(pathToFileURL(playwrightModule).href);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const LABEL = process.env.LABEL || 'run';
const OUT = path.resolve(process.argv[2] || process.env.OUT_DIR || 'fold-geometry-out');
await mkdir(OUT, {recursive: true});
const SYNTH = process.env.SYNTH_MEDIA || path.join(OUT, '_synthetic-clock.webm');
const CLIP_SECONDS = 14;

const captions = JSON.parse(await readFile(path.resolve('data/captions/big-buck-bunny.json'), 'utf8'));
const DURATION = captions.duration_seconds;
// Longest rich variant (grid 3-3) so the long visible cue is the worst case for the overlay.
const longest = captions.cues.reduce((best, cue) => ((cue.grid?.['3-3']?.length || 0) > (best.grid?.['3-3']?.length || 0) ? cue : best));
const LONG_T = (longest.start_s + longest.end_s) / 2;

const SIZES = [
  {w: 1366, h: 657, kind: 'desktop-fold'},
  {w: 1536, h: 730, kind: 'desktop-fold'},
  {w: 1280, h: 800, kind: 'desktop-fold'},
  {w: 1920, h: 969, kind: 'desktop-fold'},
  {w: 1000, h: 760, kind: 'desktop-mid'},
  {w: 820, h: 1000, kind: 'narrow-regression'},
  {w: 390, h: 844, kind: 'mobile-regression'},
];

async function makeClip(browser, file) {
  try { await access(file); return; } catch {}
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  const b64 = await page.evaluate(async (seconds) => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
    const g = canvas.getContext('2d'); const stream = canvas.captureStream(15);
    const rec = new MediaRecorder(stream, {mimeType: 'video/webm;codecs=vp8'}); const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise((r) => { rec.onstop = r; });
    let n = 0; const timer = setInterval(() => { g.fillStyle = `hsl(${(n++ * 3) % 360} 35% 28%)`; g.fillRect(0, 0, 640, 360); g.fillStyle = '#fff'; g.font = '28px sans-serif'; g.fillText('synthetic clock', 24, 56); }, 66);
    rec.start(250); await new Promise((r) => setTimeout(r, seconds * 1000)); rec.stop(); await stopped; clearInterval(timer);
    const buf = new Uint8Array(await new Blob(chunks, {type: 'video/webm'}).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, CLIP_SECONDS);
  await writeFile(file, Buffer.from(b64, 'base64'));
  await page.close();
}

// Runs before app scripts: pins duration/currentTime of the demo <video> to the caption track.
function shimScript(duration) {
  return `(() => {
    const proto = HTMLMediaElement.prototype; const D = ${duration}; const CLIP = ${CLIP_SECONDS};
    const durGet = Object.getOwnPropertyDescriptor(proto, 'duration').get;
    const ct = Object.getOwnPropertyDescriptor(proto, 'currentTime');
    const isSynth = (el) => String(el.src).includes('/media/big-buck-bunny.mp4');
    Object.defineProperty(proto, 'duration', {configurable: true, get() { return isSynth(this) ? D : durGet.call(this); }});
    Object.defineProperty(proto, 'currentTime', {configurable: true, get() { return isSynth(this) ? (this.__synthT ?? 0) : ct.get.call(this); },
      set(v) { if (!isSynth(this)) return ct.set.call(this, v); this.__synthT = v; try { ct.set.call(this, Math.min(v, CLIP - 0.5)); } catch {} }});
  })();`;
}

// Fold rules are judged at scroll 0; clicks on controls below the fold can scroll the page.
const snapAtTop = async (page) => { await page.evaluate(() => window.scrollTo({top: 0, behavior: "instant"})); await page.waitForTimeout(120); return page.evaluate(measure); };
const measure = () => {
  const rect = (el) => {
    if (!el) return null; const b = el.getBoundingClientRect();
    return {x: +b.x.toFixed(2), y: +b.y.toFixed(2), width: +b.width.toFixed(2), height: +b.height.toFixed(2), right: +b.right.toFixed(2), bottom: +b.bottom.toFixed(2)};
  };
  const q = (s) => document.querySelector(s);
  const h1 = q('.watch-heading h1');
  let h1Lines = null;
  if (h1) { const range = document.createRange(); range.selectNodeContents(h1); h1Lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size; }
  return {
    viewport: {w: innerWidth, h: innerHeight}, scrollX, scrollY, docScrollWidth: document.documentElement.scrollWidth,
    fullscreen: !!document.fullscreenElement,
    header: rect(q('.site-header')), filmLibrary: rect(q('.film-library')), resumeBanner: rect(q('.resume-banner')),
    column: (()=>{const el=q('.player-main');if(!el)return rect(q('.watch-column'));const r=rect(el),pr=parseFloat(getComputedStyle(el).paddingRight)||0;return {...r,width:r.width-pr,right:r.right-pr}})(), heading: rect(q('.watch-heading')),
    h1: h1 ? {...rect(h1), fontSize: parseFloat(getComputedStyle(h1).fontSize), lines: h1Lines} : null,
    frame: rect(q('.video-frame')), stage: rect(q('.video-stage')), controls: rect(q('.video-controls')),
    footnote: rect(q('.film-footnote')), captionOverlay: rect(q('.caption-overlay')),
    captions: [...document.querySelectorAll('.caption-overlay p')].map(rect),
    frameWidthStyle: q('.video-frame') ? getComputedStyle(q('.video-frame')).width : null,
  };
};

function judge(m) {
  const failures = [];
  const vh = m.viewport.h;
  if (m.fullscreen) return {failures, note: 'fullscreen: geometry not judged against fold rules'};
  if (m.docScrollWidth > m.viewport.w) failures.push(`horizontal scroll ${m.docScrollWidth}>${m.viewport.w}`);
  if (m.frame.bottom > vh + 0.5) failures.push(`frame bottom ${m.frame.bottom} exceeds viewport ${vh}`);
  if (m.controls && m.controls.bottom > vh + 0.5) failures.push(`controls bottom ${m.controls.bottom} exceeds viewport ${vh}`);
  if (m.controls && m.controls.bottom > m.frame.bottom + 0.5) failures.push('controls outside frame');
  // One line of heading text is about 1.25em tall; a wrapped title (or the credit wrapping) is clearly taller.
  if (m.h1 && m.viewport.w >= 900 && m.h1.height > m.h1.fontSize * 1.6) failures.push(`heading wraps (box ${m.h1.height}px at ${m.h1.fontSize}px)`);
  for (const [i, c] of m.captions.entries()) {
    if (!c) continue;
    const inside = c.x >= m.frame.x - 0.5 && c.right <= m.frame.right + 0.5 && c.y >= m.frame.y - 0.5 && c.bottom <= m.frame.bottom + 0.5;
    if (!inside) failures.push(`caption ${i} outside frame`);
    if (c.bottom > (m.controls?.y ?? Infinity) + 0.5) failures.push(`caption ${i} overlaps controls`);
  }
  if (m.viewport.w >= 900 && m.column && m.frame) {
    const off = (m.frame.x + m.frame.width / 2) - (m.column.x + m.column.width / 2);
    if (Math.abs(off) > 1) failures.push(`frame not centred in column (offset ${off.toFixed(1)})`);
    const ratio = m.frame.width / m.frame.height;
    if (Math.abs(ratio - 16 / 9) > 0.01) failures.push(`frame ratio ${ratio.toFixed(3)} not 16:9`);
  }
  return {failures};
}

const browser = await runner.launch({headless: true, channel: 'chrome'});
const results = [];
const log = [];
try {
  await makeClip(browser, SYNTH);
  const clipBytes = (await readFile(SYNTH)).length;
  log.push(`synthetic clip ${SYNTH} (${clipBytes} bytes, ${CLIP_SECONDS}s WebM via MediaRecorder); duration pinned to ${DURATION}s; long cue ${longest.cue_id} at ${LONG_T.toFixed(2)}s`);
  for (const size of SIZES) {
    const context = await browser.newContext({viewport: {width: size.w, height: size.h}});
    await context.addInitScript(shimScript(DURATION));
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.route(/\/media\/big-buck-bunny\.mp4$/, async (route) => {
      const buf = await readFile(SYNTH); const range = route.request().headers()['range'];
      if (!range) return route.fulfill({status: 200, headers: {'Accept-Ranges': 'bytes', 'Content-Type': 'video/webm'}, body: buf});
      const m = /bytes=(\d*)-(\d*)/.exec(range); const start = m[1] ? Number(m[1]) : 0; const end = m[2] ? Math.min(Number(m[2]), buf.length - 1) : buf.length - 1;
      return route.fulfill({status: 206, headers: {'Accept-Ranges': 'bytes', 'Content-Type': 'video/webm', 'Content-Range': `bytes ${start}-${end}/${buf.length}`, 'Content-Length': String(end - start + 1)}, body: buf.subarray(start, end + 1)});
    });
    const tag = `${size.w}x${size.h}`;
    const row = {size, tag, states: {}};
    await page.goto(BASE);
    await page.locator('.video-controls').waitFor();
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 1; });

    row.states.default = await snapAtTop(page);
    await page.screenshot({path: path.join(OUT, `${LABEL}-${tag}-default.png`)});

    // Long visible cue at largest text size, settings closed before measuring.
    {const cc=page.getByRole('button', {name: 'Caption settings', exact: true});const bar=page.locator('.settings-bar');if(await cc.isVisible())await cc.click();else if(await bar.isVisible())await bar.click();else await page.locator('#caption-settings input[type=radio]:checked').first().focus();}
    if(!(await page.locator('details.readability').evaluate(d=>d.open)))await page.getByText('Appearance', {exact: true}).click();
    await page.getByLabel('Text size', {exact: true}).selectOption('extra-large');
    await page.getByRole('radio', {name: /^Rich/}).check(); // richest wording of the long cue
    await page.keyboard.press('Escape');
    // Sweep every cue at this viewport and keep the tallest rendered caption (the worst case for fit).
    let worst = {t: LONG_T, height: 0};
    for (const cue of captions.cues) {
      const t = (cue.start_s + cue.end_s) / 2;
      await page.evaluate((x) => { document.querySelector('video').currentTime = x; }, t);
      await page.waitForTimeout(70);
      const height = await page.evaluate(() => [...document.querySelectorAll('.caption-overlay p')].reduce((max, p) => Math.max(max, p.getBoundingClientRect().height), 0));
      if (height > worst.height) worst = {t, height};
    }
    await page.evaluate((x) => { document.querySelector('video').currentTime = x; }, worst.t);
    await page.waitForSelector('.caption-overlay p', {timeout: 10000});
    await page.waitForTimeout(300);
    row.longCue = {atSeconds: +worst.t.toFixed(3), captionHeightPx: +worst.height.toFixed(2)};
    row.states.longCue = await snapAtTop(page);
    await page.screenshot({path: path.join(OUT, `${LABEL}-${tag}-long-cue.png`)});

    if (size.w >= 900) {
      // Fullscreen must stay unchanged; judged only for the viewport it fills.
      try {
        await page.getByRole('button', {name: 'Fullscreen player', exact: true}).click();
        await page.waitForFunction(() => !!document.fullscreenElement, null, {timeout: 3000});
        await page.waitForTimeout(200);
        row.states.fullscreen = await page.evaluate(measure);
        await page.evaluate(() => document.exitFullscreen());
        await page.waitForFunction(() => !document.fullscreenElement, null, {timeout: 3000});
      } catch (e) { row.states.fullscreen = {error: String(e.message).split('\n')[0]}; }
    }

    // Study-style resume: a technical rehearsal is saved locally, then the page reloads and shows the banner.
    await page.locator('details.research-tools > summary').click();
    await page.getByLabel(/record this technical rehearsal locally/).check();
    await page.getByRole('button', {name: 'Start rehearsal', exact: true}).click();
    // B1: a left-open rehearsal is offered explicit Resume/Export/Discard after reload (the banner state).
    await page.reload();
    await page.locator('.video-controls').waitFor();
    await page.waitForSelector('.prior-rehearsal', {timeout: 10000});
    await page.waitForTimeout(300);
    row.states.resumed = await snapAtTop(page);
    // Shorter window (e.g. zoomed or resized): the player must refit from the live window height.
    await page.setViewportSize({width: size.w, height: size.h - 120});
    await page.waitForTimeout(300);
    if (size.w >= 900) row.states.resumedShorter = await snapAtTop(page);
    await page.setViewportSize({width: size.w, height: size.h});
    await page.waitForTimeout(200);
    await page.screenshot({path: path.join(OUT, `${LABEL}-${tag}-resumed.png`)});

    row.pageErrors = errors;
    row.judgement = {};
    for (const [name, m] of Object.entries(row.states)) row.judgement[name] = m.error ? {failures: [m.error]} : judge(m);
    results.push(row);
    await context.close();
    const summary = Object.entries(row.judgement).map(([k, v]) => `${k}:${v.failures.length ? 'FAIL ' + v.failures.join('; ') : 'pass'}`).join(' | ');
    log.push(`${tag} ${size.kind} ${summary}`);
    log.push(`${tag} default frame top=${row.states.default.frame.y} h=${row.states.default.frame.height} w=${row.states.default.frame.width} bottom=${row.states.default.frame.bottom}; resumed frame top=${row.states.resumed.frame.y} bottom=${row.states.resumed.frame.bottom}; page errors=${errors.length}`);
  }
} finally {
  await browser.close();
}
const payload = {label: LABEL, generated: new Date().toISOString(), base: BASE, media: {kind: 'SYNTHETIC', clip: 'Chrome MediaRecorder WebM', clipSeconds: CLIP_SECONDS, shimmedDurationSeconds: DURATION, longCue: {id: longest.cue_id, atSeconds: LONG_T}}, results};
await writeFile(path.join(OUT, `${LABEL}-geometry.json`), JSON.stringify(payload, null, 2));
log.forEach((line) => console.log(line));
const anyFail = results.some((r) => Object.values(r.judgement).some((j) => j.failures.length));
const errs = results.flatMap((r) => r.pageErrors);
console.log(`${anyFail ? 'FAILURES PRESENT' : 'ALL GEOMETRY CHECKS PASS'}; page errors: ${errs.length}`);
assert.ok(results.length === SIZES.length);
