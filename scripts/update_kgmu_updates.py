#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, html, json, re, subprocess, sys, tempfile, unicodedata
from dataclasses import asdict, dataclass, replace
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlsplit, urlunsplit
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup

BASE='https://www.kgmu.org/'
SOURCES=(('notice',urljoin(BASE,'kgmu_notice_board.php'),0),('tender',urljoin(BASE,'tenders.php'),1),('exam',urljoin(BASE,'exam_notice.php'),2),('homepage',BASE,3))
START='<!-- AUTO_KGMU_UPDATES_START -->'; END='<!-- AUTO_KGMU_UPDATES_END -->'
UA='KGMU-AI-Chatbot-Notice-Updater/2.0 (+https://github.com/ProxyAyush/KGMU_AI_Chatbot)'
GENERIC={'quotation notice','tender notice','notice','download','view','click here'}
MAX_BYTES=15*1024*1024

@dataclass(frozen=True)
class Item:
    title:str; published:date; url:str; source:str; source_priority:int; notice_no:str=''; extraction:str='listing'
    @property
    def key(self):
        k=normalize_title(self.title)
        return f'{k} {normalize_title(self.notice_no)}' if k in {'quotation notice','tender notice','notice'} and self.notice_no else k

def clean_text(v): return re.sub(r'\s+',' ',html.unescape(v or '')).strip(' \t\r\n-|')
def normalize_title(v):
    v=unicodedata.normalize('NFKD',clean_text(v)).lower().replace('&',' and ')
    return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9]+',' ',v)).strip()
def canonical_url(v,b):
    p=urlsplit(urljoin(b,v)); return urlunsplit(('https',p.netloc.lower(),p.path,p.query,''))
def extract_dates(t):
    out=[]
    for d,m,y in re.findall(r'\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b',t):
        try:
            x=date(int(y),int(m),int(d))
            if x!=date(1970,1,1): out.append(x)
        except ValueError: pass
    return out
def best_date(t):
    today=date.today()
    return next((d for d in extract_dates(t) if date(2000,1,1)<=d<=today),None)
def session():
    s=requests.Session(); r=Retry(total=3,connect=3,read=2,status=2,backoff_factor=.8,status_forcelist=(429,500,502,503,504),allowed_methods=frozenset({'GET'}))
    s.mount('https://',HTTPAdapter(max_retries=r)); s.headers.update({'User-Agent':UA,'Accept':'text/html,application/pdf,*/*'})
    return s

def get_html(s,url):
    r=s.get(url,timeout=(12,40)); r.raise_for_status(); r.encoding=r.apparent_encoding or 'utf-8'; return r.text

def row_items(page,source,source_url,priority):
    soup=BeautifulSoup(page,'html.parser'); out=[]
    for row in soup.select('tr, li, .notice, .news, .news-item'):
        text=clean_text(row.get_text(' ',strip=True)); published=best_date(text)
        if not published: continue
        a=next((x for x in row.select('a[href]') if clean_text(x.get_text(' ',strip=True))),None)
        if not a: continue
        title=clean_text(a.get_text(' ',strip=True)); cells=[clean_text(x.get_text(' ',strip=True)) for x in row.select('td')]
        notice_no=''
        if source=='tender' and len(cells)>=2: notice_no=cells[1]
        else:
            m=re.search(r'(?:Notice\s*No\.?|Reference)\s*[:\-]?\s*([A-Za-z0-9/()._-]+)',text,re.I); notice_no=m.group(1) if m else ''
        if len(title)<4: title=text
        out.append(Item(title,published,canonical_url(a.get('href'),source_url),source,priority,notice_no))
    return out

def download_document(s,url,dest):
    with s.get(url,timeout=(12,50),stream=True,allow_redirects=True) as r:
        r.raise_for_status(); ctype=(r.headers.get('content-type') or '').lower(); total=0
        with dest.open('wb') as f:
            for chunk in r.iter_content(65536):
                if not chunk: continue
                total+=len(chunk)
                if total>MAX_BYTES: raise ValueError('document exceeds 15 MB')
                f.write(chunk)
    head=dest.read_bytes()[:8]
    if head.startswith(b'%PDF-'): return 'pdf'
    if b'<html' in dest.read_bytes()[:512].lower() or 'text/html' in ctype: raise ValueError('server returned HTML instead of a document')
    raise ValueError(f'unsupported or corrupt document ({ctype or "unknown MIME"})')

def run_cmd(args,timeout):
    return subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout,check=False)

def native_pdf_text(pdf):
    p=run_cmd(['pdftotext','-f','1','-l','2','-layout',str(pdf),'-'],35)
    return clean_text(p.stdout) if p.returncode==0 else ''
def ocr_pdf_text(pdf,tmp):
    prefix=tmp/'page'; p=run_cmd(['pdftoppm','-f','1','-l','2','-r','180','-png',str(pdf),str(prefix)],45)
    if p.returncode!=0: return ''
    texts=[]
    for image in sorted(tmp.glob('page-*.png'))[:2]:
        q=run_cmd(['tesseract',str(image),'stdout','-l','eng','--psm','6'],45)
        if q.returncode==0: texts.append(q.stdout)
    return clean_text(' '.join(texts))

def useful_document_text(s,url):
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); pdf=td/'notice.pdf'; download_document(s,url,pdf)
        text=native_pdf_text(pdf)
        if len(re.sub(r'\W','',text))>=120: return text,'pdf-text'
        ocr=ocr_pdf_text(pdf,td)
        if len(re.sub(r'\W','',ocr))>=80: return ocr,'ocr'
        return text or ocr,'unreadable'

