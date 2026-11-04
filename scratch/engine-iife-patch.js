/* transform.js 引擎同步改为 IIFE 包裹（避免与 app.js 全局词法绑定冲突） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/scratch/transform.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 90).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};
R("const engBody = fs.readFileSync(ENG_SRC, 'utf8').replace(/^export\\s+/gm, '');",
  "let engBody = fs.readFileSync(ENG_SRC, 'utf8').replace(/^export\\s+/gm, '');");
R("const engNames = [...engBody.matchAll(/^(?:function|const|class|let|var)\\s+(\\w+)/gm)].map(m => m[1]);",
  "const engNames = [...engBody.matchAll(/^(?:function|const|class|let|var)\\s+(\\w+)/gm)].map(m => m[1]);\n"
  + "engBody = '(function(){\\n\\'use strict\\';\\n' + engBody + '\\n})();\\n';");
R("  '/* 由 transform.js 从 colorcat-mcp/engine.js 构建；勿手改 */\\n' + engBody +\n  'window.ColorEngine = { ' + engNames.join(', ') + ' };\\n');",
  "  '/* 由 transform.js 从 colorcat-mcp/engine.js 构建（IIFE，避免全局污染）；勿手改 */\\n' + engBody +\n  'window.ColorEngine = { ' + engNames.join(', ') + ' };\\n');");
fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
