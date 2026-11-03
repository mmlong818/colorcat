const { execSync } = require('child_process');
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const raw = (path, method = 'GET', body) => {
  let cmd = `curl -sS -X ${method} -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" -H "User-Agent: cc" -H "Content-Type: application/json"`;
  if (body) cmd += ` -d '${body.replace(/'/g, `'\\''`)}'`;
  cmd += ` https://api.github.com${path}`;
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 1e8 });
};
const repo = JSON.parse(raw('/repos/mmlong818/colorcat'));
console.log('created_at:', repo.created_at, '| updated_at:', repo.updated_at);
console.log('default_branch:', repo.default_branch, '| private:', repo.private, '| owner:', repo.owner.login);
/* 分支列表 */
const branches = JSON.parse(raw('/repos/mmlong818/colorcat/branches'));
console.log('branches:', branches.map(b => b.name + '(' + b.commit.sha.slice(0, 7) + ')').join(', '));
/* PATCH default_branch 看完整响应 */
try {
  const out = raw('/repos/mmlong818/colorcat', 'PATCH', '{"default_branch":"main"}');
  console.log('PATCH ok, default_branch =', JSON.parse(out).default_branch);
} catch (e) {
  console.log('PATCH error body:', e.output ? String(e.output[1]) : String(e).slice(0, 300));
}
