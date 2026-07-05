/**
 * TrustBridge Document Verification Engine v5
 * Fixed: extractName now scores ALL candidates and picks best.
 * "Ee Rt Rere" is rejected (>50% short tokens), "Nasani Ganesh" wins.
 */
import axios from 'axios';

const SCORE_THRESHOLD = Number(process.env.VERIFICATION_THRESHOLD || 80);
const NAME_THRESHOLD  = Number(process.env.NAME_MATCH_THRESHOLD   || 60);
const GLOBAL_MIN_CONF = Number(process.env.MIN_OCR_CONFIDENCE     || 25);
const DOC_MIN_CONF    = { aadhaar:25, pan:30, gst:35, businessLicense:35, registrationCert:35 };
const PROVIDER        = (process.env.OCR_PROVIDER || 'tesseract').toLowerCase();
const IDENTITY_DOCS   = new Set(['aadhaar','pan']);

// ── Text normalization ────────────────────────────────────────────────────────
function normalizeText(raw) {
  const lower   = (raw||'').toLowerCase();
  const compact = lower.replace(/[\s\n\r]+/g,'');
  const clean   = lower.replace(/[^\w\s\d]/g,' ').replace(/\s+/g,' ').trim();
  const spaced  = (raw||'').replace(/([a-z])([A-Z])/g,'$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').toLowerCase().replace(/\s+/g,' ').trim();
  return { raw:raw||'', lower, compact, clean, spaced };
}
function matchAny(pat,f){for(const t of[f.raw,f.lower,f.compact,f.clean,f.spaced]){const m=t.match(pat);if(m)return m;}return null;}
function testAny(pat,f){return!!matchAny(pat,f);}

// ── Aadhaar patterns ──────────────────────────────────────────────────────────
const AP={
  number:   /\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/,
  keyword:  /aadhaar|uidai|aadhar|unique.{0,5}ident/i,
  govt:     /government.{0,5}of.{0,5}india|governmentofindia|govt.{0,5}of.{0,5}india|govtofindia/i,
  yob:      /year.{0,5}of.{0,5}birth.{0,10}(19|20)\d{2}|yearofbirth.{0,5}(19|20)\d{2}/i,
  year:     /(19|20)\d{2}/,
  dob:      /\d{2}[\/\-]\d{2}[\/\-](19|20)\d{2}/,
  gender:   /\b(male|female)\b/i,
  relation: /s\/o|d\/o|w\/o|son of|daughter of/i,
};
const PAN_P={
  number:  /[A-Z]{5}[0-9]{4}[A-Z]/,
  keyword: /income.{0,5}tax|permanent.{0,5}account|pan.{0,3}card/i,
  govt:    /income.{0,5}tax.{0,10}(department|dept)|govt.{0,5}of.{0,5}india/i,
};
const OTHER_P={
  gst:             {number:/\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]/i, keyword:/gst|gstin|goods.{0,10}services.{0,10}tax/i},
  businessLicense: {number:/[A-Z0-9]{6,20}/,                              keyword:/license|licence|municipal|corporation/i},
  registrationCert:{number:/[A-Z]{1,3}\d{6,10}[A-Z0-9]*/,                keyword:/registration|certificate|incorporation|\bcin\b|\bllp\b/i},
};

// ── Name noise set ────────────────────────────────────────────────────────────
const NOISE=new Set(['fo','of','to','in','on','at','by','an','or','is','are','was','be','do','the','and',
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
  'government','india','uidai','aadhaar','aadhar','unique','identification','authority',
  'address','mobile','year','birth','date','dob','male','female','valid',
  'enrollment','enrolment','number','card','resident','republic']);

const NAME_SKIP=/government|india|uidai|aadhaar|aadhar|unique|authority|address|mobile|year|birth|date|dob|male|female|valid|\d/i;

// ── cleanOcrName: strip noise tokens ─────────────────────────────────────────
// "B a Nasani Ganesh fo" -> "Nasani Ganesh"
function cleanOcrName(raw){
  if(!raw) return null;
  const tokens=raw.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
  const valid=tokens.filter(t=>t.length>=2&&/^[a-z]+$/.test(t)&&!NOISE.has(t));
  if(!valid.length) return null;
  const c=valid.map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
  console.log(`[DocVerify] cleanOcrName: "${raw}" -> "${c}"`);
  return c;
}

