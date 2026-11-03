"""Explicit NIM audiovisual context batch. Descriptions remain unverified drafts."""
from pathlib import Path
import sys,json,base64,argparse,time
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/diagnostics'))
from phase1_nim import run_one

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--allow-inference',action='store_true');ap.add_argument('--max-calls',type=int,default=3);a=ap.parse_args()
 if not a.allow_inference or not 1<=a.max_calls<=87:ap.error('Use --allow-inference and an explicit --max-calls 1..87.')
 out=ROOT/'docs/verification/captune-matrix-2026-11-03/context-full.json'
 seed=ROOT/'docs/verification/captune-matrix-2026-11-03/context-pilot.json'
 rows=json.loads(out.read_text()) if out.exists() else json.loads(seed.read_text())
 base=ROOT/'artifacts/captune-matrix-2026-11-03/context';manifest=json.loads((base/'manifest.json').read_text())
 done={r['cue'] for r in rows};calls=0;failures=0
 for c in manifest['clips']:
  if c['id'] in done:continue
  if calls>=a.max_calls:break
  raw=(base/c['path']).read_bytes()
  if len(raw)>4*1024*1024:raise ValueError('A context clip exceeds the conservative input cap.')
  payload={'model':'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning','stream':False,'temperature':.2,'max_tokens':2048,'chat_template_kwargs':{'enable_thinking':False},'messages':[{'role':'user','content':[{'type':'text','text':'Can you describe the visual and audio content in this video clip?'},{'type':'video_url','video_url':{'url':'data:video/mp4;base64,'+base64.b64encode(raw).decode()}}]}]}
  row={'cue':c['id'],'clip_sha256':c['sha256'],'window':{'start':c['start'],'end':c['end']},'review_status':'unverified-draft',**run_one(payload)};rows.append(row);calls+=1;out.write_text(json.dumps(rows,indent=2)+'\n')
  status=row.get('http_status');print(json.dumps({'cue':c['id'],'status':status,'seconds':row['seconds'],'this_run':calls}),flush=True)
  if status in [401,403,429]:raise RuntimeError('Authorization/quota failed; context batch stopped without retries.')
  failures=failures+1 if status is None or status>=500 else 0
  if failures>=3:raise RuntimeError('Three consecutive capacity/transport failures; context batch stopped.')
 print(json.dumps({'new_requests':calls,'recorded_cues':len(rows),'approved_contexts':0,'note':'Raw model descriptions are not sound truth. Source facts govern final captions.'}))
if __name__=='__main__':
 try:main()
 except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