def infer_title(text,notice_no=''):
    t=clean_text(text)
    # Prefer explicit subject/work/procurement lines.
    patterns=[r'(?:Subject|Sub\.?|Name of Work|Work Name|Tender for|Quotation for)\s*[:\-]\s*(.{20,220}?)(?=\s{2,}|\b(?:Sir|Reference|Ref\.|Date)\b|$)',
              r'((?:Supply|Purchase|Procurement|Repairing|Servicing|Dismantling|Installation|SITC|CAMC|Recruitment|Walk-in)[^.\n]{15,220})']
    for pat in patterns:
        m=re.search(pat,t,re.I)
        if m:
            title=clean_text(m.group(1)); title=re.sub(r'\s+(?:at|for)\s+King George.*$','',title,flags=re.I)
            if 15<=len(title)<=240: return title.rstrip(' .;:-')
    # A conservative sentence fallback, excluding letterhead boilerplate.
    for sentence in re.split(r'(?<=[.;])\s+',t):
        s=clean_text(sentence)
        if 25<=len(s)<=220 and re.search(r'quotation|tender|procurement|supply|repair|recruitment|examination',s,re.I):
            if not re.search(r'king george|university|lucknow|phone|email|website',s,re.I): return s.rstrip(' .;:-')
    return ''

def enrich_generic(items,s,limit=10):
    out=[]; errors=[]
    for item in items:
        if len(out)>=limit: out.extend(items[len(out):]); break
        if normalize_title(item.title) not in GENERIC or not item.url.lower().endswith('.pdf'):
            out.append(item); continue
        try:
            text,method=useful_document_text(s,item.url); better=infer_title(text,item.notice_no)
            if better: item=replace(item,title=better,extraction=method)
            else: item=replace(item,title=f'{item.title} - Ref. {item.notice_no}' if item.notice_no else item.title,extraction=method)
        except Exception as e:
            errors.append(f'{item.url}: {type(e).__name__}: {e}')
            if item.notice_no: item=replace(item,title=f'{item.title} - Ref. {item.notice_no}',extraction='fallback')
        out.append(item)
    return out,errors

def dedupe(items:Iterable[Item]):
    ordered=sorted(items,key=lambda x:(x.published,-x.source_priority),reverse=True); kept=[]; urls=set(); keys=set()
    for i in ordered:
        if not i.key or i.url in urls or i.key in keys: continue
        duplicate=False
        for e in kept:
            if i.notice_no and e.notice_no and normalize_title(i.notice_no)!=normalize_title(e.notice_no): continue
            a=set(i.key.split()); b=set(e.key.split())
            if a and b and len(a&b)/max(1,min(len(a),len(b)))>=.9: duplicate=True; break
        if duplicate: continue
        kept.append(i); urls.add(i.url); keys.add(i.key)
    return kept

def render(items,generated_on=None):
    lines=[START,'# CURRENT KGMU UPDATES',f'Updated: {(generated_on or date.today()).isoformat()}','Use these entries for questions about the latest KGMU notices, tenders, quotations, or examinations.','']
    labels={'notice':'Notice','tender':'Tender/Quotation','exam':'Examination','homepage':'Homepage update'}
    for n,i in enumerate(items[:3],1):
        lines += [f'{n}. [{labels[i.source]}] {i.published.isoformat()} - {i.title}']
        if i.notice_no: lines.append(f'   Reference: {i.notice_no}')
        lines.append(f'   Source: {i.url}')
    return '\n'.join(lines+['',END])
def replace_block(original,block):
    p=re.compile(re.escape(START)+r'.*?'+re.escape(END),re.S)
    return p.sub(lambda _:block,original,count=1) if p.search(original) else original.rstrip()+'\n\n'+block+'\n'

def run(prompt_path,output_json=None):
    s=session(); all_items=[]; errors=[]
    for source,url,priority in SOURCES:
        try: all_items += row_items(get_html(s,url),source,url,priority)
        except Exception as e: errors.append(f'{source}: {type(e).__name__}: {e}')
    candidates=dedupe(all_items)[:10]
    enriched,enrich_errors=enrich_generic(candidates,s,10); errors+=enrich_errors
    latest=dedupe(enriched)[:3]
    if len(latest)<3:
        print('Refusing to modify prompt: fewer than 3 valid unique dated items.',file=sys.stderr); print('\n'.join(errors),file=sys.stderr); return 2
    original=prompt_path.read_text(encoding='utf-8'); updated=replace_block(original,render(latest))
    if updated!=original: prompt_path.write_text(updated,encoding='utf-8',newline='\n')
    if output_json:
        payload={'generated_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat(),'items':[{**asdict(i),'published':i.published.isoformat()} for i in latest],'errors':errors,'prompt_sha256':hashlib.sha256(updated.encode()).hexdigest()}
        output_json.write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    for i in latest: print(i.published,i.source,i.extraction,i.title,i.url,sep=' | ')
    return 0

def main():
    p=argparse.ArgumentParser(); p.add_argument('--prompt',type=Path,default=Path('system_prompt1.txt')); p.add_argument('--json',type=Path,default=Path('latest_updates.json')); a=p.parse_args(); return run(a.prompt,a.json)
if __name__=='__main__': raise SystemExit(main())
