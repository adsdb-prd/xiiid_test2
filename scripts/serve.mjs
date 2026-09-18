import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port=Number(process.env.PORT || 4175);
const base='/' + (process.env.BASE_PATH || '/').split('/').filter(Boolean).join('/') + ((process.env.BASE_PATH || '/').split('/').filter(Boolean).length ? '/' : '');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.mp4':'video/mp4','.gif':'image/gif'};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1');
    const requested=decodeURIComponent(url.pathname);
    if(base!=='/' && requested===base.slice(0,-1)) {res.writeHead(301,{Location:base+url.search});res.end();return;}
    if(!requested.startsWith(base)) {res.writeHead(404);res.end('Not found');return;}
    const pathname='/' + requested.slice(base.length);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    const bytes=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(bytes);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${port}${base}`;
  console.log(`XIIID AI Labs local site: ${url}`);
  console.log('Press Ctrl+C to stop.');
  if(process.argv.includes('--open')) spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{stdio:'ignore',windowsHide:true}).unref();
});
