"""Apply explicit main-session editorial decisions; never infer approval from a model."""
from pathlib import Path
import json,hashlib,re,sys
from palettes import ROOT,OUT,labels,check,expand

def js_hash(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def plain(s):return s.rstrip(' .!').replace(' — Snoring',' — snoring').strip()
def main():
 decisions=json.loads((OUT/'editorial-decisions.json').read_text());_,references=labels()
 by_index={r['index']:r for r in decisions['labels']}
 if set(by_index)!=set(range(len(references))):raise ValueError('Every sound label needs explicit editorial approval before assembly.')
 output={'reviewer':decisions['reviewer'],'review_kind':'source-text-editorial','limits':decisions['limits'],'selection_policy':decisions['selection_policy'],'palettes':[]}
 changes=[]
 source_terms=set('bunny squirrel squirrels apple core nut nuts tree leaves branches branch brook fly bird wings ears neck bow string vine ropes rock log traps trap twig wind poop butterfly music'.split())
 for i,reference in enumerate(references):
  decision=by_index[i]
  if decision['approved'] is not True:raise ValueError('Pending editorial decision.')
  file=OUT/'palettes'/f'{i:03d}-v9.json'
  if not file.exists():file=OUT/'palettes'/f'{i:03d}-v9-super.json'
  raw=json.loads(file.read_text());texts=raw['palette']['texts'][:]
  for index,text in sorted(decision['text_edits'].items(),key=lambda item:int(item[0])):
   if int(index)==len(texts):texts.append(text)
   elif int(index)<len(texts):texts[int(index)]=text
   else:raise ValueError('Editorial insertion leaves a gap in the phrase list.')
  neutral=[plain(texts[k]) for k in decision['neutral_indices']]
  onom=[plain(texts[k]) for k in decision['onomatopoeia_indices']] if decision['onomatopoeia_indices'] else []
  tokens=set(re.findall(r'[a-z]+',reference.lower()));needed=tokens&source_terms
  if 'conkers' in tokens:needed.add('nuts')
  def has_source(text):return all(any(term in text.lower() for term in {'twig':['twig','small branch'],'brook':['brook','stream']}.get(word,[word])) for word in needed)
  source=neutral[:] if all(has_source(t) for t in neutral) else [next((t for t in neutral[1:] if has_source(t)),neutral[-1]),neutral[1],neutral[2]]
  if not all(has_source(t) for t in source):raise ValueError(f'Source mode drops an actor/object: {reference}')
  if onom:
   onom=[t if has_source(t) else next((o for o in onom if has_source(o)),source[k]) for k,t in enumerate(onom)]
  pool=[];regions=[]
  for mode in ['default','source','onomatopoeia','sensory']:
   for genre in [0,1]:
    for k,bounds in enumerate([[1,3],[4,6],[7,10]]):
     for low,high in [(1,3),(4,7),(8,10)]:
      choices=source if mode in ['source','onomatopoeia'] else neutral
      if onom and (mode=='onomatopoeia' or (mode=='default' and genre==1)):choices=onom
      text=choices[k]
      if low==4:text+='.'
      if low==8:text+='!'
      if text not in pool:pool.append(text)
      regions.append({'detail':bounds,'expression':[low,high],'modes':[mode],'genre':[genre],'text':pool.index(text)})
  palette={'texts':pool,'regions':regions};check(palette,enforce_axes=False)
  before=expand(raw['palette']);after=expand(palette)
  changed=sum(before[key]!=text for key,text in after.items())
  output['palettes'].append({'reference':reference,'approved':True,'generated_file':str(file.relative_to(ROOT)),'generated_sha256':js_hash(raw),'generation_model':raw['model'],'request_sha256':raw['request_sha256'],'note':decision['note'],'palette':palette})
  changes.append({'index':i,'reference':reference,'original_unique_texts':len(raw['palette']['texts']),'edited_unique_texts':len(pool),'changed_cell_wordings_or_selection':changed,'grammar_edits':decision['text_edits']})
 (OUT/'approved-palettes.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 (OUT/'editorial-change-summary.json').write_text(json.dumps({'reviewer':decisions['reviewer'],'kind':'source-text-editorial','changed_atomic_style_cells':sum(x['changed_cell_wordings_or_selection'] for x in changes),'changes':changes},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'approved_labels':len(output['palettes']),'atomic_style_cells':len(references)*800,'changed_cells':sum(x['changed_cell_wordings_or_selection'] for x in changes)}))
if __name__=='__main__':
 try:main()
 except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
