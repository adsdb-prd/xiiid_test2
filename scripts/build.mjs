import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
// GitHub Pages may deploy at / or /repository-name/.
const segments = (process.env.BASE_PATH || '/').split('/').filter(Boolean);
const base = '/' + (segments.length ? segments.join('/') + '/' : '');
if (!/^\/(?:[a-zA-Z0-9._-]+\/)*$/.test(base)) throw new Error('Invalid BASE_PATH');
// dist is generated output; source files in site are never modified here.
const out = path.join(root, 'dist');
await fs.rm(out, {
  recursive: true,
  force: true
});
await fs.mkdir(out, {
  recursive: true
});
// Rewrite only the local asset folders that exist in this static site.
const assets = /(["'`(=\s])\/(?!\/)(?=(?:brand|content)\/)/g;
async function copy(dir, target) {
  await fs.mkdir(target, {
    recursive: true
  });
  for (const item of await fs.readdir(dir, {
    withFileTypes: true
  })) {
    const src = path.join(dir, item.name),
      dst = path.join(target, item.name);
    if (item.isDirectory()) {
      await copy(src, dst);
      continue;
    }
    if (/\.(html|css|js|json|svg)$/.test(item.name)) {
      let text = await fs.readFile(src, 'utf8');
      if (base !== '/') {
        text = text.replace(assets, (_, lead) => lead + base);
        text = text.replace(/href="\/(#?[^"]*)"/g, (match, tail) => tail === '' || tail.startsWith('#') ? `href="${base}${tail}"` : match);
      }
      await fs.writeFile(dst, text);
    } else await fs.copyFile(src, dst);
  }
}
await copy(path.join(root, 'site'), out);
await fs.writeFile(path.join(out, '.nojekyll'), '');
console.log(`Built dist for ${base}`);
