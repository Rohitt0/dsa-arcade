import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'deps'))
import fitz
root=Path(__file__).parent
d=fitz.open(r'C:\Users\Rohit\Downloads\naveen.pdf')
data=[]
for i,p in enumerate(d):
    bs=[]
    for b in p.get_text('dict')['blocks']:
        if b['type']==0:
            spans=[s for l in b['lines'] for s in l['spans']]
            bs.append({'box':b['bbox'],'text':' '.join(s['text'] for s in spans),'spans':spans})
    data.append({'page':i+1,'size':list(p.rect),'blocks':bs,'images':[{'box':list(z['bbox']),'xref':z['xref']} for z in p.get_image_info(xrefs=True)]})
    p.get_pixmap(matrix=fitz.Matrix(0.9,0.9)).save(root/f'original-{i+1:02}.png')
(root/'layout.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
for p in data:
    print('\nPAGE',p['page'],p['size'])
    for k,b in enumerate(p['blocks']):
        s=b['spans'][0]
        print(k,tuple(round(x,1) for x in b['box']),s['font'],round(s['size'],2),hex(s['color']),b['text'][:115])
    print('IMAGES',p['images'])
