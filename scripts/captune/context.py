"""Prepare CapTune §4.2.1 ±5-second local audiovisual clips; optional explicit NVIDIA drafts.
Output a hash-bound manifest. The paper's VideoLLaMA2 model is not installed/run.
"""
import argparse,hashlib,json,subprocess,base64,sys,urllib.request
from pathlib import Path

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',type=Path,required=True);ap.add_argument('--video',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--limit',type=int,default=3);ap.add_argument('--ffmpeg',default='ffmpeg');ap.add_argument('--ffprobe',default='ffprobe');ap.add_argument('--extract',action='store_true');ap.add_argument('--describe-nim',action='store_true');ap.add_argument('--allow-inference',action='store_true')
    args=ap.parse_args()
    if not 1<=args.limit<=100:ap.error('--limit must be 1 to 100')
    if args.describe_nim and (not args.extract or not args.allow_inference or args.limit>3):ap.error('NIM descriptions require --extract --allow-inference and --limit 1 to 3')
    subprocess.run(['node','--experimental-strip-types',str(Path(__file__).with_name('validate.ts')),str(args.project)],capture_output=True,text=True,check=True)
    p=json.loads(args.project.read_text());video=args.video.resolve(strict=True)
    if p.get('format')!='scenecaptions-anchored-v1':raise ValueError('Import an anchored project first.')
    sha=hashlib.file_digest(video.open('rb'),'sha256').hexdigest()
    if p['metadata'].get('video_sha256') and p['metadata']['video_sha256']!=sha:raise ValueError('Video hash does not match project.')
    probe=subprocess.run([args.ffprobe,'-v','error','-show_entries','format=duration','-of','json',str(video)],capture_output=True,text=True,check=True)
    duration=float(json.loads(probe.stdout)['format']['duration'])
    if abs(duration-p['metadata']['duration'])>1:raise ValueError('Video duration does not match project.')
    args.output.mkdir(parents=True,exist_ok=False)
    manifest={'paper':'CapTune §4.2.1','project_sha256':hashlib.sha256(args.project.read_bytes()).hexdigest(),'video_sha256':sha,'paper_model':'DAMO-NLP-SG/VideoLLaMA2.1-7B-AV','configured_model':'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning' if args.describe_nim else None,'prompt':'Can you describe the visual and audio content in this video clip?','inference_performed':False,'clips':[]}
    contexts=[]
    for i,c in enumerate([c for c in p['cues'] if c['nsi']][:args.limit]):
        start=max(0,float(c['start'])-5);end=min(duration,float(c['start'])+5);item={'id':c['id'],'start':start,'end':end,'context_status':'missing'}
        if args.extract:
            out=args.output/f'{i:04d}.mp4'
            subprocess.run([args.ffmpeg,'-nostdin','-v','error','-ss',str(start),'-i',str(video),'-t',str(end-start),'-map','0:v:0','-map','0:a:0?','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-pix_fmt','yuv420p','-c:v','libx264','-preset','fast','-crf','23','-c:a','aac','-movflags','+faststart','-n',str(out)],check=True)
            item.update(path=out.name,sha256=hashlib.file_digest(out.open('rb'),'sha256').hexdigest())
            if args.describe_nim:
                if out.stat().st_size>4*1024*1024:raise ValueError('Context clip exceeds the verified 4 MB hosted-input budget. No request sent for this clip.')
                sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
                from nim_client import api_key,rate_limit
                key=api_key();rate_limit();model='nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
                data='data:video/mp4;base64,'+base64.b64encode(out.read_bytes()).decode()
                payload={'model':model,'stream':False,'temperature':0.2,'max_tokens':1024,'messages':[{'role':'user','content':[{'type':'text','text':'Can you describe the visual and audio content in this video clip?'},{'type':'video_url','video_url':{'url':data}}]}]}
                req=urllib.request.Request('https://integrate.api.nvidia.com/v1/chat/completions',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
                try:
                    with urllib.request.urlopen(req,timeout=180) as response:raw=json.load(response)
                except Exception:raise RuntimeError('NIM context request failed; no context accepted. No retry sent.') from None
                choice=(raw.get('choices') or [{}])[0];description=choice.get('message',{}).get('content')
                if choice.get('finish_reason')!='stop' or not isinstance(description,str) or not description.strip() or len(description)>8000:raise ValueError('Context response incomplete or invalid.')
                contexts.append({'id':c['id'],'description':description,'model':model})
                manifest['inference_performed']=True
                (args.output/'context-result.json').write_text(json.dumps({'format':'scenecaptions-context-result-v1','project':p,'contexts':contexts},ensure_ascii=False,indent=2))
        manifest['clips'].append(item)
        (args.output/'manifest.json').write_text(json.dumps(manifest,indent=2))
    (args.output/'manifest.json').write_text(json.dumps(manifest,indent=2))
    print(json.dumps({'output':str(args.output),'clips':len(manifest['clips']),'inference_performed':manifest['inference_performed']}))
if __name__=='__main__':main()
