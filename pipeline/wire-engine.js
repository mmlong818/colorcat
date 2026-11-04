/* index.html 挂 engine.js + transform.js 管线同步引擎 */
const fs = require('fs');

let t = fs.readFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/index.html', 'utf8');
if (!t.includes('engine.js')) {
  t = t.replace('<script src="palettes.js?v=', '<script src="engine.js?v=20261112"></script>\n<script src="palettes.js?v=');
}
t = t.split('app.js?v=').join('app.js?v=20261113');
t = t.split('engine.js?v=').join('engine.js?v=20261113');
t = t.split('style.css?v=').join('style.css?v=20261113');
t = t.split('i18n.js?v=').join('i18n.js?v=20261113');
t = t.split('palettes.js?v=').join('palettes.js?v=20261113');
fs.writeFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/index.html', t);
console.log('index.html wired, versions → 20261113');

/* transform.js：数据再生成时同步引擎 */
const tp = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/pipeline/transform.js';
let tr = fs.readFileSync(tp, 'utf8');
if (!tr.includes('hub/engine.js')) {
  const anchor = tr.indexOf("console.log(`同步输出: ${MCP_OUT}`);");
  if (anchor < 0) { console.log('anchor missing'); process.exit(1); }
  const lineEnd = tr.indexOf('\n', anchor);
  const add = [
    '',
    "// 同步引擎到网页端（单一来源：colorcat-mcp/engine.js）",
    "const ENG_SRC = path.join(__dirname, '..', 'colorcat-mcp', 'engine.js');",
    "const engBody = fs.readFileSync(ENG_SRC, 'utf8').replace(/^export\\s+/gm, '');",
    "const engNames = [...engBody.matchAll(/^(?:function|const|class|let|var)\\s+(\\w+)/gm)].map(m => m[1]);",
    "fs.writeFileSync(path.join(__dirname, '..', 'color-hub', 'engine.js'),",
    "  '/* 由 transform.js 从 colorcat-mcp/engine.js 构建；勿手改 */\\n' + engBody +",
    "  'window.ColorEngine = { ' + engNames.join(', ') + ' };\\n');",
    "console.log('同步输出: color-hub/engine.js (' + engNames.length + ' 导出)');",
  ].join('\n');
  tr = tr.slice(0, lineEnd) + '\n' + add + tr.slice(lineEnd);
  fs.writeFileSync(tp, tr);
  console.log('transform.js pipeline updated');
}
