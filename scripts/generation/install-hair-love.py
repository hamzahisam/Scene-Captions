"""Rebuild Hair Love's prepared subtitles from pinned sources; no network calls."""
from pathlib import Path
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/verification/hair-love-2026-11-12'


def main():
    spec = importlib.util.spec_from_file_location('viewer_styles', Path(__file__).with_name('install-viewer-styles.py'))
    styles = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(styles)
    source = json.loads((ROOT / 'data/sources/youtube/hair-love.json').read_text())
    approved = json.loads((EVIDENCE / 'approved-phrases.json').read_text())
    result = json.loads((EVIDENCE / 'wording-result.json').read_text())
    sounds = result['output']['sounds']
    outputs = {row['id']: row['levels'] for row in sounds}
    if len(sounds) != len(approved) or set(outputs) != {row['id'] for row in approved}:
        raise ValueError('Missing or duplicate wording IDs.')
    phrases = {}
    for row in approved:
        if outputs[row['id']] != row['approved_phrases']:
            raise ValueError('Model changed the specifically reviewed source-bound phrases.')
        phrases[row['reference'].strip('[]')] = row['approved_phrases']
    credit = {'url': source['source_url'], 'author': 'Sony Pictures Animation · original English captions',
              'license': 'Copyright retained by the respective creators', 'sha256': source['filtered_caption_sha256']}
    track = {'schema_version': 1, 'video_id': 'hair-love', 'title': source['title'],
             'source_url': source['source_url'], 'license': 'Copyright retained by the respective filmmakers',
             'attribution': source['attribution'], 'duration_seconds': source['duration_seconds'],
             'annotation_status': 'draft', 'dialogue': source['dialogue'], 'dialogue_source': credit,
             'generated_with': {'kind': 'source-assisted', 'model': result['model'],
                               'method': 'NVIDIA wording preparation using main-session source-text-reviewed phrases. ' + source['timing_method'],
                               'prompt_version': 'hair-love-source-phrases-v1', 'quality_gate': 'unverified',
                               'wording_style': 'simple-source-richness', 'source_sha256': source['media']['sha256'],
                               'caption_source': {**credit, 'revision': 'English VTT retrieved 2026-11-12; original sound/dialogue intervals; song lyrics omitted'}},
             'cues': []}
    for cue in source['cues']:
        row = {key: cue[key] for key in ('cue_id', 'start_s', 'end_s', 'reference_text')}
        row.update(sound_key=cue['cue_id'], levels=[[phrase] for phrase in phrases[cue['phrase_key']]])
        track['cues'].append(row)
    print(json.dumps(styles.install(track, 'hair-love')))


if __name__ == '__main__':
    main()
