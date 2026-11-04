/* v2: 本地计算 blob sha（git 内容寻址），最小化 API 调用；422 时补传缺失 blob */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const REPO = 'mmlong818/colorcat';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const API = 'https://api.github.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(path, method = 'GET', body) {
  for (let attempt = 1; attempt <= 5; attempt++) {
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
    if (res.status === 429 || res.status === 403 || res.status >= 500) {
      const wait = +(res.headers.get('retry-after') || 0) || 20000 * attempt;
      console.log(`  ${res.status} on ${path.split('?')[0]} — wait ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    return { status: res.status, data: res.status === 204 ? null : await res.json().catch(() => null) };
  }
  throw new Error('retries exhausted: ' + path);
}

/* 0. 空仓库初始化：contents API 建首个文件（自动产生初始 commit + main 分支） */
{
  const content = readFileSync('README.md').toString('base64');
  const { status, data } = await call(`/repos/${REPO}/contents/README.md`, 'PUT', {
    message: 'init: README', content,
  });
  console.log('init contents:', status, data && data.commit ? data.commit.sha.slice(0, 10) : JSON.stringify(data).slice(0, 120));
}
const files = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const entries = files.map(path => {
  const content = readFileSync(path);
  const sha = createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  return { path, sha, content };
});
console.log(`files: ${entries.length}, 本地 blob sha 计算完成`);

const treeItems = entries.map(e => ({ path: e.path, mode: '100644', type: 'blob', sha: e.sha }));

async function buildTree() {
  const { status, data } = await call(`/repos/${REPO}/git/trees`, 'POST', { tree: treeItems });
  if (status === 201) return data;
  console.log('tree status', status, JSON.stringify(data).slice(0, 200));
  return null;
}

let tree = await buildTree();
if (!tree) {
  /* 补传缺失 blob：低并发 + 节流 */
  console.log('补传 blobs（节流模式）…');
  const serverShas = new Set();
  for (const e of entries) {
    const { status, data } = await call(`/repos/${REPO}/git/blobs/${e.sha}`);
    if (status === 200) serverShas.add(e.sha);
    await sleep(150);
  }
  const missing = entries.filter(e => !serverShas.has(e.sha));
  console.log(`缺失 blob: ${missing.length}`);
  for (const e of missing) {
    const { status } = await call(`/repos/${REPO}/git/blobs`, 'POST', {
      content: e.content.toString('base64'), encoding: 'base64',
    });
    if (status !== 201) console.log(`  blob fail ${e.path} ${status}`);
    await sleep(300);
  }
  await sleep(2000);
  tree = await buildTree();
  if (!tree) { console.log('TREE STILL FAILING'); process.exit(1); }
}
console.log(`tree: ${tree.sha.slice(0, 10)}`);

/* commit 挂父提交，让远端历史成链（可 review diff） */
const refNow = await call(`/repos/${REPO}/git/refs/heads/main`);
const parents = refNow.status === 200 ? [refNow.data.object.sha] : [];
const { data: commit } = await call(`/repos/${REPO}/git/commits`, 'POST', {
  message: 'docs: rewrite README with verified facts; fix stale counts; HTTP dual-mode transport',
  tree: tree.sha,
  parents,
});
console.log(`commit: ${commit.sha.slice(0, 10)} (parents: ${parents.length})`);

const refRes = await call(`/repos/${REPO}/git/refs/heads/main`);
if (refRes.status === 404) {
  await call(`/repos/${REPO}/git/refs`, 'POST', { ref: 'refs/heads/main', sha: commit.sha });
} else {
  await call(`/repos/${REPO}/git/refs/heads/main`, 'PATCH', { sha: commit.sha, force: true });
}
console.log('UPLOAD OK — main ->', commit.sha.slice(0, 10));
