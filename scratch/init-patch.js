/* 给 upload-v2.mjs 加空仓库初始化步骤 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/scratch/upload-v2.mjs';
let t = fs.readFileSync(p, 'utf8');
const anchor = "const files = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\\n').filter(Boolean);";
if (!t.includes(anchor)) { console.log('anchor missing'); process.exit(1); }
const ins = [
  "/* 0. 空仓库初始化：contents API 建首个文件（自动产生初始 commit + main 分支） */",
  "{",
  "  const content = readFileSync('README.md').toString('base64');",
  "  const { status, data } = await call(`/repos/${REPO}/contents/README.md`, 'PUT', {",
  "    message: 'init: README', content,",
  "  });",
  "  console.log('init contents:', status, data && data.commit ? data.commit.sha.slice(0, 10) : JSON.stringify(data).slice(0, 120));",
  "}",
  "",
].join('\n');
t = t.replace(anchor, ins + anchor);
fs.writeFileSync(p, t);
console.log('patched');
