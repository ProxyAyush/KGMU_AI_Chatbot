import {readFileSync} from 'node:fs';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
const test = await initializeTestEnvironment({projectId:'demo-kgmu-hardening',firestore:{rules:readFileSync('firestore.rules','utf8')}});
try {
 await test.clearFirestore();
 const db=test.unauthenticatedContext().firestore();
 const day=new Date().toISOString().slice(0,10);
 const ref=doc(db,'QA-CHATBOT',day);
 const entry=()=>({question:'Where is KGMU?',answer:'Lucknow',timestamp:serverTimestamp(),consent:true,consentTimestamp:new Date().toISOString()});
 const k1='qa_'+'a'.repeat(32),k2='qa_'+'b'.repeat(32),k3='qa_'+'c'.repeat(32);
 await assertSucceeds(setDoc(ref,{[k1]:entry()},{merge:true}));
 await assertSucceeds(setDoc(ref,{[k2]:entry()},{merge:true}));
 await assertFails(getDoc(ref));
 await assertFails(deleteDoc(ref));
 await assertFails(setDoc(ref,{[k1]:{...entry(),answer:'tamper'}},{merge:true}));
 await assertFails(setDoc(ref,{[k3]:{...entry(),consent:false}},{merge:true}));
 await assertFails(setDoc(ref,{[k3]:{...entry(),extra:'unexpected'}},{merge:true}));
 await assertFails(setDoc(ref,{[k3]:{...entry(),question:'a'.repeat(4001)}},{merge:true}));
 await assertFails(setDoc(doc(db,'QA-CHATBOT','2000-01-01'),{[k1]:entry()}));
 await assertFails(setDoc(ref,{[k3]:entry(),['qa_'+'d'.repeat(32)]:entry()},{merge:true}));
 console.log('PASS: 10 Firestore rule checks. App Check enforcement requires a separate live check.');
} finally { await test.cleanup(); }
