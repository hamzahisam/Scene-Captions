"""Offline-only NVIDIA bridge contract; all transport and private key access mocked."""
import importlib.util,io,json,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('captune_nim',ROOT/'scripts/captune/nim.py')
bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
class BridgeTest(unittest.TestCase):
 def run_response(self,finish='stop',content='{"detail":3,"expression":2}'):
  body={'choices':[{'finish_reason':finish,'message':{'content':content}}]}
  handle=io.BytesIO(json.dumps(body).encode())
  with patch.object(bridge,'api_key',return_value='test-private-key'),patch.object(bridge,'rate_limit'),patch.object(bridge.urllib.request,'urlopen',return_value=handle) as request,patch('sys.stdin',io.StringIO('{"system":"trusted prompt","kind":"baseline"}')),patch('sys.stdout',new_callable=io.StringIO) as output:
   bridge.main();return json.loads(output.getvalue()),request.call_args.args[0]
 def test_valid_complete_response(self):
  result,request=self.run_response();self.assertEqual(result['output'],{'detail':3,'expression':2});self.assertNotIn('test-private-key',json.dumps(result));payload=json.loads(request.data);self.assertEqual(payload['reasoning_effort'],'none');self.assertEqual(payload['messages'][0]['content'],'trusted prompt')
 def test_truncated_or_empty_response_never_accepted(self):
  for finish,content in [('length','{}'),('stop',''),('stop','{} trailing prose')]:
   with self.assertRaises(RuntimeError):self.run_response(finish,content)
