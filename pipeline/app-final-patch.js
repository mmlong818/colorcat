/* 最终补丁：色名库行 ×2 + 色卡图生成器 + 按钮绑定 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 88).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* ---- 色名库 helper ---- */
R('function applyThemeLabel(){',
`function dbNameLine(h, s, l){
  const dbName = nearestDbName(rgbToHex(...hslToRgb(h, s, l)));
  return dbName ? dbName.name + (dbName.exact ? ' ' + t('names.exactSuffix') : '') : hueName(h, s, l);
}
function applyThemeLabel(){`);

/* ---- gen 面板行 ---- */
R("    ['L*a*b*', `lab(${L}, ${A}, ${B})`], [t('gen.nearest'), hueName(state.gen.h, state.gen.s, state.gen.l)],\n  ];",
"    ['L*a*b*', `lab(${L}, ${A}, ${B})`], [t('gen.nearest'), hueName(state.gen.h, state.gen.s, state.gen.l)],\n    [t('names.db'), dbNameLine(state.gen.h, state.gen.s, state.gen.l)],\n  ];");

/* ---- conv 面板行 ---- */
R("    ['L*a*b* (D65)', `lab(${L}, ${A}, ${B})`], ['最近色名', hueName(h, s, l)],\n  ];",
"    ['L*a*b* (D65)', `lab(${L}, ${A}, ${B})`], [t('names.db'), dbNameLine(h, s, l)], [t('gen.nearest'), hueName(h, s, l)],\n  ];");

/* ---- A5 色卡图：通用色板 PNG（paletteCardPNG，插在 exportJSON 前） ---- */
R('/* =====================================================\n * JSON 导出',
`/* =====================================================
 * 色卡图生成器（任意色板 → 排版 PNG）
 * ===================================================== */
function paletteCardPNG(p){
  let cols = [], title = p.cn, subtitle = '';
  if (p.kind === 'multiscale'){
    const hue = p.scales[Math.min(state.hueIdx, p.scales.length - 1)];
    cols = hue.steps; subtitle = hue.cnName || hue.name;
  } else if (p.kind === 'palette'){
    cols = p.colors.map(c => ({ hex: c.hex, name: c.name }));
  } else if (p.kind === 'brewer'){
    const sch = p.schemes[state.brewerScheme];
    const nums = Object.keys(sch.classes).map(Number).sort((a, b) => a - b);
    cols = (sch.classes[state.brewerClass] || sch.classes[nums[0]]).map((h, i) => ({ hex: h, name: (i + 1) + '' }));
    subtitle = sch.name + ' · ' + (state.brewerClass) + ' classes';
  } else if (p.kind === 'map'){
    cols = p.stops;
  } else if (p.kind === 'set' || p.kind === 'gradset'){
    cols = (p.sets[Math.min(state.setIdx || 0, p.sets.length - 1)] || { colors: [] }).colors
      .map(c => typeof c === 'string' ? c : c.hex);
  }
  cols = cols.map(c => typeof c === 'string' ? { hex: c, name: '' } : c).slice(0, 40);
  if (!cols.length) return;

  const cell = 150, labelH = 34, perRow = 6;
  const rows = Math.ceil(cols.length / perRow);
  const W = 1240, headH = 190, gridH = rows * (cell + labelH) + 40, footH = 70;
  const H = headH + gridH + footH;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#111111'; ctx.font = '600 40px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
  ctx.fillText(title, 64, 100);
  ctx.fillStyle = '#666666'; ctx.font = '20px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
  ctx.fillText(subtitle || p.license, 64, 140);
  ctx.font = '18px -apple-system,"Segoe UI",sans-serif';
  ctx.fillText(p.attribution.slice(0, 90), 64, 172);

  cols.forEach((c, i) => {
    const r = Math.floor(i / perRow), col = i % perRow;
    const x = 64 + col * (cell + 14), y = headH + 20 + r * (cell + labelH + 14);
    const rgb = hexToRgb(c.hex) || [0, 0, 0];
    ctx.fillStyle = c.hex; ctx.fillRect(x, y, cell, cell);
    if (lum(...rgb) > 140){ ctx.fillStyle = 'rgba(0,0,0,.55)'; } else { ctx.fillStyle = 'rgba(255,255,255,.9)'; }
    ctx.font = '600 22px ui-monospace,Consolas,monospace';
    ctx.fillText(c.hex.replace('#', ''), x + 12, y + cell - 40);
    if (c.name){ ctx.font = '16px -apple-system,"Segoe UI",sans-serif'; ctx.fillText(c.name.slice(0, 14), x + 12, y + cell - 14); }
  });

  ctx.fillStyle = '#999999'; ctx.textAlign = 'center';
  ctx.font = '16px -apple-system,"Segoe UI",sans-serif';
  ctx.fillText('ColorCat · 基于开源数据的配色工作台', W / 2, H - 24);
  const a = document.createElement('a');
  a.download = p.id + '-card.png';
  a.href = cv.toDataURL('image/png');
  a.click();
}

/* =====================================================
 * JSON 导出`);

/* ---- 色卡图按钮绑定（renderDetail 内） ---- */
R("  $('#btnBack').addEventListener('click', closeDetail);",
`  $('#btnBack').addEventListener('click', closeDetail);
  $('#btnCardPng')?.addEventListener('click', () => {
    paletteCardPNG(p);
    showToast(t('toast.exported', { file: p.id + '-card.png' }));
  });`);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
