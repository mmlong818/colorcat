/* app.js 增强：多色和谐 + 色名库最近名 + 色卡图 + dropzone 键盘 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 88).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* ---- 色名库最近名（xkcd + ntc，RGB 距离最近） ---- */
R('/* ================= 全局状态 ================= */',
`/* ================= 色名库最近名 ================= */
const COLOR_DB = window.COLOR_NAMES || [];
function nearestDbName(hex){
  const rgb = hexToRgb(hex);
  if (!rgb || !COLOR_DB.length) return null;
  let best = null, bd = Infinity;
  for (const item of COLOR_DB){
    const c = hexToRgb(item.hex);
    const d = Math.pow(rgb[0]-c[0],2)*2 + Math.pow(rgb[1]-c[1],2)*4 + Math.pow(rgb[2]-c[2],2);
    if (d < bd){ bd = d; best = item; }
  }
  if (!best) return null;
  return { name: best.names[0], alt: best.names.slice(1, 3), exact: bd === 0 };
}

/* ================= 全局状态 ================= */`);

/* ---- 色名库接入信息面板（在 hueName 行后追加“色名库最近”行） ---- */
R(`    ['最近色名', hueName(state.gen.h, state.gen.s, state.gen.l)],
  ];`,
`    ['最近色名', hueName(state.gen.h, state.gen.s, state.gen.l)],
  ];
  const dbName = nearestDbName(rgbToHex(...rgb));
  if (dbName) rows.push(['色名库最近', dbName.name + (dbName.exact ? t('names.exactSuffix') : '')]);
  return rows;`);

/* ---- A4 多色和谐渲染（插在 renderPreviewSelect 前） ---- */
R('function renderPreviewSelect(){',
`function renderMh(){
  const bases = ['#mh1', '#mh2', '#mh3']
    .map(s => { const el = $(s); const rgb = el ? hexToRgb(el.value) : null; return rgb ? rgbToHex(...rgb) : null; })
    .filter(Boolean);
  const sch = GEN_SCHEMES.find(s => s.id === $('#mhScheme').value) || GEN_SCHEMES[1];
  if (bases.length < 2){ $('#mhOut').innerHTML = '<p class="text-mini">' + t('mh.need2') + '</p>'; return; }
  const seen = [], rows = [];
  for (const b of bases){
    const [h, s, l] = rgbToHsl(...hexToRgb(b));
    for (const [hh, ss, ll] of sch.sw(norm(h), s, l)){
      const hx = rgbToHex(...hslToRgb(hh, ss, ll));
      if (!seen.includes(hx)){ seen.push(hx); rows.push(hx); }
    }
  }
  $('#mhOut').innerHTML = '<div class="sw-grid">' + rows.map(h => swatchHtml(h)).join('') + '</div>' +
    '<p class="text-mini" style="margin-top:8px">' + t('mh.done', { n: rows.length, bases: bases.join(' / ') }) + '</p>';
}
function renderPreviewSelect(){`);

/* ---- mh 渲染触发（绑在 gen init 与 select change） ---- */
R("  selectGenScheme(state.gen.wheelScheme);\n  setGenBase(state.gen.h, state.gen.s, state.gen.l, true);",
"  selectGenScheme(state.gen.wheelScheme);\n  setGenBase(state.gen.h, state.gen.s, state.gen.l, true);\n  $('#mhScheme').innerHTML = GEN_SCHEMES.map(s => `<option value=\"${s.id}\">${t('scheme.' + s.id + '.n')}</option>`).join('');\n  renderMh();");
R("  $('#genInfoRows').addEventListener('click', async e => {",
`  $('#mhScheme').addEventListener('change', renderMh);
  ['#mh1', '#mh2', '#mh3'].forEach(id => $('#' + id).addEventListener('input', renderMh));
  $('#btnMh').addEventListener('click', renderMh);
  $('#genInfoRows').addEventListener('click', async e => {`);

/* ---- A5 色卡图：通用色板 PNG（插在 exportJSON 前） ---- */
fs.writeFileSync(p, t);
console.log();