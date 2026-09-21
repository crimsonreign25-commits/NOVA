import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const COGNITIVE_MEMORY_VERSION = '2.22.0-cognitive-memory-2';
const DATA_DIR = process.env.NOVA_MEMORY_DIR || process.env.NOVA_DATA_DIR || path.join(process.cwd(), '.nova-data');
const FILE = path.join(DATA_DIR, 'cognitive-memory.json');
const MAX_CLAIMS = 5000;
const MAX_EVENTS = 5000;

function ensure() { fs.mkdirSync(DATA_DIR, { recursive: true }); if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({claims:[],events:[],conflicts:[],version:COGNITIVE_MEMORY_VERSION}, null, 2)); }
function read() { ensure(); try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {claims:[],events:[],conflicts:[],version:COGNITIVE_MEMORY_VERSION}; } }
function write(data) { ensure(); const tmp=`${FILE}.tmp`; fs.writeFileSync(tmp, JSON.stringify(data,null,2)); fs.renameSync(tmp,FILE); return data; }
function id(prefix='mem') { return `${prefix}_${crypto.randomUUID()}`; }
function norm(v='') { return String(v).trim().toLowerCase().replace(/\s+/g,' '); }
function now() { return new Date().toISOString(); }
function blocked(text='') { return /(?:password|passcode|api[_ -]?key|secret|private key|access token|refresh token|authorization:\s*bearer)/i.test(text); }
function importance(c) { return Math.max(0, Math.min(1, Number(c?.importance ?? 0.5))); }
function authority(c) { return Math.max(0, Math.min(1, Number(c?.provenance?.authority ?? c?.authority ?? 0.5))); }
function claimText(c) { return [c.subject,c.predicate,c.object].filter(Boolean).join(' '); }
function sameSubjectPredicate(a,b) { return norm(a.subject)===norm(b.subject) && norm(a.predicate)===norm(b.predicate) && norm(a.type||'claim')===norm(b.type||'claim'); }
function contradicts(a,b) { if (!sameSubjectPredicate(a,b)) return false; const ao=norm(a.object), bo=norm(b.object); return Boolean(ao && bo && ao!==bo); }
function score(c, query='') { const q=norm(query); const text=norm(`${claimText(c)} ${c.text||''} ${c.tags?.join(' ')||''}`); const tokens=q.split(/\s+/).filter(Boolean); const hits=tokens.filter(t=>text.includes(t)).length; const lexical=tokens.length ? hits/tokens.length : 0; return lexical*.65 + importance(c)*.15 + authority(c)*.15 + (c.verified?.1:0); }

export function cognitiveMemoryPolicy() { return {version:COGNITIVE_MEMORY_VERSION,maxClaims:MAX_CLAIMS,maxEvents:MAX_EVENTS,nonDestructive:true,provenanceRequired:true,credentialStorageBlocked:true,conflictResolution:'deterministic + auditable',consolidation:'approval-aware'}; }
export function cognitiveMemoryStatus() { const d=read(); return {version:COGNITIVE_MEMORY_VERSION,claims:d.claims.length,activeClaims:d.claims.filter(c=>!c.supersededBy&&!c.deletedAt).length,conflicts:d.conflicts.length,events:d.events.length,file:FILE,policy:cognitiveMemoryPolicy()}; }

