const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const source=fs.readFileSync('../script6.js','utf8');
const original=fs.readFileSync('baseline-script6.js','utf8');
const normalize=source.slice(source.indexOf('    function normalizeUrl('),source.indexOf('    // Builds only known elements.'));
const parser=source.slice(source.indexOf('    function parseMarkdown('),source.indexOf('    function showTypingIndicator('));
await page.setContent('<div id="result"></div>');
await page.addScriptTag({content:normalize+'\n'+parser});
const results=await page.evaluate(()=>{
 const attacks=['<img src=x onerror="window.pwned=1">','&lt;svg onload=window.pwned=1&gt;','[click](javascript:alert(1))','[x](https://kgmu.org/"onmouseover="alert(1))','<iframe srcdoc="<script>window.pwned=1</script>"></iframe>','[x](data:text/html,test)','[x](https://user:pass@evil.example)'];
 for(const attack of attacks){
  const root=document.querySelector('#result');root.innerHTML=parseMarkdown(attack);
  if(root.querySelector('img,svg,iframe,script,object,embed'))throw Error('Unsafe element');
  for(const element of root.querySelectorAll('*'))for(const attr of element.attributes)if(/^on/i.test(attr.name))throw Error('Unsafe attribute');
  for(const a of root.querySelectorAll('a'))if(!['http:','https:'].includes(new URL(a.href).protocol))throw Error('Unsafe scheme');
 }
 const root=document.querySelector('#result');root.innerHTML=parseMarkdown('# Heading\n**Bold**\n[Notice](/notice.php)\n- One\n- Two\n```\n<img onerror=x>\n```');
 if(!root.querySelector('h1')||!root.querySelector('strong')||root.querySelectorAll('li').length!==2||root.querySelector('a').href!=='https://www.kgmu.org/notice.php'||!root.querySelector('pre code'))throw Error('Formatting regression');
 if(window.pwned)throw Error('XSS');
 return {xssPayloads:attacks.length,formatChecks:5};
});
const assert=require('assert/strict');
const protectedRegions=[
 ['CSS, layout and consent UI',0,original.indexOf('    // Retry & Resilience Configuration')],
];
assert.equal(source.slice(0,source.indexOf('    // Retry & Resilience Configuration')),original.slice(0,original.indexOf('    // Retry & Resilience Configuration')));
for(const [start,end] of [['    // Premade responses','    function resetChat()'],['    function startTimer()','\n});']]) {
 assert.equal(source.slice(source.indexOf(start),source.lastIndexOf(end)),original.slice(original.indexOf(start),original.lastIndexOf(end)),start);
}
console.log('PASS browser rendering:',JSON.stringify(results));
console.log('PASS byte-for-byte protected CSS, consent UI, premade responses/events, cooldown functions');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
