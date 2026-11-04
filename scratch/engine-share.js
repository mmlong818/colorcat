/* 工程债 A：hub 引擎单一来源化
 * 1) 生成 color-hub/engine.js（去 ESM export，挂 window.ColorEngine）
 * 2) app.js 删除重复定义，改从 window.ColorEngine 解构
 * 顺带修复：checkGradient / wcagVerdicts 在 hub 缺定义的运行时炸弹 */
const fs = require('fs');

/* ---- 1. 生成 hub/engine.js ---- */
const src = fs.readFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/engine.js', 'utf8');
const names = [];
let m;
const re = /^export\s+(?:function|const|class|let|var)\s+(\w+)/gm;
while ((m = re.exec(src))) names.push(m[1]);
const body = src.replace(/^export\s+(?=(class|const|function|let|var))/gm, '');
const hubEngine =
  `/* engine.js — 由 colorcat-mcp/engine.js 单一来源构建（scratch/transform.js 管线同步）
 * 勿手改：改引擎请改 colorcat-mcp/engine.js 后重新运行 node scratch/transform.js */\n` +
  body +
  `\nwindow.ColorEngine = { ${names.join(', ')} };\n`;
fs.writeFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/engine.js', hubEngine);
console.log('hub/engine.js written, exports:', names.length, '=>', names.join(','));

/* ---- 2. app.js 删除重复定义 ---- */
const appP = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(appP, 'utf8');
const lines = t.split('\n');

const REMOVE = ['norm','hslToRgb','rgbToHex','hexToRgb','rgbToHsl','rgbToHsv','rgbToCmyk','rgbToLab','lin','gam','lum',
  'srgbToOklab','oklabToSrgbLinear','srgbToOklch','oklchInGamut','oklchToHex','oklabToHex','oklabGradientHex',
  'solveContrastStep','contrast','inkOn','lerpHex','CVD_MATRIX','simulate','hueName',
  'SCALE_ROLES','genScale','genContrastScale'];

function findBlock(lines, name) {
  for (let i = 0; i < lines.length; i++) {
    const re = new RegExp('^(?:function|const|let)\\s+' + name + '\\b');
    if (!re.test(lines[i])) continue;
    // 从该行开始，花括号计数到闭合
    let depth = 0, opened = false, j = i;
    for (; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{' || ch === '[') { depth++; opened = true; }
        else if (ch === '}' || ch === ']') { depth--; }
      }
      if (opened && depth <= 0) break;
      if (!opened && /;\s*$/.test(lines[j])) break;   // 单行箭头
    }
    return { start: i, end: j };
  }
  return null;
}

const removed = [];
for (const name of REMOVE) {
  const blk = findBlock(lines, name);
  if (!blk) { console.log('  (skip, not found as top-level:', name + ')'); continue; }
  // 吞掉紧随的空行
  let end = blk.end;
  while (lines[end + 1] !== undefined && lines[end + 1].trim() === '') end++;
  lines.splice(blk.start, end - blk.start + 1);
  removed.push(name);
}
console.log('removed from app.js:', removed.join(','));
t = lines.join(String.fromCharCode(10));

/* ---- 3. 解构注入（放在 $/$$ 定义之后） ---- */
const anchor = "const $$ = s => [...document.querySelectorAll(s)];";
if (!t.includes(anchor)) { console.log('ANCHOR($$) missing'); process.exit(1); }
const want = ['norm','hslToRgb','rgbToHex','hexToRgb','rgbToHsl','rgbToHsv','rgbToCmyk','rgbToLab','lin','gam','lum',
  'srgbToOklab','oklabToSrgbLinear','srgbToOklch','oklchInGamut','oklchToHex','oklabToHex','oklabGradientHex',
  'solveContrastStep','contrast','inkOn','lerpHex','CVD_MATRIX','simulate','hueName','parseColor',
  'wcagVerdicts','checkGradient','SCALE_ROLES','genScale','genContrastScale'];
t = t.replace(anchor, anchor + `\nconst { ${want.join(', ')} } = window.ColorEngine;`);

fs.writeFileSync(appP, t.split('\n').join('\n'));
console.log('app.js updated; removed', removed.length, 'duplicate blocks');
