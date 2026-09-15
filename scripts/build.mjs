import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const raw = process.env.BASE_PATH || '/';
const base = '/' + raw.split('/').filter(Boolean).join('/') + (raw.split('/').filter(Boolean).length ? '/' : '');
if (!/^\/(?:[a-zA-Z0-9._-]+\/)*$/.test(base)) throw new Error('Invalid BASE_PATH');
const out = path.join(root, 'dist');
await fs.rm(out, {recursive:true, force:true});
await fs.mkdir(out, {recursive:true});
const assets = /(["'`(=\s])\/(?!\/)(?=(?:_nuxt|brand|content|sanity|webfonts)(?:\/|["'])|(?:local\.js|favicon\.png|_payload\.json))/g;
async function copy(dir, target) {
  await fs.mkdir(target,{recursive:true});
  for (const item of await fs.readdir(dir,{withFileTypes:true})) {
    const src=path.join(dir,item.name), dst=path.join(target,item.name);
    if(item.isDirectory()) { await copy(src,dst); continue; }
    if(/\.(html|css|js|json|svg)$/.test(item.name)) {
      let text=await fs.readFile(src,'utf8');
      if(base!=='/') {
        text=text.replace(assets,(_,lead)=>lead+base);
        // Nuxt joins baseURL and buildAssetsDir itself.
        text=text.replace(/buildAssetsDir:"[^"]*"/g,'buildAssetsDir:"/_nuxt/"');
        text=text.replace(/baseURL:"\/"/g,`baseURL:${JSON.stringify(base)}`);
        text=text.replace(/href="\/(#?[^"]*)"/g,(match,tail)=>tail===''||tail.startsWith('#')?`href="${base}${tail}"`:match);
      }
      if(item.name==='local.js') {
        text=text.replace("href === '/'",`href === ${JSON.stringify(base)}`);
        text=text.replace("'https://xiiid.ai' + url.pathname",`'https://xiiid.ai' + (url.pathname.startsWith(${JSON.stringify(base)}) ? '/' + url.pathname.slice(${base.length}) : url.pathname)`);
      }
      await fs.writeFile(dst,text);
    } else await fs.copyFile(src,dst);
  }
}
await copy(path.join(root,'site'),out);
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built dist for ${base}`);
