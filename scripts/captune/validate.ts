import fs from 'node:fs';
import { projectSchema } from '../../src/lib/captune/project.ts';
try{const path=process.argv[2];if(!path||fs.statSync(path).size>50*1024*1024)throw Error('Choose a project smaller than 50 MB.');const p=projectSchema.parse(JSON.parse(fs.readFileSync(path,'utf8')));console.log(JSON.stringify({valid:true,cues:p.cues.length}));}catch{console.error('Invalid anchored project. Validate its format, captions, timestamps and bounds.');process.exit(1);}
