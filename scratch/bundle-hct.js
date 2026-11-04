/* 把 mcu 的 HCT/CAM16/TonalPalette 打包为两份产物：
 * color-hub/hct.js     → 浏览器 classic script，挂 window.MCU
 * colorcat-mcp/hct.js  → ESM，export default MCU
 * 机械转换，勿手改产物 */
const fs = require('fs');
const path = require('path');
const SRC = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/scratch/dl/mcu-pkg/package';

const ORDER = [
  'utils/math_utils.js',
  'utils/string_utils.js',
  'utils/color_utils.js',
  'hct/viewing_conditions.js',
  'hct/cam16.js',
  'hct/hct_solver.js',
  'hct/hct.js',
  'palettes/tonal_palette.js',
  'palettes/core_palette.js',
];
const NS_ALIASES = {
  'utils/math_utils.js': ['math', 'mathUtils'],
  'utils/color_utils.js': ['utils', 'colorUtils'],
  'utils/string_utils.js': ['stringUtils'],
};

function strip(src) {
  return src
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+(?=(class|const|function|let|var))/gm, '');
}
function exportedNames(src) {
  const names = [];
  let m;
  const re = /^export\s+(?:function|const|class|let|var)\s+(\w+)/gm;
  while ((m = re.exec(src))) names.push(m[1]);
  return names;
}

let body = '';
for (const rel of ORDER) {
  const src = fs.readFileSync(path.join(SRC, rel), 'utf8');
  body += `\n/* ===== ${rel} ===== */\n` + strip(src) + '\n';
  for (const alias of NS_ALIASES[rel] || []) {
    body += `const ${alias} = { ${exportedNames(src).join(', ')} };\n`;
  }
}

const HEAD = `/* HCT/CAM16/TonalPalette — 打包自 Google material-color-utilities (Apache-2.0)
 * 由 scratch/bundle-hct.js 机械生成；勿手改 */
(function(global){
'use strict';
`;
const BROWSER_TAIL = `
global.MCU = { Hct, HctSolver, Cam16, ViewingConditions, TonalPalette, CorePalette, argbFromHex, hexFromArgb, argbFromRgb };
})(typeof window !== 'undefined' ? window : globalThis);
`;
const ESM_TAIL = `
global.MCU = { Hct, HctSolver, Cam16, ViewingConditions, TonalPalette, CorePalette, argbFromHex, hexFromArgb, argbFromRgb };
})(global);
export default global.MCU;
`;

fs.writeFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/hct.js', HEAD + body + BROWSER_TAIL);
fs.writeFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/hct.js', HEAD + body + ESM_TAIL);
console.log('bundles written');
