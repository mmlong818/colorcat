/* server.js 重构：buildServer() 工厂 + stdio/HTTP 双模式 + Bearer 鉴权 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/server.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 80).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* 1. import express + StreamableHTTP */
R("import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';",
  "import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\nimport { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';\nimport express from 'express';");

/* 2. 包工厂：const server = ... 前开函数体，工具注册区结束处收口 */
R("const server = new McpServer({ name: 'colorcat', version: '1.0.0' });",
  "export function buildServer(){\nconst server = new McpServer({ name: 'colorcat', version: '1.0.0' });");
R("/* ---------- 启动 ---------- */\nconst transport = new StdioServerTransport();\nawait server.connect(transport);\nconsole.error(`ColorCat 配色猫 MCP 已启动（stdio）· ${PALETTES.length} 组色板内置`);",
`  return server;
}

/* ---------- 启动：stdio（默认）或 --http 端口 ---------- */
function authOk(req){
  const need = process.env.COLORCAT_TOKEN;
  if (!need) return true;   // 未设 token = 不鉴权（仅建议本机/内网）
  return (req.headers.authorization || '') === 'Bearer ' + need;
}

async function startHttp(port){
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.get('/', (req, res) => res.json({
    name: 'colorcat', version: '1.0.0', transport: 'streamable-http',
    endpoint: '/mcp', auth: process.env.COLORCAT_TOKEN ? 'Bearer token required' : 'open',
    tools: 10,
  }));
  app.use('/mcp', (req, res, next) => {
    if (!authOk(req)) return res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'unauthorized: send header Authorization: Bearer <COLORCAT_TOKEN>' } });
    next();
  });
  app.post('/mcp', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      const instance = buildServer();
      res.on('close', () => { transport.close(); instance.close(); });
      await instance.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: String(e && e.message || e) } });
    }
  });
  const notSupported = (req, res) => res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'stateless mode: GET/DELETE not supported' } });
  app.get('/mcp', notSupported);
  app.delete('/mcp', notSupported);
  app.listen(port, () => console.error(\`ColorCat 配色猫 HTTP 已监听 :\${port}/mcp · \${PALETTES.length} 组色板 · \${process.env.COLORCAT_TOKEN ? '鉴权开启' : '无鉴权'}\`));
}

if (process.argv.includes('--http')){
  const port = parseInt(process.argv[process.argv.indexOf('--http') + 1], 10) || 3000;
  startHttp(port);
} else {
  const transport = new StdioServerTransport();
  await buildServer().connect(transport);
  console.error(\`ColorCat 配色猫 MCP 已启动（stdio）· \${PALETTES.length} 组色板内置\`);
}`);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
