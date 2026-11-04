/* Lospec 全量下载：blob API by sha，并发 5 + 节流，带重试 */
(async () => {
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const tree = JSON.parse(fs.readFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/scratch/dl/lospec-tree.json', 'utf8'));
const items = tree.tree.filter(x => x.type === 'blob' && /^palettes\/[^/]+\/[^/]+\.json$/.test(x.path));
const OUT = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/scratch/dl/lospec-palettes';
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchBlob(sha) {
  for (let a = 1; a <= 4; a++) {
    const res = await fetch(`https://api.github.com/repos/gagath/lospec-palette-scrapper/git/blobs/${sha}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'cc' },
    });
    if (res.status === 200) return await res.json();
    if (res.status === 403 || res.status === 429 || res.status >= 500) await sleep(15000 * a);
    else return null;
  }
  return null;
}

let done = 0, fail = 0;
const queue = items.map(x => ({ path: x.path, sha: x.sha }));
async function worker() {
  while (queue.length) {
    const it = queue.shift();
    const slug = it.path.split('/')[1];
    const dest = path.join(OUT, slug + '.json');
    if (fs.existsSync(dest)) { done++; continue; }
    const blob = await fetchBlob(it.sha);
    if (!blob) { fail++; console.log('FAIL', slug); continue; }
    fs.writeFileSync(dest, Buffer.from(blob.content, 'base64'));
    done++;
    if (done % 100 === 0) console.log(`${done}/${items.length}`);
    await sleep(120);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
console.log(`DONE ${done}/${items.length}, fail=${fail}`);

})().catch(e => { console.error(e); process.exit(1); });
