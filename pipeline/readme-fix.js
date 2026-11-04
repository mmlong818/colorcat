const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/README.md';
let t = fs.readFileSync(p, 'utf8');
const start = t.indexOf('## MCP 三种部署方式');
const end = t.indexOf('## 数据来源与许可');
if (start < 0 || end < 0) { console.log('markers missing'); process.exit(1); }
const section = [
  '## MCP 三种部署方式',
  '',
  '### A. 本地分发（最简单）',
  '别人 clone 本仓库，进入 colorcat-mcp 执行 npm install，然后在客户端配置指向 server.js 的绝对路径。每人本地跑，数据离线，无需任何服务器。',
  '',
  '### B. npm 分发（生态标准）',
  '维护者执行 npm publish --access public 发布后，别人无需 clone，客户端配置直接写：',
  '',
  '```json',
  '{ "command": "npx", "args": ["-y", "colorcat-mcp"] }',
  '```',
  '',
  '### C. 远程 HTTP（我架设，别人连我）',
  '',
  '```bash',
  'COLORCAT_TOKEN=你的秘密 node server.js --http 3010',
  '```',
  '',
  '- `/mcp` 为 Streamable HTTP 端点；设置了 COLORCAT_TOKEN 后，请求需带 `Authorization: Bearer <token>`',
  '- 客户端配置（支持远程 MCP 的客户端，如 Cursor / ZCode 新版）：',
  '',
  '```json',
  '{',
  '  "colorcat": {',
  '    "type": "http",',
  '    "url": "http://你的主机:3010/mcp",',
  '    "headers": { "Authorization": "Bearer 你的秘密" }',
  '  }',
  '}',
  '```',
  '',
  '- 部署去处：云服务器（pm2 / systemd）、Render / Railway / Fly 免费层、或家庭机器 + 内网穿透（cloudflare tunnel / frp / tailscale）',
  '- 公网暴露务必设置 COLORCAT_TOKEN',
  '',
  '测试：`npm test`（stdio 40 项）+ `node test/http-test.mjs`（HTTP 7 项）。',
  '',
  '',
].join('\n');
t = t.slice(0, start) + section + t.slice(end);
fs.writeFileSync(p, t);
console.log('section rewritten, lines:', t.split('\n').length);
