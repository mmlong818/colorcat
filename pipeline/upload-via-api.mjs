/* 走 api.github.com 的 Git Data API 上传仓库（绕过被墙的 github.com:443） */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPO = 'mmlong818/colorcat';
const BRANCH = 'main';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const files = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
console.log(`files: ${files.length}`);

const API = 'https://api.github.com';
async function call(path, method = 'GET', body) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(API + path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'colorcat-upload',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return { status: res.status, data: res.status === 204 ? null : await res.json() };
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
}

/* 1. blobs（并发 8） */
const entries = [];
let done = 0;
const queue = [...files];
async function worker() {
  while (queue.length) {
    const path = queue.shift();
    const content = readFileSync(path).toString('base64');
    const { data } = await call(`/repos/${REPO}/git/blobs`, 'POST', { content, encoding: 'base64' });
    entries.push({ path, mode: '100644', type: 'blob', sha: data.sha });
    done++;
    if (done % 50 === 0) console.log(`  blobs ${done}/${files.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`blobs: ${entries.length}`);

/* 2. tree */
const { data: tree } = await call(`/repos/${REPO}/git/trees`, 'POST', { tree: entries });
console.log(`tree: ${tree.sha.slice(0, 10)}`);

/* 3. commit */
const { data: commit } = await call(`/repos/${REPO}/git/commits`, 'POST', {
  message: 'ColorCat: color workbench (125 open-source palettes), MCP server, i18n x5, a11y tools',
  tree: tree.sha,
});
console.log(`commit: ${commit.sha.slice(0, 10)}`);

/* 4. ref（存在则更新） */
const refRes = await call(`/repos/${REPO}/git/refs/heads/${BRANCH}`);
if (refRes.status === 404) {
  await call(`/repos/${REPO}/git/refs`, 'POST', { ref: `refs/heads/${BRANCH}`, sha: commit.sha });
  console.log(`ref created: ${BRANCH}`);
} else {
  await call(`/repos/${REPO}/git/refs/heads/${BRANCH}`, 'PATCH', { sha: commit.sha, force: true });
  console.log(`ref updated: ${BRANCH}`);
}
console.log('UPLOAD OK');
