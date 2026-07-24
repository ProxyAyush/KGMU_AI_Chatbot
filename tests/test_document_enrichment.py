import sys, tempfile, unittest
from pathlib import Path
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from update_kgmu_updates import native_pdf_text, ocr_pdf_text, infer_title, download_document, Item, enrich_generic

class FakeResponse:
    def __init__(self,data,ctype='application/pdf',status=200): self.data=data; self.headers={'content-type':ctype}; self.status_code=status
    def __enter__(self): return self
    def __exit__(self,*a): pass
    def raise_for_status(self):
        if self.status_code>=400: raise RuntimeError(self.status_code)
    def iter_content(self,n):
        for i in range(0,len(self.data),n): yield self.data[i:i+n]
class FakeSession:
    def __init__(self,data,ctype='application/pdf'): self.data=data; self.ctype=ctype
    def get(self,*a,**k): return FakeResponse(self.data,self.ctype)

def text_pdf(path):
    c=canvas.Canvas(str(path)); c.drawString(72,750,'Subject: Quotation for supply and installation of ICU bedside monitors'); c.drawString(72,720,'Department of Critical Care Medicine, KGMU Lucknow'); c.save()
def scan_pdf(path):
    img=Image.new('RGB',(1700,2200),'white'); d=ImageDraw.Draw(img); d.text((120,220),'NAME OF WORK: Servicing of Cummins 320 KVA DG Set in Gandhi Ward',fill='black'); d.text((120,300),'King Georges Medical University Lucknow',fill='black'); img.save(path,'PDF',resolution=150)

class DocumentTests(unittest.TestCase):
    def test_native_text_and_title(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/'x.pdf'; text_pdf(p); t=native_pdf_text(p)
            self.assertIn('ICU bedside monitors',t)
            self.assertIn('ICU bedside monitors',infer_title(t))
    def test_scanned_pdf_ocr(self):
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); p=td/'x.pdf'; scan_pdf(p); self.assertLess(len(native_pdf_text(p)),30)
            t=ocr_pdf_text(p,td); self.assertRegex(t.lower(),r'cummins|gandhi')
    def test_html_disguised_as_pdf_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(ValueError,'HTML'):
                download_document(FakeSession(b'<html>blocked</html>','text/html'),'https://x/a.pdf',Path(td)/'x.pdf')
    def test_corrupt_pdf_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(ValueError,'unsupported|corrupt'):
                download_document(FakeSession(b'not a pdf'),'https://x/a.pdf',Path(td)/'x.pdf')

if __name__=='__main__': unittest.main()
