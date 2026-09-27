import http from 'node:http';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.env.PORT || 4200);
const host = process.env.HOST || '0.0.0.0';
const token = String(process.env.VIDEO_STUDIO_WORKER_TOKEN || '').trim();
const root = process.cwd();
const jobs = new Map();

if (!token) throw new Error('VIDEO_STUDIO_WORKER_TOKEN is required');

const json = (res, status, body) => {
  const content = JSON.stringify(body);
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(content),'cache-control':'no-store'});
  res.end(content);
};
const authorized = (req) => req.headers.authorization === `Bearer ${token}`;
const inside = (parent, child) => {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};
const resolveTarget = (kind, requested) => {
  if (!['project','batch'].includes(kind)) throw new Error('kind must be project or batch');
  if (typeof requested !== 'string' || !requested.endsWith('.json')) throw new Error('target must be a .json path');
  const target = path.resolve(root, requested);
  const allowed = path.resolve(root, kind === 'project' ? 'projects' : 'batches');
  if (!inside(allowed, target) || !fs.existsSync(target)) throw new Error('target is outside allowed scope or does not exist');
  return target;
};
const readBody = async (req) => {
  let body='';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request body exceeds 1 MB');
  }
  return body ? JSON.parse(body) : {};
};
const start = ({runId,kind,target}) => {
  const script = kind === 'batch' ? 'scripts/render-batch.mjs' : 'scripts/render.mjs';
  const record={jobId:runId,runId,status:'running',kind,target,startedAt:new Date().toISOString()};
  jobs.set(runId,record);
  const child=spawn(process.execPath,[script,target],{cwd:root,stdio:'inherit',shell:false});
  child.on('error',(error)=>jobs.set(runId,{...record,status:'failed',error:error.message,completedAt:new Date().toISOString()}));
  child.on('exit',(code)=>jobs.set(runId,{...record,status:code===0?'success':'failed',exitCode:code,completedAt:new Date().toISOString()}));
  return record;
};

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url || '/','http://localhost');
  if(req.method==='GET' && url.pathname==='/health') return json(res,200,{status:'ok',service:'video-studio-worker',version:1});
  if(!authorized(req)) return json(res,401,{error:'Unauthorized'});
  try {
    if(req.method==='GET' && url.pathname==='/capabilities') return json(res,200,{version:1,engines:['remotion'],jobs:['project','batch'],ffmpeg:true});
    if(req.method==='GET' && url.pathname.startsWith('/jobs/')) {
      const id=decodeURIComponent(url.pathname.slice('/jobs/'.length));
      const job=jobs.get(id);
      return job ? json(res,200,job) : json(res,404,{error:'Job not found'});
    }
    if(req.method==='POST' && url.pathname==='/jobs') {
      const body=await readBody(req);
      const runId=String(body.runId || '').trim();
      if(!runId) throw new Error('runId is required');
      if(jobs.has(runId)) return json(res,200,jobs.get(runId));
      const target=resolveTarget(body.kind,body.target);
      const job=start({runId,kind:body.kind,target:path.relative(root,target).replaceAll(path.sep,'/')});
      return json(res,202,{status:'accepted',jobId:job.jobId,runId:job.runId});
    }
    return json(res,404,{error:'Route not found'});
  } catch(error) {
    return json(res,400,{error:error instanceof Error ? error.message : String(error)});
  }
});

server.listen(port,host,()=>console.log(`Video Studio Worker: http://${host}:${port}`));
