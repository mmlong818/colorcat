const { execSync } = require('child_process');
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const call = (path, method = 'GET', body) => {
  const r = execSync(`curl -fsS -X ${method} -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" -H "User-Agent: cc" -H "Content-Type: application/json" ${body ? `-d '${body.replace(/'/g, "'\\''")}'` : ''} https://api.github.com${path}`, { encoding: 'utf8', maxBuffer: 1e8 });
  return r ? JSON.parse(r) : null;
};
/* 仓库验证 */
const repo = call('/repos/mmlong818/colorcat');
console.log('repo:', repo.full_name, '|', repo.visibility, '| branch:', repo.default_branch, '| size:', repo.size + 'KB');
const tree = call('/repos/mmlong818/colorcat/git/trees/main?recursive=1');
console.log('远程文件数:', tree.tree.length, '| 顶层:', [...new Set(tree.tree.filter(x => x.type === 'tree' || !x.path.includes('/')).map(x => x.path.split('/')[0]))].join(', '));
/* 开 Pages（/color-hub 子目录） */
try {
  const pages = call('/repos/mmlong818/colorcat/pages', 'POST', JSON.stringify({
    source: { branch: 'main', path: '/color-hub' },
  }));
  console.log('Pages:', pages.html_url || 'enabled');
} catch (e) {
  console.log('Pages enable failed:', String(e).slice(0, 120));
  try {
    const p = call('/repos/mmlong818/colorcat/pages');
    console.log('Pages status:', p.status, p.html_url);
  } catch (e2) { console.log('Pages not available'); }
}
