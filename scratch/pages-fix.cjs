/* 设默认分支为 main + 开启 Pages */
const { execSync } = require('child_process');
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const call = (path, method = 'GET', body) => {
  let cmd = `curl -fsS -X ${method} -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" -H "User-Agent: cc" -H "Content-Type: application/json"`;
  if (body) cmd += ` -d '${body.replace(/'/g, `'\\''`)}'`;
  cmd += ` https://api.github.com${path}`;
  return JSON.parse(execSync(cmd, { encoding: 'utf8', maxBuffer: 1e8 }));
};
/* 1. 默认分支 → main */
const repo = call('/repos/mmlong818/colorcat', 'PATCH', JSON.stringify({ default_branch: 'main' }));
console.log('default_branch:', repo.default_branch);
/* 2. Pages */
try {
  const pages = call('/repos/mmlong818/colorcat/pages', 'POST', JSON.stringify({
    build_type: 'legacy',
    source: { branch: 'main', path: '/color-hub' },
  }));
  console.log('Pages enabled:', pages.html_url);
} catch (e) {
  const msg = String(e);
  if (msg.includes('422')) console.log('Pages 已存在或参数问题:', msg.slice(0, 160));
  else console.log('Pages failed:', msg.slice(0, 160));
  try { const p = call('/repos/mmlong818/colorcat/pages'); console.log('Pages status:', p.status, p.html_url); } catch (e2) {}
}
