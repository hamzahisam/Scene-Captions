"""Install a specifically reviewed, source-bound wording run; no network calls."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
RUN = ROOT / 'artifacts/youtube-films-2026-11-12'


def read(path):
    return json.loads(path.read_text())


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def install(track, export_name):
    # Wording styles intentionally change punctuation only; no emotional inference.
    for cue in track['cues']:
        levels = cue.pop('levels')
        cue['grid'] = {f'{d}-{e}': '\n'.join('[' + text.rstrip('.!') + (('' if e < 3 else '!') if text.rstrip('.!').endswith('?') else ('', '.', '!')[e - 1]) + ']' for text in levels[d - 1]) for d in (1, 2, 3) for e in (1, 2, 3)}
        cue['original_text'] = cue['grid']['2-2']
        cue['representations'] = {'plain': cue['grid']['1-1']}
        # Conventional sound spellings retain their corresponding source label.
        imitation = next((spelling for word, spelling in [('buzz', 'Buzz'), ('click', 'Click'), ('clang', 'Clang'), ('squeak', 'Squeak'), ('ding', 'Ding'), ('ting', 'Ting ting'), ('boing', 'Boing'), ('thud', 'Thud'), ('crunch', 'Crunch')] if word in cue['reference_text'].lower()), None)
        if imitation:
            cue['representations']['onomatopoeic'] = f'[{imitation} — ' + ' / '.join(levels[0]) + ']'
        count = sum(abs(other['start_s'] - cue['start_s']) <= 3 for other in track['cues'])
        cue['scene_load'] = 'dense' if count >= 3 else 'quiet' if count == 1 else 'balanced'
        cue['scene_load_basis'] = 'cue-density'
        cue['scene_context'] = 'Uses your saved detail limit. Cue-density adaptation can shorten clustered sound captions.'
    track['generated_with'].update(expression_method='punctuation-only', expressiveness='source-anchored', scene_load_method='cue-density', export_basename=export_name)
    raw = json.dumps(track, ensure_ascii=False, indent=2) + '\n'
    (ROOT / f'data/source-assisted-captions/{export_name}.json').write_text(raw)
    public = ROOT / 'public/research/source-richness'
    (public / f'{export_name}.json').write_text(raw)
    for detail in (1, 2, 3):
        srt = '\n\n'.join(f'{i+1}\n{stamp(c["start_s"])} --> {stamp(c["end_s"])}\n{c["grid"][f"{detail}-2"]}' for i, c in enumerate(track['cues'])) + '\n'
        (public / f'{export_name}-detail-{detail}.srt').write_text(srt)
    return {'video_id': track['video_id'], 'cues': len(track['cues']), 'sha256': hashlib.sha256(raw.encode()).hexdigest()}


def main():
    approved = read(RUN / 'approved-phrases.json')
    result = read(RUN / 'final-result.json')
    sounds = result['output']['sounds']
    if len(sounds) != len(approved) or len({s['id'] for s in sounds}) != len(sounds) or {s['id'] for s in sounds} != {s['id'] for s in approved}:
        raise ValueError('Incomplete model output.')
    outputs = {s['id']: s['levels'] for s in sounds}
    changes = []
    levels_by_reference = {}
    for source in approved:
        levels = outputs[source['id']]
        if len(levels) != 3 or not all(isinstance(s, str) and s.strip() for s in levels):
            raise ValueError('Missing detail level.')
        # Closed source-text vocabulary: unapproved changes cannot silently enter playback.
        if levels != source['approved_phrases']:
            changes.append({'id': source['id'], 'model': levels, 'installed': source['approved_phrases'], 'reason': 'Retain the specifically source-text-reviewed phrases.'})
            levels = source['approved_phrases']
        levels_by_reference[source['reference']] = levels
    summaries = []
    bunny = read(ROOT / 'data/source-assisted-captions/big-buck-bunny.json')
    bunny['generated_with']['method'] += ' Viewer wording styles use minimal, sentence and emphatic punctuation; cue-density adaptation is a proxy.'
    for cue in bunny['cues']:
        cue['levels'] = [[line.strip('[]') for line in cue['grid'][f'{d}-2'].split('\n')] for d in (1, 2, 3)]
    summaries.append(install(bunny, 'big-buck-bunny-controls'))
    for identity in ('soar', 'brain-divided'):
        source_path = ROOT / f'data/sources/youtube/{identity}.json'
        source = read(source_path)
        track = {'schema_version': 1, 'video_id': identity, 'title': source['title'], 'source_url': source['source_url'],
            'license': 'All rights reserved · YouTube playback', 'attribution': source['attribution'],
            'duration_seconds': source['duration_seconds'], 'annotation_status': 'draft',
            'generated_with': {'kind': 'source-assisted', 'model': result['model'], 'method': 'NVIDIA wording preparation using reviewed source-text phrases; main-session editorial checks. '+source['timing_method'], 'prompt_version': 'youtube-source-phrases-v1', 'quality_gate': 'unverified', 'wording_style': 'simple-source-richness',
                'caption_source': {'url': source['source_url'], 'author': 'TheCGBros · YouTube English caption contributors', 'license': 'Copyright retained by the respective creators; publisher-hosted playback', 'revision': 'English transcript exported 2026-11-12; reconstructed display intervals', 'sha256': source['transcript_sha256']}}, 'cues': []}
        for cue in source['cues']:
            references = cue['reference_text'].split('\n')
            track['cues'].append({**cue, 'sound_key': cue['cue_id'], 'levels': [[levels_by_reference[r][d] for r in references] for d in range(3)]})
        summaries.append(install(track, identity))
    evidence = ROOT / 'docs/verification/youtube-films-2026-11-12'
    evidence.mkdir(parents=True, exist_ok=True)
    (evidence / 'wording-review.json').write_text(json.dumps({'reviewer': 'Main-session assistant', 'kind': 'source-text editorial review', 'independent_review': False, 'listening_review': 'not completed', 'timing': 'whole-second transcript starts; derived display ends; not exact source cue boundaries', 'model': result['model'], 'usage': result.get('usage'), 'approved_labels': approved, 'editorial_changes': changes, 'tracks': summaries}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(summaries))


if __name__ == '__main__':
    main()
