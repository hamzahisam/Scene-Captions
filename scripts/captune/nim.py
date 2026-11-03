"""One bounded NVIDIA call using the existing project-private key/rate limiter.
No credentials, inline media, or provider response errors are printed.
"""
from pathlib import Path
import sys,json,urllib.request,urllib.error
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from nim_client import api_key,rate_limit,parse_json
MODEL='nvidia/nemotron-3-ultra-550b-a55b'
def main():
    job=json.load(sys.stdin)
    system=job.pop('system')
    job.pop('project',None)  # Editorial snapshot/cache stays local; only relevant prompt data reaches NIM.
    if len(json.dumps(job))>500000:raise ValueError('Prompt exceeds the bounded context budget; use a smaller project/context.')
    # Rebuild trusted prompt/fields in the TypeScript parent; request-supplied system is ignored.
    key=api_key();rate_limit()
    payload={'model':MODEL,'messages':[{'role':'system','content':system},{'role':'user','content':json.dumps(job,ensure_ascii=False)}],'max_tokens':16384,'temperature':0.2,'reasoning_effort':'none','stream':False}
    req=urllib.request.Request('https://integrate.api.nvidia.com/v1/chat/completions',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=180) as response: raw=json.load(response)
        output=parse_json(raw)
        print(json.dumps({'model':MODEL,'output':output,'usage':raw.get('usage')}))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'NVIDIA returned HTTP {exc.code}; no automatic retry was sent.') from None
    except Exception as exc:
        raise RuntimeError('NVIDIA response was incomplete, invalid, or unavailable. No draft accepted.') from None
if __name__=='__main__':
    try:main()
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