export function rememberClaim(input={}) {
  const text=String(input.text||'').trim();
  if (!text && !(input.subject&&input.predicate&&input.object)) throw new Error('A memory text or structured claim is required.');
  if (blocked(text) || blocked(JSON.stringify(input.provenance||{}))) throw new Error('NOVA blocked storage of credentials or authentication secrets.');
  const d=read();
  const claim={
    id:id('claim'), type:input.type||'claim', text:text||claimText(input), subject:input.subject||null, predicate:input.predicate||null, object:input.object||null,
    source:input.source||'user', provenance:{kind:input.provenance?.kind||'user-input',source:input.provenance?.source||input.source||'user',authority:authority(input),capturedAt:now(),parentIds:Array.isArray(input.provenance?.parentIds)?input.provenance.parentIds.slice(0,20):[]},
    confidence:Math.max(0,Math.min(1,Number(input.confidence??0.6))), importance:importance(input), verified:Boolean(input.verified), validFrom:input.validFrom||now(), validTo:null, supersededBy:null, createdAt:now(), updatedAt:now(), tags:Array.isArray(input.tags)?input.tags.slice(0,20):[]
  };
  const conflicts=d.claims.filter(x=>!x.deletedAt&&!x.supersededBy&&contradicts(claim,x));
  claim.conflictIds=conflicts.map(x=>x.id);
  d.claims.unshift(claim);
  for(const old of conflicts) { const conflict={id:id('conflict'),createdAt:now(),newClaimId:claim.id,oldClaimId:old.id,status:'open',reason:'same subject/predicate with different object',resolution:null}; d.conflicts.unshift(conflict); }
  d.claims=d.claims.slice(0,MAX_CLAIMS); d.conflicts=d.conflicts.slice(0,MAX_CLAIMS);
  d.events.unshift({id:id('event'),type:'remember',claimId:claim.id,timestamp:now(),details:{conflicts:conflicts.map(x=>x.id)}}); d.events=d.events.slice(0,MAX_EVENTS); write(d);
  return {claim,conflicts};
}

export function searchCognitiveMemory(query='', opts={}) { const d=read(); const limit=Math.min(Math.max(Number(opts.limit)||20,1),100); return d.claims.filter(c=>!c.deletedAt).map(c=>({...c,_score:score(c,query)})).filter(c=>!query||c._score>0).sort((a,b)=>b._score-a._score).slice(0,limit); }
export function getCognitiveClaim(id) { return read().claims.find(c=>c.id===id)||null; }
export function listCognitiveConflicts({status='open',limit=50}={}) { return read().conflicts.filter(c=>!status||c.status===status).slice(0,limit); }
export function resolveCognitiveConflict(id, resolution={}) {
  const d=read(); const conflict=d.conflicts.find(c=>c.id===id); if(!conflict) throw new Error('Conflict not found.');
  const winner=d.claims.find(c=>c.id===resolution.winnerId); const loser=d.claims.find(c=>c.id===resolution.loserId || c.id===(winner?.id===conflict.newClaimId?conflict.oldClaimId:conflict.newClaimId));
  if(!winner||!loser) throw new Error('Both winning and losing claims must exist.');
  loser.supersededBy=winner.id; loser.validTo=now(); conflict.status='resolved'; conflict.resolution={winnerId:winner.id,loserId:loser.id,method:resolution.method||'human-confirmed',at:now()};
  d.events.unshift({id:id('event'),type:'resolve_conflict',timestamp:now(),conflictId:id,details:conflict.resolution}); write(d); return {conflict,winner,loser};
}
export function consolidateCognitiveMemory({minImportance=0.75}={}) {
  const d=read(); const candidates=d.claims.filter(c=>!c.deletedAt&&!c.supersededBy&&importance(c)>=minImportance); const groups=new Map();
  for(const c of candidates){const key=`${norm(c.subject||c.text)}|${norm(c.predicate||c.type)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);}
  const proposals=[];
  for(const [key,items] of groups){if(items.length<2)continue; proposals.push({id:id('proposal'),key,claimIds:items.map(x=>x.id),action:'review-merge',reason:'related high-value claims; consolidation is non-destructive and requires review'});}
  d.events.unshift({id:id('event'),type:'consolidation_scan',timestamp:now(),details:{candidates:candidates.length,proposals:proposals.length}}); d.events=d.events.slice(0,MAX_EVENTS); write(d); return {proposals,candidates:candidates.length};
}
export function cognitiveMemoryContext(query='',limit=8) { return searchCognitiveMemory(query,{limit}).map(c=>({id:c.id,text:c.text,confidence:c.confidence,verified:c.verified,source:c.provenance?.source,authority:c.provenance?.authority,conflictIds:c.conflictIds||[]})); }
export function deleteCognitiveMemory(id) { const d=read(); const c=d.claims.find(x=>x.id===id); if(!c) return {deleted:false}; c.deletedAt=now(); d.events.unshift({id:id('event'),type:'delete',claimId:id,timestamp:now()}); write(d); return {deleted:true}; }
export function cognitiveMemoryData() { const d=read(); return {version:COGNITIVE_MEMORY_VERSION,claims:d.claims.slice(0,100),conflicts:d.conflicts.slice(0,100),events:d.events.slice(0,100)}; }