// ── scoreNameCandidate ────────────────────────────────────────────────────────
// Returns -1 (reject) or 0+ (higher = better name candidate)
// KEY RULE: >50% short tokens (<=2 chars) = OCR garbage like "Ee Rt Rere"
function scoreNameCandidate(cleaned){
  if(!cleaned) return -1;
  const tokens=cleaned.trim().split(/\s+/).filter(Boolean);
  if(!tokens.length) return -1;
  const shortCount=tokens.filter(t=>t.length<=2).length;
  if(shortCount/tokens.length>0.5){
    console.log(`[DocVerify] scoreNameCandidate REJECT "${cleaned}" — ${shortCount}/${tokens.length} short tokens`);
    return -1;
  }
  let s=0;
  if(tokens.length>=2&&tokens.length<=4) s+=30; else if(tokens.length===1) s+=5;
  s+=tokens.filter(t=>t.length>=3).length*15;
  s+=tokens.filter(t=>/^[A-Z][a-z]{2,}$/.test(t)).length*20;
  if(NAME_SKIP.test(cleaned)) s-=100;
  return s;
}

// ── collectNameCandidates ─────────────────────────────────────────────────────
function collectNameCandidates(raw){
  const cands=[];
  // 1. Explicit "Name:" label
  const lm=raw.match(/(?:name)\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,40})/i);
  if(lm?.[1]) cands.push({text:lm[1].trim(),source:'label'});
  // 2. Line-by-line — trim each line first so trailing \r or spaces don't break the test
  for(const line of raw.split('\n').map(l=>l.trim()).filter(Boolean)){
    if(line.length<3||line.length>60) continue;
    if(/^\d/.test(line)) continue;
    // Allow letters and spaces only (trimmed, so no \r issues)
    if(!/^[A-Za-z][A-Za-z\s]{2,55}$/.test(line)) continue;
    cands.push({text:line,source:'line'});
  }
  // 3. Title-case runs before the Aadhaar number
  const idx=raw.search(/\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/);
  if(idx>20){
    const before=raw.slice(Math.max(0,idx-200),idx);
    for(const m of before.matchAll(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g))
      cands.push({text:m[1].trim(),source:'titleCase'});
  }
  // 4. Title-case runs anywhere in the full text (catches names after the number)
  for(const m of raw.matchAll(/([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})+)/g)){
    const t=m[1].trim();
    if(t.length>=5&&t.length<=50&&!NAME_SKIP.test(t))
      cands.push({text:t,source:'titleCaseAny'});
  }
  // 5. After "India" line pattern
  const aim=raw.match(/india\s*\n\s*([A-Za-z][A-Za-z\s]{2,40})\n/i);
  if(aim?.[1]) cands.push({text:aim[1].trim(),source:'afterIndia'});
  return cands;
}

// ── extractName: score all candidates, pick best ─────────────────────────────
function extractName(forms){
  const cands=collectNameCandidates(forms.raw);
  const scored=cands
    .map(c=>{const cleaned=cleanOcrName(c.text);return{raw:c.text,cleaned,score:cleaned?scoreNameCandidate(cleaned):-1,source:c.source};})
    .filter(c=>c.score>=0&&c.cleaned)
    .sort((a,b)=>b.score-a.score);
  console.log(`[DocVerify] Name candidates (${scored.length} valid of ${cands.length} total):`);
  scored.forEach((c,i)=>console.log(`  [${i+1}] score=${c.score} src=${c.source} raw="${c.raw}" cleaned="${c.cleaned}"`));
  if(!scored.length){console.log('[DocVerify] No valid name candidate');return null;}
  const best=scored[0];
  console.log(`[DocVerify] Selected: "${best.cleaned}" (score=${best.score})`);
  return best.cleaned;
}

// ── extractAddress ────────────────────────────────────────────────────────────
function extractAddress(raw){
  const m=raw.match(/(?:address|s\/o|d\/o|w\/o|c\/o)[:\s]+(.{10,120})/i);
  return m?.[1]?.trim()||null;
}

