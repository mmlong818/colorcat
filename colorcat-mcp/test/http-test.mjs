/* HTTP 模式端到端测试：spawn server --http，StreamableHTTPClientTransport 实连 */
import { spawn, execSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, '..');
const PORT = 3019;
const TOKEN = 'test-token-123';
const URL_BASE = `http://127.0.0.1:${PORT}/mcp`;

/* 启动 HTTP 服务（带鉴权） */
const child = spawn(process.execPath, [join(serverDir, 'server.js'), '--http', String(PORT)], {
  cwd: serverDir,
  env: { ...process.env, COLORCAT_TOKEN: TOKEN },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stderr.on('data', d => process.stderr.write(d));

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond){ pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} — ${detail ?? ''}`); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 等服务就绪 */
for (let i = 0; i < 20; i++){
  try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await sleep(250); }
}

try {
  /* 1. 无 token → 401 */
  const anon = await fetch(URL_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) });
  check('未鉴权返回 401', anon.status === 401, String(anon.status));

  /* 2. 错 token → 401 */
  const wrong = await fetch(URL_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) });
  check('错 token 返回 401', wrong.status === 401, String(wrong.status));

  /* 3. 正确 token 实连 + 调工具 */
  const transport = new StreamableHTTPClientTransport(new URL(URL_BASE), {
    requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
  });
  const client = new Client({ name: 'http-test', version: '0.0.1' });
  await client.connect(transport);
  const tools = await client.listTools();
  check('listTools = 12', tools.tools.length === 12, String(tools.tools.length));
  const r = await client.callTool({ name: 'contrast_check', arguments: { fg: '#FFFFFF', bg: '#2563EB' } });
  const parsed = JSON.parse(r.content[0].text);
  check('contrast_check 5.17', parsed.ratio === 5.17, JSON.stringify(parsed.ratio));
  const r2 = await client.callTool({ name: 'search_palettes', arguments: { query: 'ghibli' } });
  check('search ghibli 命中', JSON.parse(r2.content[0].text).palettes?.some(p => p.id === 'p-ghibli'));
  const r3 = await client.callTool({ name: 'generate_scale', arguments: { base: '#2563EB' } });
  check('generate_scale 主色锚定', JSON.parse(r3.content[0].text).mainColor === '#2563EB');
  await client.close();
  check('会话关闭无残留', true);
} catch (e) {
  check('HTTP 客户端流程', false, String(e).slice(0, 200));
}

child.kill();
console.log(`\n========== HTTP 模式: ${pass} 通过 / ${fail} 失败 ==========`);
process.exit(fail ? 1 : 0);
