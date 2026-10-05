import assert from 'node:assert/strict';
import worker from './worker.mjs';
let calls=[], mode='ok', sent;
const env = {GEMINI_API_KEY:'test-key',CHAT_RATE_LIMITER:{limit:async()=>({success:true})},GLOBAL_RATE_LIMITER:{limit:async()=>({success:true})}};
globalThis.fetch = async (url, init) => {
  calls.push(String(url));
  if (String(url).includes('siteverify')) return Response.json({success:mode!=='bad-token',hostname:mode==='wrong-host'?'evil.example':'kgmu.org',action:mode==='wrong-action'?'other':'kgmu_chat'});
  if (String(url).includes('raw.githubusercontent.com')) return new Response('Trusted KGMU prompt. '.repeat(20));
  sent = JSON.parse(init.body);
  if(mode==='fallback' && String(url).includes('3.5')) return new Response('',{status:429});
  if(mode==='auth-error') return new Response('',{status:403});
  if(mode==='blocked') return Response.json({promptFeedback:{blockReason:'SAFETY'}});
  return Response.json({candidates:[{content:{parts:[{text:'private thought',thought:true},{text:'KGMU answer'}]}}]});
};
const body={message:'Where is KGMU?',history:[]};
function req(data=body,origin='https://kgmu.org',path='/',method='POST') {
  const headers={'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'};
  if(origin!==null) headers.Origin=origin;
  return new Request('https://worker.example'+path,{method,headers,...(method==='POST'?{body:JSON.stringify(data)}:{})});
}
let tests=0;
async function check(name, request, status, setup='ok') {
  mode=setup;calls=[];
  const res=await worker.fetch(request,env);
  assert.equal(res.status,status,name);tests++;return res;
}
await check('missing origin',req(body,null),403);assert.equal(calls.length,0);
await check('host suffix bypass',req(body,'https://kgmu.org.evil.example'),403);
await check('http rejected',req(body,'http://kgmu.org'),403);
await check('unknown route',req(body,'https://kgmu.org','/anything'),404);
await check('preflight',req(body,'https://kgmu.org','/','OPTIONS'),204);
await check('client prompt override',req({...body,systemInstruction:{}}),400);
await check('oversize question',req({...body,message:'x'.repeat(4001)}),400);
await check('body cap',req({...body,message:'x'.repeat(100001)}),413);
await check('unexpected verification field rejected',req({...body,turnstileToken:'proof'}),400);
const ok=await check('successful answer',req(),200);assert.deepEqual(await ok.json(),{text:'KGMU answer'});
assert.equal(calls.some(url=>url.includes('siteverify')),false);
assert.equal(sent.contents.length,1);assert.equal(sent.contents[0].parts[0].text,body.message);
assert.ok(sent.systemInstruction.parts[0].text.startsWith('Trusted KGMU prompt.'));
assert.equal(sent.generationConfig.maxOutputTokens,1024);
await check('fallback',req(),200,'fallback');assert.equal(calls.filter(x=>x.includes('generateContent')).length,2);
await check('auth error stops chain',req(),502,'auth-error');assert.equal(calls.filter(x=>x.includes('generateContent')).length,1);
await check('blocked response does not bypass safety',req(),200,'blocked');assert.equal(calls.filter(x=>x.includes('generateContent')).length,1);
env.CHAT_RATE_LIMITER.limit=async()=>({success:false});
await check('server limit',req(),429);assert.equal(calls.length,0);
delete env.CHAT_RATE_LIMITER;
await check('missing binding fails closed',req(),503);
console.log(`PASS: ${tests} Worker checks plus payload/attempt assertions`);