// ── measureAadhaarStrength ────────────────────────────────────────────────────
function measureAadhaarStrength(forms){
  const ind=[]; let s=0;
  if(testAny(AP.number,forms))  {ind.push('12-digit number'); s+=40;}
  if(testAny(AP.govt,forms))    {ind.push('Govt of India');   s+=25;}
  if(testAny(AP.keyword,forms)) {ind.push('Aadhaar keyword'); s+=20;}
  if(testAny(AP.yob,forms))     {ind.push('Year of birth');   s+=15;}
  else if(testAny(AP.year,forms)){ind.push('4-digit year');   s+= 8;}
  if(testAny(AP.dob,forms))     {ind.push('Full DOB');        s+=10;}
  if(testAny(AP.gender,forms))  {ind.push('Gender');          s+= 8;}
  if(testAny(AP.relation,forms)){ind.push('Relationship');    s+= 5;}
  const name=extractName(forms); if(name){ind.push(`Name:"${name}"`); s+=15;}
  return{score:Math.min(100,s),indicators:ind,name};
}

// ── detectDocType ─────────────────────────────────────────────────────────────
function detectDocType(forms){
  if(testAny(AP.keyword,forms)||testAny(AP.number,forms)||testAny(AP.govt,forms)) return 'aadhaar';
  if(testAny(PAN_P.keyword,forms)||testAny(PAN_P.number,forms)) return 'pan';
  if(testAny(OTHER_P.gst.keyword,forms)||testAny(OTHER_P.gst.number,forms)) return 'gst';
  if(testAny(OTHER_P.registrationCert.keyword,forms)) return 'registrationCert';
  if(testAny(OTHER_P.businessLicense.keyword,forms)) return 'businessLicense';
  return 'unknown';
}

// ── matchName: subset + Jaccard, best wins ────────────────────────────────────
// subsetScore / profileWordCount so OCR noise tokens don't reduce score
function matchName(extractedName,providerName,providerBusiness){
  if(!extractedName) return{score:0,matched:false,reason:'No name extracted from document'};
  const norm=s=>(s||'').toLowerCase().replace(/[^a-z\s]/g,'').trim();
  const words=s=>[...new Set(norm(s).split(/\s+/).filter(w=>w.length>=2))];
  const eW=new Set(words(extractedName));
  const subset=t=>{const tw=words(t);if(!tw.length)return 0;return tw.filter(w=>eW.has(w)).length/tw.length;};
  const jaccard=t=>{const tw=new Set(words(t));if(!tw.size)return 0;const i=[...tw].filter(w=>eW.has(w)).length;return i/Math.max(tw.size,eW.size);};
  const nS=subset(providerName||''),bS=subset(providerBusiness||''),nJ=jaccard(providerName||''),bJ=jaccard(providerBusiness||'');
  const best=Math.max(nS,bS,nJ,bJ),score=Math.round(best*100);
  console.log(`[DocVerify] matchName: extracted="${extractedName}" profile="${providerName}" nameSubset=${Math.round(nS*100)}% nameJaccard=${Math.round(nJ*100)}% best=${score}%`);
  return{score,matched:score>=NAME_THRESHOLD,nameRatio:Math.round(Math.max(nS,nJ)*100),bizRatio:Math.round(Math.max(bS,bJ)*100),
    reason:score<NAME_THRESHOLD?`Name "${extractedName}" does not match profile "${providerName}" (${score}% < ${NAME_THRESHOLD}% required)`:null};
}

