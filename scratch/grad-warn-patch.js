const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
const start = t.indexOf('  const warns = [];');
const endMarker = "  $('#gcOut').innerHTML = `";
const end = t.indexOf(endMarker, start);
if (start < 0 || end < 0) { console.log('MARKERS NOT FOUND', start, end); process.exit(1); }
const rep = `  // 警告由引擎结构化 issues 生成（可本地化），与 check_gradient MCP 工具共享同一套检测
  const chk = checkGradient(anchors);
  const warns = (chk.issues || []).map(it =>
    it.type === 'band' ? t('gc.band')
    : it.type === 'cvdSimilar' ? t('gc.cvdSim', { cn: t('cvd.' + it.mode), a: it.seg[0], b: it.seg[1], de: it.de })
    : t('gc.cvdEnds', { cn: t('cvd.' + it.mode) }));
`;
t = t.slice(0, start) + rep + t.slice(end);
fs.writeFileSync(p, t);
console.log('gradient warnings localized');