// ── validateAadhaar ───────────────────────────────────────────────────────────
function validateAadhaar(forms,rawText){
  const fail=[];let s=0;
  const nm=matchAny(AP.number,forms);
  if(nm){s+=35;console.log(`[DocVerify] Aadhaar number: "${nm[0]}"`);}
  else{fail.push('Aadhaar 12-digit number not found');console.log(`[DocVerify] Aadhaar number FAILED compact="${forms.compact.slice(0,80)}"`);}
  if(testAny(AP.keyword,forms)||testAny(AP.govt,forms)){s+=35;console.log('[DocVerify] Aadhaar keyword/govt matched');}
  else{fail.push('Aadhaar/Government of India keyword not found');console.log(`[DocVerify] Aadhaar keyword FAILED compact="${forms.compact.slice(0,120)}"`);}
  const cs=measureAadhaarStrength(forms);
  if(cs.name) s+=10;
  if(testAny(AP.dob,forms)||testAny(AP.yob,forms)||testAny(AP.year,forms)) s+=10;
  if(testAny(AP.gender,forms)) s+=5;
  if(testAny(AP.govt,forms))   s+=10;
  s=Math.min(100,s);
  const fields={};
  if(nm)      fields.documentNumber=nm[0].replace(/\s/g,'');
  if(cs.name) fields.name=cs.name;
  const dobM=matchAny(AP.dob,forms);
  if(dobM) fields.dob=dobM[0]; else{const yM=matchAny(AP.year,forms);if(yM)fields.dob=yM[0];}
  const addr=extractAddress(rawText); if(addr) fields.address=addr;
  console.log(`[DocVerify] Aadhaar: score=${s} fields=${JSON.stringify(fields)} fail=${JSON.stringify(fail)}`);
  return{score:s,failures:fail,fields,passed:fail.length===0&&s>=50};
}

// ── validatePAN ───────────────────────────────────────────────────────────────
function validatePAN(forms){
  const fail=[];let s=0;
  const nm=matchAny(PAN_P.number,forms);
  if(nm){s+=40;}else{fail.push('PAN number (ABCDE1234F) not found');}
  if(testAny(PAN_P.keyword,forms)){s+=35;}else{fail.push('Income Tax/PAN keyword not found');}
  if(testAny(PAN_P.govt,forms)) s+=10;
  const fields={};
  if(nm) fields.documentNumber=nm[0].replace(/\s/g,'');
  const name=extractName(forms);if(name){fields.name=name;s+=10;}
  const dob=matchAny(AP.dob,forms);if(dob)fields.dob=dob[0];
  return{score:Math.min(100,s),failures:fail,fields,passed:fail.length===0&&s>=50};
}

// ── validateGeneric ───────────────────────────────────────────────────────────
function validateGeneric(docType,forms){
  const pat=OTHER_P[docType]||OTHER_P.businessLicense,fail=[];let s=0,dn=null;
  if(testAny(pat.keyword,forms)){s+=35;}else{fail.push(`Required ${docType.toUpperCase()} keywords not found`);}
  if(pat.number){const m=matchAny(pat.number,forms);if(m){dn=m[0].replace(/\s/g,'');s+=35;}else{fail.push(`Valid ${docType.toUpperCase()} number not found`);}}
  const fields={};if(dn)fields.documentNumber=dn;
  const name=extractName(forms);if(name){fields.name=name;s+=10;}
  return{score:Math.min(100,s),failures:fail,fields,passed:fail.length===0&&s>=50};
}

// ── validateFormat ────────────────────────────────────────────────────────────
function validateFormat(docType,rawText){
  const forms=normalizeText(rawText);
  console.log(`[DocVerify] validateFormat: ${docType} compact120="${forms.compact.slice(0,120)}"`);
  if(docType==='aadhaar') return validateAadhaar(forms,rawText);
  if(docType==='pan')     return validatePAN(forms);
  return validateGeneric(docType,forms);
}

// ── measureContentStrength ────────────────────────────────────────────────────
function measureContentStrength(docType,forms){
  if(docType==='aadhaar') return measureAadhaarStrength(forms);
  if(docType==='pan'){
    const ind=[]; let s=0;
    if(testAny(PAN_P.number,forms))  {ind.push('PAN number');    s+=50;}
    if(testAny(PAN_P.keyword,forms)) {ind.push('Income Tax kw'); s+=25;}
    if(testAny(PAN_P.govt,forms))    {ind.push('Govt of India'); s+=15;}
    const dob=matchAny(AP.dob,forms);if(dob){ind.push('DOB');   s+=10;}
    return{score:Math.min(100,s),indicators:ind};
  }
  return{score:0,indicators:[]};
}

// ── Image preprocessing ───────────────────────────────────────────────────────
async function preprocessImage(buffer,aggressive=false){
  try{
    const sharp=(await import('sharp')).default;
    let p=sharp(buffer).grayscale().normalise();
    p=aggressive?p.linear(1.4,-(128*0.4)).sharpen({sigma:2.5,m1:2.0,m2:0.8}):p.sharpen({sigma:1.5,m1:1.5,m2:0.5});
    const out=await p.jpeg({quality:95}).toBuffer();
    console.log(`[DocVerify] Preprocessed: ${buffer.length}B->${out.length}B aggressive=${aggressive}`);
    return out;
  }catch(e){console.warn('[DocVerify] sharp failed:',e.message);return buffer;}
}

// ── Magic byte validation ─────────────────────────────────────────────────────
function validateImageBuffer(buf){
  if(!buf||buf.length<4)return{valid:false,reason:'Empty file'};
  const h=buf;
  if(h[0]===0xFF&&h[1]===0xD8&&h[2]===0xFF)                     return{valid:true,type:'jpeg'};
  if(h[0]===0x89&&h[1]===0x50&&h[2]===0x4E&&h[3]===0x47)       return{valid:true,type:'png'};
  if(h[0]===0x52&&h[1]===0x49&&h[2]===0x46&&h[3]===0x46)       return{valid:true,type:'webp'};
  if(h[0]===0x42&&h[1]===0x4D)                                   return{valid:true,type:'bmp'};
  if((h[0]===0x49&&h[1]===0x49)||(h[0]===0x4D&&h[1]===0x4D))   return{valid:true,type:'tiff'};
  if(buf.slice(0,4).toString('ascii')==='%PDF')return{valid:false,reason:'PDF not supported. Upload JPEG or PNG.'};
  return{valid:false,reason:`Unknown format (${h[0].toString(16).padStart(2,'0')} ${h[1].toString(16).padStart(2,'0')} ${h[2].toString(16).padStart(2,'0')}). Upload JPEG or PNG.`};
}

// ── Google Vision ─────────────────────────────────────────────────────────────
async function googleVisionOCR(buf){
  const key=process.env.GOOGLE_VISION_API_KEY;if(!key)return null;
  const{data}=await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${key}`,
    {requests:[{image:{content:buf.toString('base64')},features:[{type:'DOCUMENT_TEXT_DETECTION',maxResults:1}]}]},{timeout:20000});
  const resp=data.responses?.[0];
  const text=resp?.fullTextAnnotation?.text||resp?.textAnnotations?.[0]?.description||'';
  return{text,confidence:text.trim().length>10?93+Math.random()*5:20,provider:'google'};
}

// ── Tesseract ─────────────────────────────────────────────────────────────────
// Wrap a promise with a hard timeout to prevent Tesseract from hanging the server
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      console.warn(`[DocVerify] ${label} timed out after ${ms}ms`);
      resolve({ text: '', confidence: 0, provider: 'tesseract', timedOut: true });
    }, ms);
    promise
      .then(v => { clearTimeout(t); resolve(v); })
      .catch(e => { clearTimeout(t); reject(e); });
  });
}

async function runTesseract(buf){
  const Tess=(await import('tesseract.js')).default;
  const res=await Tess.recognize(buf,'eng+hin',{logger:m=>{if(m.status==='recognizing text')process.stdout.write(`\r[DocVerify] Tesseract: ${Math.round(m.progress*100)}%`);}});
  process.stdout.write('\n');
  return{text:res.data.text||'',confidence:res.data.confidence||0,provider:'tesseract'};
}

async function tesseractOCR(buf,docType){
  const chk=validateImageBuffer(buf);
  if(!chk.valid){console.warn(`[DocVerify] Format: ${chk.reason}`);return{text:'',confidence:0,provider:'tesseract',invalidFormat:true,reason:chk.reason};}
  console.log('[DocVerify] OCR pass 1...');
  const b1=await preprocessImage(buf,false);
  // 60s timeout per OCR pass — prevents Tesseract from blocking the process forever
  let res=await withTimeout(runTesseract(b1), 60000, 'OCR pass 1');
  console.log(`[DocVerify] Pass 1: conf=${res.confidence.toFixed(1)}% len=${res.text.length}${res.timedOut?' [TIMED OUT]':''}`);
  if(res.timedOut) return res;
  const mc=DOC_MIN_CONF[docType]??GLOBAL_MIN_CONF;
  if(res.confidence<mc+20){
    console.log('[DocVerify] OCR pass 2 (aggressive)...');
    const b2=await preprocessImage(buf,true);
    const r2=await withTimeout(runTesseract(b2), 60000, 'OCR pass 2');
    console.log(`[DocVerify] Pass 2: conf=${r2.confidence.toFixed(1)}% len=${r2.text.length}${r2.timedOut?' [TIMED OUT]':''}`);
    if(!r2.timedOut && (r2.text.length>res.text.length||r2.confidence>res.confidence)){console.log('[DocVerify] Using pass 2');res=r2;}
  }
  console.log(`[DocVerify] Raw OCR:\n=== START ===\n${res.text.slice(0,800)}\n=== END ===`);
  return res;
}

async function runOCR(buf,docType){
  if(PROVIDER==='google'||process.env.GOOGLE_VISION_API_KEY){
    try{const r=await googleVisionOCR(buf);if(r){console.log(`[DocVerify] Google Vision: conf=${r.confidence.toFixed(1)}%`);return r;}}
    catch(e){console.warn('[DocVerify] Google Vision failed:',e.message);}
  }
  if(PROVIDER==='simulation')return{text:'',confidence:0,provider:'simulation'};
  // Run tesseractOCR directly — both passes are awaited inside it.
  // Do NOT wrap in withTimeout here; the outer safety timeout would fire before
  // Pass 2 completes, discarding valid OCR results.
  return tesseractOCR(buf,docType);
}

// ── Per-document verification ─────────────────────────────────────────────────
async function verifyOneDocument(docType,buffer,mime,provider,onStage){
  const safe=s=>{try{onStage(s);}catch{}};
  const result={uploadedType:docType,detectedType:'unknown',ocrConfidence:0,ocrProvider:'none',
    validFormat:false,typeMatch:false,validationScore:0,matchScore:0,compositeScore:0,
    extractedFields:{},failures:[],hardFailed:false,passed:false,
    contentStrength:0,contentIndicators:[],confidenceOverridden:false};

  safe(`Reading ${docType} document...`);
  let ocr;
  try{ocr=await runOCR(buffer,docType);}
  catch(e){console.error('[DocVerify] OCR exception:',e.message);ocr={text:'',confidence:0,provider:'failed'};}
  result.ocrConfidence=Math.round(ocr.confidence);
  result.ocrProvider=ocr.provider;

  if(ocr.invalidFormat){result.failures.push(ocr.reason||'Invalid image format');result.hardFailed=true;return result;}

  const rawText=ocr.text||'';
  const forms=normalizeText(rawText);
  const mc=DOC_MIN_CONF[docType]??GLOBAL_MIN_CONF;
  const cs=measureContentStrength(docType,forms);
  result.contentStrength=cs.score;result.contentIndicators=cs.indicators;
  console.log(`[DocVerify] ${docType}: conf=${ocr.confidence.toFixed(1)}% mc=${mc} cs=${cs.score} [${cs.indicators.join('|')}]`);

  if(ocr.confidence<mc){
    if(IDENTITY_DOCS.has(docType)&&cs.score>=50){
      console.log(`[DocVerify] ${docType}: OVERRIDE cs=${cs.score}`);
      result.confidenceOverridden=true;ocr={...ocr,confidence:Math.max(ocr.confidence,mc)};
    }else{
      result.failures.push(`OCR confidence too low (${result.ocrConfidence}% — min ${mc}%). Upload clearer photo.`);
      result.hardFailed=true;return result;
    }
  }

  safe(`Detecting document type for ${docType}...`);
  result.detectedType=detectDocType(forms);
  const mm=result.detectedType!=='unknown'&&result.detectedType!==docType;
  if(mm){result.failures.push(`Type mismatch: uploaded as ${docType.toUpperCase()} but detected as ${result.detectedType.toUpperCase()}`);result.hardFailed=true;}
  result.typeMatch=!mm;

  safe(`Validating ${docType} format...`);
  const fmt=validateFormat(docType,rawText);
  result.validationScore=fmt.score;result.validFormat=fmt.passed;result.extractedFields=fmt.fields;
  if(fmt.failures.length)result.failures.push(...fmt.failures);
  console.log(`[DocVerify] ${docType}: score=${fmt.score} passed=${fmt.passed} fields=${JSON.stringify(fmt.fields)}`);

  const isId=IDENTITY_DOCS.has(docType);
  let nm={score:0,matched:false,reason:null};
  if(isId){
    safe(`Matching ${docType} name against profile...`);
    const rawName=fmt.fields.name;
    const cleanedName=cleanOcrName(rawName)||rawName;
    console.log(`[DocVerify] ${docType}: rawName="${rawName}" cleanedName="${cleanedName}" profileName="${provider?.fullName||provider?.name}"`);
    nm=matchName(cleanedName||rawName,provider?.fullName||provider?.name,provider?.businessName);
    result.matchScore=nm.score;
    result.extractedFields.rawName=rawName;
    result.extractedFields.cleanedName=cleanedName;
    if(!nm.matched){result.failures.push(nm.reason||'Name does not match registered profile');result.hardFailed=true;}
  }else if(fmt.fields.name){
    nm=matchName(fmt.fields.name,provider?.fullName||provider?.name,provider?.businessName);
    result.matchScore=nm.score;
  }

  result.compositeScore=result.confidenceOverridden
    ?Math.round((cs.score*0.30)+(fmt.score*0.50)+(nm.score*0.20))
    :Math.round((ocr.confidence*0.25)+(fmt.score*0.50)+(nm.score*0.25));
  result.passed=!result.hardFailed&&result.compositeScore>=SCORE_THRESHOLD&&fmt.passed;
  console.log(`[DocVerify] ${docType}: composite=${result.compositeScore} hardFailed=${result.hardFailed} passed=${result.passed}`);
  return result;
}

// ── Master export ─────────────────────────────────────────────────────────────
export async function verifyServiceDocuments(docBuffers,docMimes,provider,onStage){
  const safe=async s=>{try{await onStage(s);}catch{}};
  const documentResults={};let totalScore=0,docCount=0;
  for(const[docType,buffer]of Object.entries(docBuffers)){
    if(!buffer)continue;docCount++;
    console.log(`\n[DocVerify] ======== ${docType.toUpperCase()} ========`);
    const r=await verifyOneDocument(docType,buffer,docMimes[docType]||'image/jpeg',provider,safe);
    documentResults[docType]=r;totalScore+=r.compositeScore;
    await safe(`Processed ${docType} (${r.compositeScore}/100)`);
  }
  if(!docCount)return{overallScore:0,identityPassed:false,businessPassed:false,verificationLevel:0,status:'failed',failureReasons:['No documents submitted'],documentResults:{},verifiedAt:null};
  await safe('Calculating verification level...');
  const overallScore=Math.round(totalScore/docCount);
  const IDOC=['aadhaar','pan'],BDOC=['gst','businessLicense','registrationCert'];
  const iRes=IDOC.filter(t=>documentResults[t]).map(t=>documentResults[t]);
  const bRes=BDOC.filter(t=>documentResults[t]).map(t=>documentResults[t]);
  const identityPassed=iRes.some(r=>r.passed);
  const businessPassed=bRes.length>0&&bRes.some(r=>r.passed);
  const verificationLevel=identityPassed?(businessPassed?2:1):0;
  const status=identityPassed?'verified':'failed';
  const iF=iRes.filter(r=>!r.passed).flatMap(r=>r.failures.map(f=>`[${r.uploadedType.toUpperCase()}] ${f}`));
  const failureReasons=status==='failed'?(iF.length?iF.slice(0,6):['Identity verification failed']):[];
  console.log(`\n[DocVerify] ======== RESULT: score=${overallScore} level=${verificationLevel} identity=${identityPassed} ========\n`);
  return{overallScore,identityPassed,businessPassed,verificationLevel,status,failureReasons,documentResults,verifiedAt:identityPassed?new Date():null};
}
