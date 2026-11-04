/* 全能配色工作台 · 应用逻辑（原创实现）
 * 色板数据来自 palettes.js（各开源项目官方数据，逐条署名）。 */
'use strict';

/* ================= 颜色数学 ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const { norm, hslToRgb, rgbToHex, hexToRgb, rgbToHsl, rgbToHsv, rgbToCmyk, rgbToLab, lin, gam, lum, srgbToOklab, oklabToSrgbLinear, srgbToOklch, oklchInGamut, oklchToHex, oklabToHex, oklabGradientHex, solveContrastStep, contrast, inkOn, lerpHex, CVD_MATRIX, simulate, hueName, parseColor, wcagVerdicts, checkGradient, SCALE_ROLES, genScale, genContrastScale } = window.ColorEngine;
/* ================= i18n 运行时 ================= */
const I18N = window.I18N, I18N_LOCALES = window.I18N_LOCALES;
function detectLang(){
  try { const s = localStorage.getItem('hub.lang'); if (s && I18N[s]) return s; } catch(e){}
  const n = (navigator.language || 'zh').toLowerCase();
  if (n.startsWith('zh')) return 'zh';
  if (n.startsWith('ja')) return 'ja';
  if (n.startsWith('ru')) return 'ru';
  if (n.startsWith('fr')) return 'fr';
  if (n.startsWith('en')) return 'en';
  return 'zh';
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function t(key, params){
  let s = (I18N[state.lang] && I18N[state.lang][key]);
  if (s === undefined) s = I18N.en[key];
  if (s === undefined) s = I18N.zh[key];
  if (s === undefined) return key;
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}
function titleOf(p){
  if (state.lang === 'zh') return esc(p.cn);
  if (p.kind === 'set' || p.kind === 'gradset'){
    const theme = t('theme.' + p.name);
    return theme + ' · ' + t('lib.nSets', { n: p.sets.length });
  }
  if (/^sci-/.test(p.id)) return t('sci.title', { name: p.name });
  if (/^cn-/.test(p.id)){
    const famKey = { 'cn-ffb3a7':'红','cn-fff143':'黄','cn-0aa344':'绿','cn-44cef6':'蓝','cn-75878a':'苍','cn-d2f0f4':'水','cn-f0f0f4':'灰白','cn-000000':'黑','cn-eacd76':'金银' }[p.id];
    return t('cn.title', { fam: t('family.' + famKey) });
  }
  if (p.id === 'nippon') return t('nippon.title');
  const o = I18N[state.lang]['title.' + p.id];
  return o ? esc(o) : esc(p.cn);
}
function descOf(p){
  if (p.kind === 'set' || p.kind === 'gradset')
    return esc(t('desc.curated', { theme: t('theme.' + p.name), n: p.sets.length }));
  if (/^sci-/.test(p.id))
    return state.lang === 'zh' ? esc(p.desc) : esc(t('desc.sci', { type: t('mapType.' + (p.mapType || '顺序')) }));
  if (/^cn-/.test(p.id)){
    const famKey = { 'cn-ffb3a7':'红','cn-fff143':'黄','cn-0aa344':'绿','cn-44cef6':'蓝','cn-75878a':'苍','cn-d2f0f4':'水','cn-f0f0f4':'灰白','cn-000000':'黑','cn-eacd76':'金银' }[p.id];
    return esc(t('desc.cn', { fam: t('family.' + famKey), n: p.colors.length }));
  }
  if (state.lang === 'zh') return esc(p.desc);
  return esc(I18N[state.lang]['desc.' + p.id] ?? I18N.en['desc.' + p.id] ?? p.desc);
}
function applyStaticI18n(){
  document.documentElement.lang = state.lang;
  document.title = t('app.title');
  $$('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  $$('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
  const sel = $('#langSel');
  if (sel) sel.innerHTML = I18N_LOCALES.map(([code, name]) =>
    `<option value="${code}" ${code === state.lang ? 'selected' : ''}>${name}</option>`).join('');
}
function dbNameLine(h, s, l){
  const dbName = nearestDbName(rgbToHex(...hslToRgb(h, s, l)));
  return dbName ? dbName.name + (dbName.exact ? t('names.exactSuffix') : '') : hueName(h, s, l);
}
function dbNameLine(h, s, l){
  const dbName = nearestDbName(rgbToHex(...hslToRgb(h, s, l)));
  return dbName ? dbName.name + (dbName.exact ? ' ' + t('names.exactSuffix') : '') : hueName(h, s, l);
}
function applyThemeLabel(){
  $('#btnTheme').textContent = document.documentElement.dataset.theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
}

/* sRGB → XYZ(D65) → L*a*b* */
/* ---------- OKLab / OKLCH（Björn Ottosson 的公有领域成果） ---------- */
/** OKLCH → HEX：超出 sRGB 色域时按比例压缩色度（保留明度与色相） */
/** OKLab(L,a,b) → HEX（渐变插值用，超域分量直接钳制） */
/** 多锚点 OKLab 插值：anchors 为 HEX 数组，t∈[0,1] 均匀分段 */
/**
 * 对比度求解（Leonardo 思路）：固定色相 H 与色度 C，二分搜索 OKLCH 明度 L，
 * 使其与背景 bgHex 的 WCAG 对比度 ≥ target。返回 {L, hex, reached}。
 */
/* 色觉模拟（Viénot 1999 近似，线性 RGB 空间矩阵） */
/* ================= 通用 UI ================= */
let toastTimer = null;
function showToast(msg){
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}
const debounce = (fn, ms = 150) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
async function copyText(t){
  try { await navigator.clipboard.writeText(t); return true; }
  catch(e){
    try {
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch(e2){ return false; }
  }
}
function download(name, content, mime){
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.download = name; a.href = URL.createObjectURL(blob); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
/* ================= 色名库最近名 ================= */
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

/* ================= 全局状态 ================= */
const CATS = [
  { id: 'all' }, { id: 'starred' }, { id: 'ui' }, { id: 'viz' }, { id: 'curated' }, { id: 'pixel' }, { id: 'editor' }, { id: 'traditional' },
];
/* 收藏夹（localStorage 持久化） */
const starred = new Set();
try { (JSON.parse(localStorage.getItem('hub.starred') || '[]')).forEach(id => starred.add(id)); } catch(e){}
function saveStars(){ try { localStorage.setItem('hub.starred', JSON.stringify([...starred])); } catch(e){} }
function toggleStar(id){
  if (starred.has(id)) starred.delete(id); else starred.add(id);
  saveStars();
  showToast(starred.has(id) ? t('toast.fav', { name: titleOf(PAL(id) || {}) }) : t('toast.unfav'));
}
const state = {
  tab: 'library',
  cat: 'all',
  search: '',
  detailId: null,          // 当前打开的色板
  hueIdx: 0,               // multiscale 当前色相
  mode: 'light',           // radix/antd 亮暗
  brewerScheme: 0,
  brewerClass: 0,
  showContrast: true,
  gen: { h: 212, s: 72, l: 52, wheelScheme: 'analogous' },
  pv: { id: 'tailwind', hue: 4, sim: 'none', compare: false, bId: 'material2', setIdx: 0 },
  lang: detectLang(),
  scaleHex: '#2563EB',     // 色阶工坊基色
  scMode: 'semantic',      // 色阶工坊模式：semantic | contrast
  auditId: 'tailwind',     // 批量审计选中的色板
  setId: '',               // set 详情内的子搜索词
};
const PAL = id => PALETTES.find(p => p.id === id);
const genHex = () => rgbToHex(...hslToRgb(state.gen.h, state.gen.s, state.gen.l));

function dbNameLine(h, s, l){
  const dbName = nearestDbName(rgbToHex(...hslToRgb(h, s, l)));
  return dbName ? dbName.name + (dbName.exact ? t('names.exactSuffix') : '') : hueName(h, s, l);
}
function dbNameLine(h, s, l){
  const dbName = nearestDbName(rgbToHex(...hslToRgb(h, s, l)));
  return dbName ? dbName.name + (dbName.exact ? ' ' + t('names.exactSuffix') : '') : hueName(h, s, l);
}
function applyThemeLabel(){
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = document.documentElement.dataset.theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
}

/* ================= Tab 切换 ================= */
function switchTab(tab){
  state.tab = tab;
  $$('#navTabs .nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  ['library', 'scale', 'generator', 'a11y', 'preview'].forEach(t =>
    $('#tab-' + t).hidden = t !== tab);
}

/* ================= 色板库 ================= */
function stripOf(colors, n = 8){
  const step = Math.max(1, Math.floor(colors.length / n));
  const picks = [];
  for (let i = 0; i < colors.length && picks.length < n; i += step) picks.push(colors[i]);
  return picks.map(c => `<i style="background:${c}"></i>`).join('');
}
function previewOf(p){
  if (p.kind === 'set' || p.kind === 'gradset'){
    // 取前 8 套，每套取第 2 色拼一条彩带
    const picks = p.sets.slice(0, 8).map(s => s.colors[Math.min(1, s.colors.length - 1)] || s.colors[0]);
    return `<div class="strip">${picks.map(c => `<i style="background:${c}"></i>`).join('')}</div>`;
  }
  if (p.kind === 'multiscale'){
    const s = p.scales[state.hueIdx % p.scales.length] || p.scales[0];
    return s ? `<div class="strip">${stripOf(s.steps)}</div>` : '';
  }
  if (p.kind === 'palette') return `<div class="strip">${stripOf(p.colors.map(c => c.hex))}</div>`;
  if (p.kind === 'map') return `<div class="grad-bar" style="background:linear-gradient(90deg,${p.stops.join(',')})"></div>`;
  if (p.kind === 'brewer'){
    const sch = p.schemes[0];
    return sch ? `<div class="strip">${stripOf(sch.classes[Math.min(...Object.keys(sch.classes).map(Number))])}</div>` : '';
  }
  return '';
}
function renderLibrary(){
  // 分类 chips
  $('#catChips').innerHTML = CATS.map(c =>
    `<button type="button" class="cat-chip${state.cat === c.id ? ' active' : ''}" data-cat="${c.id}">${t('cat.' + c.id)}${c.id === 'starred' && starred.size ? ' ' + starred.size : ''}</button>`).join('');
  // 收藏夹导出按钮可见性
  $('#btnStarExport').hidden = starred.size === 0;
  // 网格
  const q = state.search.trim().toLowerCase();
  const list = PALETTES.filter(p =>
    (state.cat === 'all' || (state.cat === 'starred' ? starred.has(p.id) : p.category === state.cat)) &&
    (!q || (p.name + ' ' + p.cn + ' ' + p.id).toLowerCase().includes(q)));
  $('#libGrid').innerHTML = list.map(p => `
    <article class="lib-card" data-id="${p.id}" tabindex="0" role="button" aria-label="${t('lib.open', { name: titleOf(p) })}">
      <button type="button" class="star-btn${starred.has(p.id) ? ' on' : ''}" data-star="${p.id}"
        title="${starred.has(p.id) ? t('lib.unstar') : t('lib.star')}" aria-label="${starred.has(p.id) ? t('lib.unstar') : t('lib.star')} ${titleOf(p)}">${starred.has(p.id) ? '★' : '☆'}</button>
      <div class="row1"><span class="cn">${titleOf(p)}</span><span class="badge">${p.license.split('（')[0].split(' (')[0]}</span></div>
      ${previewOf(p)}
      <div class="meta">${descOf(p)}</div>
    </article>`).join('') || `<p class="text-muted">${t('lib.empty')}</p>`;
}
function openDetail(id, hue){
  const p = PAL(id);
  if (!p) return;
  state.detailId = id;
  state.setId = '';
  state.hueIdx = Number.isInteger(hue) ? Math.max(0, Math.min(hue, (p.scales || []).length - 1)) : 0;
  state.mode = 'light';
  if (p.kind === 'brewer'){ state.brewerScheme = 0; state.brewerClass = Math.min(...Object.keys(p.schemes[0].classes).map(Number)); }
  renderDetail();
  $('#detail').classList.add('open');
  $('#libGrid').style.display = 'none';
  // 更新分享链接：#/p/<id>[/<hue>]
  const h = '#/p/' + id + (p.kind === 'multiscale' ? '/' + state.hueIdx : '');
  if (location.hash !== h) location.hash = h;
  $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeDetail(){
  state.detailId = null;
  $('#detail').classList.remove('open');
  $('#libGrid').style.display = '';
  history.replaceState(null, '', location.pathname + location.search);
}
/** 解析 #/p/<id>[/<hue>] 形式的分享链接 */
function routeFromHash(){
  const m = location.hash.match(/^#\/p\/([A-Za-z0-9_-]+)(?:\/(\d+))?$/);
  if (!m || !PAL(m[1])) return;
  if (state.detailId === m[1] && (m[2] === undefined || +m[2] === state.hueIdx)) return; // 已在该详情页，避免重复渲染
  switchTab('library');
  openDetail(m[1], m[2] !== undefined ? +m[2] : undefined);
}
function swatchHtml(hex, opts = {}){
  const ct = state.showContrast ? (() => {
    const cw = contrast(hex, '#FFFFFF'), cb = contrast(hex, '#000000');
    return `<span class="ct"><span title="${t('a11y.titleW')}">${t('detail.w')}${cw.toFixed(1)}</span><span title="${t('a11y.titleK')}">${t('detail.k')}${cb.toFixed(1)}</span></span>`;
  })() : '';
  const inner = (opts.name ? `<span class="nm" title="${esc(opts.name)}">${esc(opts.name)}</span>` : '') + `<span class="hx">${hex}</span>` + ct;
  return `<button type="button" class="sw" style="background:${hex};color:${inkOn(hex)}"
    data-hex="${hex}" title="${hex}${opts.name ? ' · ' + esc(opts.name) : ''} · ${t('lib.copyHint')}" aria-label="${hex}${opts.name ? ' ' + esc(opts.name) : ''} · ${t('lib.copyHint')}">${inner}</button>`;
}
function sanitizeTokenName(s){
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}
/** Figma Tokens（Tokens Studio）格式 */
function figmaTokensOf(p){
  const node = hex => ({ value: hex, type: 'color' });
  const root = {};
  if (p.kind === 'multiscale'){
    const g = {};
    p.scales.forEach(s => {
      const sub = {};
      s.steps.forEach((h, i) => { sub[String(i + 1)] = node(h); });
      g[sanitizeTokenName(s.name)] = sub;
    });
    root[sanitizeTokenName(p.name)] = g;
  } else if (p.kind === 'palette'){
    const g = {};
    p.colors.forEach((c, i) => { g[String(i + 1)] = node(c.hex); });
    root[sanitizeTokenName(p.name)] = g;
  } else if (p.kind === 'brewer'){
    const sch = p.schemes[state.brewerScheme];
    const cols = sch.classes[state.brewerClass] || [];
    const g = {};
    cols.forEach((h, i) => { g[String(i + 1)] = node(h); });
    root[sanitizeTokenName('brewer-' + sch.name + '-' + state.brewerClass)] = g;
  } else if (p.kind === 'set' || p.kind === 'gradset'){
    const g = {};
    p.sets.forEach(s => {
      g[sanitizeTokenName(s.name)] = s.colors.map(h => ({ value: h, type: 'color' }));
    });
    root[sanitizeTokenName(p.name)] = g;
  } else {
    const g = {};
    p.stops.forEach((h, i) => { g[String(i + 1)] = node(h); });
    root[sanitizeTokenName(p.name)] = g;
  }
  return JSON.stringify(root, null, 2);
}
/** Tailwind CSS v4 @theme 片段 */
function tailwindV4Of(p){
  const lines = [];
  const push = (n, h) => lines.push(`  --color-${sanitizeTokenName(n)}: ${h};`);
  if (p.kind === 'multiscale'){
    p.scales.forEach(s => s.steps.forEach((h, i) => push(p.id + '-' + s.name + '-' + (i + 1), h)));
  } else if (p.kind === 'palette'){
    p.colors.forEach((c, i) => push(p.id + '-' + (i + 1), c.hex));
  } else if (p.kind === 'brewer'){
    const sch = p.schemes[state.brewerScheme];
    (sch.classes[state.brewerClass] || []).forEach((h, i) => push('brewer-' + sch.name + '-' + (i + 1), h));
  } else if (p.kind === 'set' || p.kind === 'gradset'){
    p.sets.slice(0, 200).forEach(s =>
      s.colors.forEach((h, i) => push(sanitizeTokenName(s.name) + '-' + (i + 1), h)));
  } else {
    p.stops.forEach((h, i) => push(p.id + '-' + (i + 1), h));
  }
  return `/* Tailwind CSS v4 @theme 片段 · ${p.cn} · ${licTag(p)}${needsCite(p) ? ' · ' + p.attribution : ''} */\n@theme {\n${lines.join('\n')}\n}`;
}
/* 导出头：只留许可标签；Scientific Colour Maps / ColorBrewer 按要求保留致谢 */
const licTag = p => p.license.split('（')[0].split(' (')[0].trim();
const needsCite = p => /^sci-|^colorbrewer/.test(p.id);
const exportHead = p => `/* ${p.cn} · ${licTag(p)}${needsCite(p) ? ' · ' + p.attribution.replace(/^©\s*/, '© ') : ''} */`;
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
    cols = (sch.classes[state.brewerClass] || sch.classes[nums[0]]).map((h, i) => ({ hex: h, name: String(i + 1) }));
    subtitle = sch.name + ' · ' + state.brewerClass + ' classes';
  } else if (p.kind === 'map'){
    cols = p.stops;
  } else if (p.kind === 'set' || p.kind === 'gradset'){
    cols = (p.sets[Math.min(state.setIdx || 0, p.sets.length - 1)] || { colors: [] }).colors
      .map(c => typeof c === 'string' ? c : c.hex);
  }
  cols = cols.map(c => typeof c === 'string' ? { hex: c, name: '' } : c).slice(0, 40);
  if (!cols.length) return;
  const cell = 150, labelH = 34, perRow = 6;
  const rowsN = Math.ceil(cols.length / perRow);
  const W = 1240, headH = 190, gridH = rowsN * (cell + labelH + 14) + 40, H = headH + gridH + 70;
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
    ctx.fillStyle = lum(...rgb) > 140 ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.9)';
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
function exportText(p, fmt){
  if (fmt === 'json'){
    return JSON.stringify({
      name: p.name, cn: p.cn, license: p.license, source: p.source,
      ...(p.kind === 'multiscale' ? { scales: Object.fromEntries(p.scales.map(s => [s.name, s.steps])) }
        : p.kind === 'brewer' ? { schemes: p.schemes.map(s => ({ name: s.name, type: s.type, classes: s.classes })) }
        : p.kind === 'map' ? { stops: p.stops } : { colors: p.colors }),
    }, null, 2);
  }
  if (fmt === 'tailwind' && p.kind === 'multiscale'){
    const steps11 = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const key = n => p.scales[0].steps.length === 11 ? steps11[n] : n + 1;
    const lines = p.scales.map(s =>
      `        '${s.name}': {\n` + s.steps.map((h, i) => `          ${key(i)}: '${h}',`).join('\n') + '\n        },');
    return `// tailwind.config.js 片段（由 ColorCat 导出 · ${licTag(p)}）\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join('\n')}\n      },\n    },\n  },\n};`;
  }
  if (fmt === 'figma') return figmaTokensOf(p);
  if (fmt === 'theme') return tailwindV4Of(p);
  // 默认 CSS
  if (p.kind === 'multiscale'){
    const lines = p.scales.map(s =>
      `  /* ${s.name} */\n` + s.steps.map((h, i) => `  --${p.id}-${s.name}-${i + 1}: ${h};`).join('\n'));
    return `${exportHead(p)}\n:root {\n${lines.join('\n')}\n}`;
  }
  if (p.kind === 'palette'){
    const lines = p.colors.map((c, i) => `  --${p.id}-${i + 1}: ${c.hex};${c.name ? ' /* ' + c.name.replace(/\*\//g, '') + ' */' : ''}`);
    return `${exportHead(p)}\n:root {\n${lines.join('\n')}\n}`;
  }
  if (p.kind === 'brewer'){
    const sch = p.schemes[state.brewerScheme];
    const cols = sch.classes[state.brewerClass] || [];
    return `/* ColorBrewer ${sch.name}（${state.brewerClass} 类）— Apache-2.0\n   © Cynthia A. Brewer */\n:root {\n` +
      cols.map((h, i) => `  --brewer-${sch.name.toLowerCase()}-${i + 1}: ${h};`).join('\n') + '\n}';
  }
  if (p.kind === 'set' || p.kind === 'gradset'){
    const lines = p.sets.map(s =>
      `  /* ${s.name} */\n` + s.colors.map((h, i) => `  --${sanitizeTokenName(s.name)}-${i + 1}: ${h};`).join('\n'));
    return `${exportHead(p)}\n:root {\n${lines.join('\n')}\n}`;
  }
  if (p.kind === 'map'){
    return `${exportHead(p)}\n.gradient {\n  background: linear-gradient(90deg, ${p.stops.join(', ')});\n}`;
  }
  return '';
}
function renderDetail(){
  const p = PAL(state.detailId);
  if (!p) return;
  let body = '';
  /* --- multiscale --- */
  if (p.kind === 'multiscale'){
    const scale = p.scales[state.hueIdx % p.scales.length];
    const hasDark = scale.dark && scale.dark.length;
    body = `
      <div class="hue-chips">${p.scales.map((s, i) =>
        `<button type="button" class="hue-chip${i === state.hueIdx ? ' active' : ''}" data-hue="${i}">${s.cnName || s.name}</button>`).join('')}</div>
      ${hasDark ? `<div class="mode-switch" style="margin-bottom:12px">
        <button type="button" class="cat-chip${state.mode === 'light' ? ' active' : ''}" data-mode="light">${t('detail.modeLight')}</button>
        <button type="button" class="cat-chip${state.mode === 'dark' ? ' active' : ''}" data-mode="dark">${t('detail.modeDark')}</button>
      </div>` : ''}
      <div class="scale-label"><b>${scale.name}</b><span>${t('detail.posFirst', { n: scale.steps.length })}</span>
        <label class="text-mini" style="display:flex;gap:5px;align-items:center;cursor:pointer">
          <input type="checkbox" id="ctToggle" ${state.showContrast ? 'checked' : ''}> ${t('detail.showContrast')}
        </label>
      </div>
      <div class="sw-grid">${(state.mode === 'dark' && hasDark ? scale.dark : scale.steps).map(h => swatchHtml(h)).join('')}</div>
      <p class="text-mini" style="margin-top:10px">${t('detail.contrastHint')}</p>`;
  }
  /* --- palette --- */
  else if (p.kind === 'palette'){
    body = `
      <label class="text-mini" style="display:flex;gap:5px;align-items:center;cursor:pointer;margin-bottom:12px">
        <input type="checkbox" id="ctToggle" ${state.showContrast ? 'checked' : ''}> ${t('detail.showContrast')}
      </label>
      <div class="sw-grid">${p.colors.map(c => swatchHtml(c.hex, { name: c.name })).join('')}</div>`;
  }
  /* --- brewer --- */
  else if (p.kind === 'brewer'){
    const sch = p.schemes[state.brewerScheme];
    const nums = Object.keys(sch.classes).map(Number).sort((a, b) => a - b);
    const cols = sch.classes[state.brewerClass] || sch.classes[nums[0]];
    const bi = nums.indexOf(state.brewerClass);
    const blindOk = sch.blind[bi] >= 1 || sch.blind[state.brewerClass] >= 1;
    const printOk = sch.print[bi] >= 1 || sch.print[state.brewerClass] >= 1;
    body = `
      <div class="brewer-list" style="margin-bottom:14px">${p.schemes.map((s, i) => `
        <button type="button" class="brewer-item${i === state.brewerScheme ? ' active' : ''}" data-brewer="${i}">
          <div class="strip">${stripOf(s.classes[s.max], Math.min(9, s.max))}</div>
          <div class="nm">${s.name}</div>
        </button>`).join('')}</div>
      <div class="scale-label"><b>${sch.name}</b><span>${t("brewerType." + p.brewerType)}</span>
        <label class="text-mini">${t('detail.brewerCount')}
          <select id="brewerClass" class="text-input" style="height:28px" aria-label="选择色块数">
            ${nums.map(n => `<option value="${n}" ${n === state.brewerClass ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        <label class="text-mini" style="display:flex;gap:5px;align-items:center;cursor:pointer">
          <input type="checkbox" id="ctToggle" ${state.showContrast ? 'checked' : ''}> ${t('detail.showContrast')}
        </label>
      </div>
      <div class="wcag-row">
        <span class="wcag-pill ${blindOk ? 'pass' : ''}">${blindOk ? t('detail.blindOk') : t('detail.blindFail')}</span>
        <span class="wcag-pill ${printOk ? 'pass' : ''}">${printOk ? t('detail.printOk') : t('detail.printFail')}</span>
      </div>
      <div class="sw-grid">${cols.map(h => swatchHtml(h)).join('')}</div>`;
  }
  /* --- map --- */
  else if (p.kind === 'map'){
    body = `
      <div class="grad-bar" style="height:44px;background:linear-gradient(90deg,${p.stops.join(',')})"></div>
      <div class="scale-label" style="margin-top:12px"><b>${t('detail.sampled', { n: p.stops.length })}</b>
        <label class="text-mini" style="display:flex;gap:5px;align-items:center;cursor:pointer">
          <input type="checkbox" id="ctToggle" ${state.showContrast ? 'checked' : ''}> ${t('detail.showContrast')}
        </label>
      </div>
      <div class="sw-grid">${p.stops.map(h => swatchHtml(h)).join('')}</div>
      ${p.warn ? `<div class="map-note">⚠ ${p.desc.includes('谨慎') ? '彩虹类色图在中间区间感知不均匀，容易夸大数据的视觉差异，学术发表请优先选择感知均匀色图。' : ''}</div>` : ''}
      ${p.mapType ? `<p class="text-mini" style="margin-top:8px">${t('detail.mapType', { type: p.mapType })}</p>` : ''}
      ${p.license.includes('引用') ? `<div class="map-note">${t('detail.cite')}</div>` : ''}`;
  }
  /* --- set / gradset（策展合集：包内多套） --- */
  else if (p.kind === 'set' || p.kind === 'gradset'){
    const q = (state.setId || '').trim().toLowerCase();
    const shown = q ? p.sets.filter(s => s.name.toLowerCase().includes(q)) : p.sets;
    const cap = shown.length > 400 ? shown.slice(0, 400) : shown;
    body = `
      <div class="toolbar" style="margin-bottom:10px">
        <input type="search" class="text-input grow" id="setSearch" placeholder="${t('detail.setSearchPh', { n: p.sets.length, more: shown.length !== p.sets.length ? t('detail.matched', { n: shown.length }) : '' })}" value="${state.setId || ''}" aria-label="包内搜索">
      </div>
      ${shown.length > 400 ? `<p class="text-mini">${t('detail.tooMany')}</p>` : ''}
      <div class="set-list">${cap.map(s => p.kind === 'gradset' ? `
        <div class="set-block"><div class="set-name">${esc(s.name)} <span class="text-mini">${t('detail.anchors', { n: s.colors.length })}</span></div>
          <div class="grad-bar" style="margin:2px 0 4px;background:linear-gradient(90deg,${s.colors.join(',')})"></div>
          <div class="set-colors">${s.colors.map(h => `<button type="button" class="sw sw-mini" style="background:${h};color:${inkOn(h)}" data-hex="${h}" title="${h} · 点击复制"><span class="hx">${h}</span></button>`).join('')}</div>
        </div>` : `
        <div class="set-block"><div class="set-name">${esc(s.name)} <span class="text-mini">${t('detail.nColors', { n: s.colors.length })}</span></div>
          <div class="set-colors">${s.colors.map(h => `<button type="button" class="sw sw-mini" style="background:${h};color:${inkOn(h)}" data-hex="${h}" title="${h} · 点击复制"><span class="hx">${h}</span></button>`).join('')}</div>
        </div>`).join('')}</div>`;
  }
  /* --- 组装 --- */
  const fmts = p.kind === 'multiscale'
    ? [['css', t('export.css')], ['json', t('export.json')], ['tailwind', t('export.tailwind')], ['figma', t('export.figma')], ['theme', t('export.theme')]]
    : p.kind === 'set' || p.kind === 'gradset'
    ? [['css', t('export.css')], ['json', t('export.json')], ['figma', t('export.figma')]]
    : [['css', t('export.css')], ['json', t('export.json')], ['figma', t('export.figma')], ['theme', t('export.theme')]];
  $('#detail').innerHTML = `
    <div class="detail-head">
      <button type="button" class="btn btn-sm" id="btnBack">${t('btn.back')}</button>
      <h2>${titleOf(p)}</h2>
      <span class="badge">${p.name}</span>
      <span class="badge">${p.license}</span>
    </div>
    <p class="text-mini" style="margin:2px 0 4px">${descOf(p)}</p>
    ${/^sci-|^colorbrewer/.test(p.id) ? `<p class="text-mini" style="margin:2px 0 4px">${p.attribution}</p>` : ''}
    <div class="detail-actions">
      <button type="button" class="btn btn-sm btn-primary" id="btnApplyPreview">${t('btn.applyPreview')}</button>
      <button type="button" class="btn btn-sm${starred.has(p.id) ? ' on' : ''}" id="btnStar" title="${starred.has(p.id) ? t('lib.unstar') : t('lib.star')}">${starred.has(p.id) ? t('btn.unfav') : t('btn.fav')}</button>
      ${fmts.map(([v, l]) => `<button type="button" class="btn btn-sm" data-fmt="${v}">${l}</button>`).join('')}
      <button type="button" class="btn btn-sm" id="btnCardPng" title="生成色卡图 PNG">${t('btn.card')}</button>
    </div>
    ${body}
    <div class="export-area" id="exportArea" hidden>
      <textarea id="exportText" readonly aria-label="导出内容"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button type="button" class="btn btn-sm" id="btnCopyExport">${t('btn.copy')}</button>
        <button type="button" class="btn btn-sm" id="btnDownloadExport">${t('btn.downloadFile')}</button>
      </div>
    </div>`;
  $('#btnBack').addEventListener('click', closeDetail);
  $('#btnCardPng')?.addEventListener('click', () => {
    paletteCardPNG(p);
    showToast(t('toast.exported', { file: p.id + '-card.png' }));
  });
  $('#btnStar').addEventListener('click', () => { toggleStar(p.id); renderDetail(); renderLibrary(); });
  $('#btnApplyPreview').addEventListener('click', () => {
    state.pv.id = p.id; state.pv.hue = state.hueIdx || state.pv.hue;
    renderPreviewSelect();
    switchTab('preview');
    renderPreview();
    showToast(t('toast.appliedPreview', { name: titleOf(p) }));
  });
  $$('#detail [data-fmt]').forEach(b => b.addEventListener('click', () => {
    $('#exportArea').hidden = false;
    $('#exportText').value = exportText(p, b.dataset.fmt);
    $('#exportArea').dataset.fmt = b.dataset.fmt;
    $('#exportText').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
  const ea = $('#exportArea');
  if (ea){
    $('#btnCopyExport').addEventListener('click', async () => {
      const ok = await copyText($('#exportText').value);
      showToast(ok ? t('toast.copied', { v: '' }) : t('toast.copyFail'));
    });
    $('#btnDownloadExport').addEventListener('click', () => {
      const fmt = ea.dataset.fmt || 'css';
      const ext = fmt === 'json' ? 'json' : fmt === 'tailwind' ? 'js' : 'css';
      download(`${p.id}.${ext}`, $('#exportText').value);
      showToast(t('toast.exported', { file: p.id + '.' + ext }));
    });
  }
  bindDetail(p);
}
function bindDetail(p){
  const setSearch = $('#setSearch');
  if (setSearch) setSearch.addEventListener('input', debounce(e => { state.setId = e.target.value; renderDetail(); const s2 = document.getElementById('setSearch'); if (s2) s2.focus(); }, 200));
  $$('#detail .hue-chip').forEach(b => b.addEventListener('click', () => { state.hueIdx = +b.dataset.hue; renderDetail(); }));
  $$('#detail [data-mode]').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; renderDetail(); }));
  $$('#detail .brewer-item').forEach(b => b.addEventListener('click', () => {
    state.brewerScheme = +b.dataset.brewer;
    const sch = p.schemes[state.brewerScheme];
    state.brewerClass = Math.min(...Object.keys(sch.classes).map(Number));
    renderDetail();
  }));
  const sel = $('#brewerClass');
  if (sel) sel.addEventListener('change', e => { state.brewerClass = +e.target.value; renderDetail(); });
  const ct = $('#ctToggle');
  if (ct) ct.addEventListener('change', e => { state.showContrast = e.target.checked; renderDetail(); });
}

/* ================= 配色生成器（移植自 11 方案工具） ================= */
const GEN_SCHEMES = [
  { id:'mono', cn:'单色配色', en:'Monochromatic', principle:'只保留一个色相，靠明度与饱和度的变化拉开层次。', trait:'画面高度统一、克制耐看，几乎不会出错，但对比相对含蓄。', usage:'极简排版、品牌辅助色、背景与渐变。',
    geo:h=>[h], sw:(h,s)=>[[h,s,22],[h,s,36],[h,s,50],[h,s,64],[h,s,78],[h,Math.round(s*0.5),90]] },
  { id:'analogous', cn:'近似色配色', en:'Analogous', principle:'取色环上相邻的色相，各档相距 30°，共享相近的视觉温度。', trait:'过渡自然、氛围统一，像日落或森林的色彩关系。', usage:'风景插画、氛围背景、舒适型界面。',
    geo:h=>[-60,-30,0,30,60], sw:(h,s,l)=>[-60,-30,0,30,60].map(d=>[norm(h+d),s,l]) },
  { id:'complementary', cn:'互补色配色', en:'Complementary', principle:'取色环上正对的两个色相，相差 180°，互为补色。', trait:'对比最强烈、主次分明，视觉冲击力大；面积比例得当才不刺眼。', usage:'强调重点、CTA 按钮、运动与警示风格。',
    geo:h=>[h,h+180], sw:(h,s)=>{const o=norm(h+180);return[[h,s,50],[h,s,30],[h,s,72],[o,s,50],[o,s,30],[o,s,72]];} },
  { id:'split', cn:'拆分互补色', en:'Split-Complementary', principle:'保留基色，把正对的补色换成它两侧的邻居（相差 +150° 与 −150°）。', trait:'保住对比但更柔和，比互补色更容易平衡、更耐看。', usage:'网页与插画配色、品牌视觉。',
    geo:h=>[h,h+150,h+210], sw:(h,s)=>{const a=norm(h+150),b=norm(h+210);return[[h,s,50],[a,s,50],[b,s,50],[a,s,72],[b,s,72]];} },
  { id:'triadic', cn:'三元色配色', en:'Triadic', principle:'三个色相在色环上等距分布，彼此相差 120°。', trait:'鲜活而平衡，每个颜色都有存在感又不互相冲突。', usage:'儿童产品、活动海报、艺术创作。',
    geo:h=>[h,h+120,h+240], sw:(h,s)=>{const t=[h,norm(h+120),norm(h+240)];return[...t.map(x=>[x,s,50]),...t.map(x=>[x,s,74])];} },
  { id:'square', cn:'四方色配色', en:'Square', principle:'四个色相等距分布，彼此相差 90°，在色环上构成正方形。', trait:'四种颜色视觉权重相等，均衡而丰富。', usage:'品牌系统、图标、多彩界面。',
    geo:h=>[h,h+90,h+180,h+270], sw:(h,s)=>{const t=[h,norm(h+90),norm(h+180),norm(h+270)];return[...t.map(x=>[x,s,50]),...t.map(x=>[x,s,74])];} },
  { id:'tetradic', cn:'四元色配色', en:'Tetradic', principle:'两对互补色组成矩形：基色、+60°、+180°、+240°。', trait:'色彩层次最丰富，天然形成两组主次对比。', usage:'数据可视化、主题皮肤、游戏界面。',
    geo:h=>[h,h+60,h+180,h+240], sw:(h,s)=>{const t=[h,norm(h+60),norm(h+180),norm(h+240)];return[...t.map(x=>[x,s,50]),...t.map(x=>[x,s,74])];} },
  { id:'pentadic', cn:'五元色配色', en:'Pentadic', principle:'五个色相等距分布，彼此相差 72°，构成正五边形。', trait:'丰富且动态平衡，视觉张力强。', usage:'创意设计、节庆活动、多元化品牌。',
    geo:h=>[h,h+72,h+144,h+216,h+288], sw:(h,s)=>[h,norm(h+72),norm(h+144),norm(h+216),norm(h+288)].map(x=>[x,s,50]) },
  { id:'hexadic', cn:'六元色配色', en:'Hexadic', principle:'六个色相等距分布，彼此相差 60°，构成正六边形。', trait:'覆盖完整色环，内含三对互补色，平衡性最佳。', usage:'大型项目、多媒体设计、色彩编码系统。',
    geo:h=>[h,h+60,h+120,h+180,h+240,h+300], sw:(h,s)=>[h,norm(h+60),norm(h+120),norm(h+180),norm(h+240),norm(h+300)].map(x=>[x,s,50]) },
  { id:'extanalogous', cn:'扩展近似色', en:'Extended Analogous', principle:'把近似色的范围放宽到 ±45°，覆盖约 90° 的扇形区间。', trait:'依然和谐，但层次与渐变空间更大。', usage:'渐变海报、自然主题、品牌延展。',
    geo:h=>[-45,-22.5,0,22.5,45], sw:(h,s,l)=>[-45,-22.5,0,22.5,45].map(d=>[norm(h+d),s,l]) },
  { id:'rainbow', cn:'彩虹配色', en:'Rainbow', principle:'按光谱顺序取 8 个色相，铺满整个色环。', trait:'色彩最丰富、活力最强、动感十足。', usage:'儿童产品、节庆庆典、创意广告。',
    geo:h=>[0,45,90,135,180,225,270,315].map(d=>h+d), sw:(h,s)=>{const s2=Math.max(s,65);return [0,45,90,135,180,225,270,315].map(d=>[norm(h+d),s2,52]);} },
];
const genColors = sch => sch.sw(state.gen.h, state.gen.s, state.gen.l).map(([h, s, l]) => rgbToHex(...hslToRgb(h, s, l)));
const WC = 160, WR = 118;
function buildWheelGradient(){
  const stops = [];
  for (let d = 0; d < 360; d += 4) stops.push(`hsl(${d},100%,50%) ${d}deg`);
  stops.push('hsl(0,100%,50%) 360deg');
  $('#wheel').style.background = `conic-gradient(${stops.join(',')})`;
}
const dotPos = h => {
  const a = (norm(h) - 90) * Math.PI / 180;
  return [WC + WR * Math.cos(a), WC + WR * Math.sin(a)];
};
function renderGenWheel(){
  const sch = GEN_SCHEMES.find(s => s.id === state.gen.wheelScheme);
  const geo = sch.geo(state.gen.h);
  const baseIdx = sch.geo(0).indexOf(0);
  let svg = '';
  if (geo.length > 1){
    const d = geo.map((h, i) => { const [x, y] = dotPos(h); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join(' ') + ' Z';
    svg += `<path d="${d}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linejoin="round" opacity=".7"/>`;
  }
  svg += `<circle cx="${WC}" cy="${WC}" r="2.5" fill="var(--muted)"/>`;
  geo.forEach((h, i) => {
    const [x, y] = dotPos(h);
    const hex = rgbToHex(...hslToRgb(h, 80, 55));
    const isBase = i === baseIdx;
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isBase ? 11.5 : 8}" fill="${hex}" stroke="var(--panel)" stroke-width="${isBase ? 3 : 2}"/>`;
  });
  $('#wheelSvg').innerHTML = svg;
  const hx = genHex();
  const wc = $('#wheelCenter');
  wc.style.background = hx; wc.style.color = inkOn(hx);
  $('#wcHex').textContent = hx;
}
function renderGenPills(){
  $('#wheelPills').innerHTML = GEN_SCHEMES.map(s =>
    `<button type="button" class="pill${s.id === state.gen.wheelScheme ? ' active' : ''}" data-id="${s.id}" role="tab" aria-selected="${s.id === state.gen.wheelScheme}">${t('scheme.' + s.id + '.n')}</button>`).join('');
}
function selectGenScheme(id){
  state.gen.wheelScheme = id;
  renderGenPills(); renderGenWheel();
  $$('#genSchemeGrid .scheme-card').forEach(c => c.classList.toggle('match', c.dataset.id === id));
}
function buildGenCards(){
  $('#genSchemeGrid').innerHTML = GEN_SCHEMES.map(s => `
    <article class="scheme-card" data-id="${s.id}">
      <h3 data-role="title" title="${t('gen.wheelHint')}">${t('scheme.' + s.id + '.n')}<span class="en">${s.en}</span></h3>
      <p class="theory"><b>${t('gen.theoryP')}</b>${t('scheme.' + s.id + '.p')}<br><b>${t('gen.theoryT')}</b>${t('scheme.' + s.id + '.t')}<br><b>${t('gen.theoryU')}</b>${t('scheme.' + s.id + '.u')}</p>
      <div class="swatches sw-grid" data-role="swatches" style="margin-top:10px"></div>
      <div class="card-actions">
        <button type="button" class="btn btn-sm" data-act="copy">${t('gen.cardCopy')}</button>
        <button type="button" class="btn btn-sm" data-act="json">${t('gen.cardJson')}</button>
      </div>
    </article>`).join('');
}
function renderGenSwatches(){
  $$('#genSchemeGrid .scheme-card').forEach(card => {
    const sch = GEN_SCHEMES.find(s => s.id === card.dataset.id);
    card.querySelector('[data-role="swatches"]').innerHTML =
      sch.sw(state.gen.h, state.gen.s, state.gen.l).map(([h, s, l]) => {
        const hex = rgbToHex(...hslToRgb(h, s, l));
        return swatchHtml(hex);
      }).join('');
  });
}
function renderGenInfo(){
  const rgb = hslToRgb(state.gen.h, state.gen.s, state.gen.l);
  const hex = rgbToHex(...rgb);
  const [hsvH, hsvS, hsvV] = rgbToHsv(...rgb);
  const [c, m, y, k] = rgbToCmyk(...rgb);
  const [L, A, B] = rgbToLab(...rgb);
  const rows = [
    ['HEX', hex], ['RGB', `rgb(${rgb.join(', ')})`], ['HSL', `hsl(${state.gen.h}, ${state.gen.s}%, ${state.gen.l}%)`],
    ['HSV', `hsv(${hsvH}, ${hsvS}%, ${hsvV}%)`], ['CMYK', `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`],
    ['L*a*b*', `lab(${L}, ${A}, ${B})`], [t('gen.nearest'), hueName(state.gen.h, state.gen.s, state.gen.l)],
    [t('names.db'), dbNameLine(state.gen.h, state.gen.s, state.gen.l)],
  ];
  $('#genInfoRows').innerHTML = rows.map(([k2, v]) =>
    `<div class="info-row" data-copy="${v}"><span class="info-key">${k2}</span><span class="info-val">${v}</span></div>`).join('');
}
function setGenBase(h, s, l, silent){
  state.gen.h = Math.round(norm(h)); state.gen.s = Math.max(0, Math.min(100, Math.round(s))); state.gen.l = Math.max(0, Math.min(100, Math.round(l)));
  const langSel = $('#langSel');
  if (langSel) langSel.addEventListener('change', e => {
    try { localStorage.setItem('hub.lang', e.target.value); } catch(err){}
    showToast(t('toast.langSaved'));
    setTimeout(() => location.reload(), 400);
  });
  const hx = genHex();
  $('#genHex').value = hx; $('#genColorChip').value = hx;
  renderGenWheel(); renderGenSwatches(); renderGenInfo();
  if (!silent) showToast(t('toast.generated', { hex: hx }));
}
function tryGenHex(v, silent){
  const rgb = hexToRgb(v);
  if (!rgb){ if (!silent) showToast(t('toast.invalidHex')); return; }
  const [h, s, l] = rgbToHsl(...rgb);
  setGenBase(h, s, l, true);
  if (!silent) showToast(t('toast.baseUpdated', { hex: genHex() }));
}

/* ================= 无障碍实验室 ================= */
function renderContrast(){
  const fg = $('#fgColor').value.toUpperCase(), bg = $('#bgColor').value.toUpperCase();
  const r = contrast(fg, bg);
  $('#ratioVal').textContent = r.toFixed(2) + ' : 1';
  const badge = (name, need) => `<span class="wcag-pill ${r >= need ? 'pass' : 'fail'}">${name} ${r >= need ? t('a11y.pass') : t('a11y.fail')}${t('a11y.need', { n: need })}</span>`;
  $('#wcagBadges').innerHTML =
    badge(t('a11y.aaText'), 4.5) + badge(t('a11y.aaaText'), 7) +
    badge(t('a11y.aaLarge'), 3) + badge(t('a11y.aaaLarge'), 4.5) + badge(t('a11y.uiText'), 3);
  $('#sampleArea').style.background = bg;
  $('#sampleArea').style.color = fg;
  $('#sampleArea').innerHTML = `
    <div class="t1">${t('a11y.sample1')}</div>
    <div class="t2">${t('a11y.sample2')}</div>
    <div class="t3">${t('a11y.sample3')}</div>`;
  renderFix(fg, bg, r);
}
/** 修正建议：保留色相，用 OKLCH 二分求解明度，命中目标对比度 */
function fixChipHTML(label, hex, ratio, role){
  return `<button type="button" class="fix-chip" data-role="${role}" data-hex="${hex}" title="点击应用">
    <i style="background:${hex}"></i><span>${label} → <b class="mono">${hex}</b>（${ratio.toFixed(1)}:1）</span></button>`;
}
/** 从内置设计系统色阶中推荐：色相/色度最接近当前前景、且对背景达标的现成颜色 */
function recommendScaleColors(fg, bg, target){
  const och = srgbToOklch(fg);
  if (!och) return [];
  const [, C0, H0] = och;
  const libs = ['tailwind', 'antd', 'opencolor', 'radix'].map(id => PAL(id)).filter(Boolean);
  const out = [];
  for (const lib of libs){
    for (const scale of lib.scales){
      scale.steps.forEach((hex, i) => {
        const r = contrast(hex, bg);
        if (r < target) return;
        const o = srgbToOklch(hex);
        if (!o) return;
        const dH = Math.min(Math.abs(o[2] - H0), 360 - Math.abs(o[2] - H0));
        const dC = Math.abs(o[1] - C0);
        out.push({ hex, r, lib: lib.name.replace(/ ·[\s\S]*$/, ''), scaleName: scale.cnName || scale.name, step: i + 1, d: dH * 2 + dC });
      });
    }
  }
  out.sort((a, b) => a.d - b.d);
  const seen = new Set(), res = [];
  for (const o of out){
    if (seen.has(o.lib)) continue;
    seen.add(o.lib); res.push(o);
    if (res.length >= 3) break;
  }
  return res;
}
function renderFix(fg, bg, r){
  const area = $('#fixArea');
  if (!area) return;
  if (r >= 7){
    area.innerHTML = `<div class="wcag-row"><span class="wcag-pill pass">${t('a11y.allPass')}</span></div>`;
    return;
  }
  const items = [];
  const seen = new Set([fg, bg]);
  let first = true;
  const push = (hex, ratio, role, label) => {
    if (!seen.has(hex) && ratio > r + 0.05){
      seen.add(hex);
      items.push(fixChipHTML((first ? '★ ' : '') + label, hex, ratio, role));
      first = false;
    }
  };
  const fgOch = srgbToOklch(fg), bgOch = srgbToOklch(bg);
  /* 前景修正（保色相） */
  if (fgOch){
    if (r < 7){
      const s = solveContrastStep(bg, 7, fgOch[2], Math.min(fgOch[1], .16));
      if (s) push(s.hex, contrast(s.hex, bg), 'fg', t('a11y.fixAaa'));
    }
    if (r < 4.5){
      const s = solveContrastStep(bg, 4.5, fgOch[2], Math.min(fgOch[1], .16));
      if (s) push(s.hex, contrast(s.hex, bg), 'fg', t('a11y.fixAa'));
    }
  }
  /* 纯黑/白文字 */
  const kb = contrast('#000000', bg), wb = contrast('#FFFFFF', bg);
  const mono = kb >= wb ? ['#000000', kb, '黑'] : ['#FFFFFF', wb, '白'];
  push(mono[0], mono[1], 'fg', mono[2] === '白' ? t('a11y.fixMonoW') : t('a11y.fixMonoB'));
  /* 背景修正（保色相） */
  if (bgOch){
    const s = solveContrastStep(fg, 4.5, bgOch[2], Math.min(bgOch[1], .3));
    if (s) push(s.hex, contrast(fg, s.hex), 'bg', t('a11y.fixBg'));
  }
  /* 现成方案：从设计系统色阶推荐 */
  const target = r < 4.5 ? 4.5 : 7;
  const recs = recommendScaleColors(fg, bg, target);
  const recHtml = recs.length ? `
    <div class="text-mini" style="margin:10px 0 6px">${t('a11y.readyMade', { n: target })}</div>
    <div class="fix-row">${recs.map(o => fixChipHTML(`${o.lib} ${o.scaleName} 第${o.step}阶`, o.hex, o.r, 'fg')).join('')}</div>` : '';
  /* 附注：仅大字达标时提示 */
  let note = '';
  if (r < 4.5 && r >= 3) note = `<div class="text-mini" style="margin-top:6px">${t('a11y.bigOnly')}</div>`;
  const workshopBtn = `<div style="margin-top:10px"><button type="button" class="fix-chip" id="btnToScaleWorkshop" title="Scale Studio">${t('a11y.toWorkshop')}</button></div>`;
  area.innerHTML = (items.length
    ? `<div class="text-mini" style="margin-bottom:6px">${t('a11y.fixHead')}</div><div class="fix-row">${items.join('')}</div>${recHtml}${workshopBtn}`
    : r >= 4.5
      ? `<div class="text-mini">${t('a11y.aaOnlyNote')}</div>${recHtml}${workshopBtn}`
      : `<div class="text-mini">${t('a11y.noFixNote')}</div>${recHtml}${workshopBtn}`) + note;
}
function renderConv(){
  const hex = $('#convInput').value.toUpperCase();
  $('#convText').value = hex;
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const [h, s, l] = rgbToHsl(...rgb), [h2, s2, v] = rgbToHsv(...rgb), [c, m, y, k] = rgbToCmyk(...rgb), [L, A, B] = rgbToLab(...rgb);
  const rows = [
    ['HEX', hex], ['RGB', `rgb(${rgb.join(', ')})`], ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
    ['HSV/HSB', `hsv(${h2}, ${s2}%, ${v}%)`], ['CMYK', `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`],
    ['L*a*b* (D65)', `lab(${L}, ${A}, ${B})`], [t('names.db'), dbNameLine(h, s, l)], [t('gen.nearest'), hueName(h, s, l)],
  ];
  $('#convRows').innerHTML = rows.map(([k2, v2]) =>
    `<div class="info-row" data-copy="${v2}"><span class="info-key">${k2}</span><span class="info-val">${v2}</span></div>`).join('');
}
function renderCvdStrip(){
  const base = (PAL('opencolor').scales.find(s => s.name === 'red').steps).concat(
    PAL('opencolor').scales.find(s => s.name === 'green').steps.slice(2, 5),
    PAL('opencolor').scales.find(s => s.name === 'blue').steps.slice(4, 7));
  const modes = [['none', t('cvd.none')], ['prot', t('cvd.prot')], ['deut', t('cvd.deut')], ['trit', t('cvd.trit')], ['gray', t('cvd.gray')]];
  $('#cvdStrip').innerHTML = modes.map(([m, label]) => `
    <div><div class="lab">${label}</div>
    <div class="strip">${base.map(h => `<i style="background:${simulate(h, m)}" title="${h} → ${simulate(h, m)}"></i>`).join('')}</div></div>`).join('');
}

/* ================= M3 动态主题（官方 HCT 引擎） ================= */
const M3_TONES = [100, 95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0];
function genM3(hex){
  const MCU = window.MCU;
  if (!MCU) return null;
  const src = MCU.Hct.fromInt(MCU.argbFromHex(hex));
  const H = src.hue, C = Math.max(src.chroma, 48);
  const palettes = {
    primary: MCU.TonalPalette.fromHueAndChroma(H, C),
    secondary: MCU.TonalPalette.fromHueAndChroma(H, 16),
    tertiary: MCU.TonalPalette.fromHueAndChroma((H + 60) % 360, 24),
    neutral: MCU.TonalPalette.fromHueAndChroma(H, 4),
    neutralVariant: MCU.TonalPalette.fromHueAndChroma(H, 8),
    error: MCU.TonalPalette.fromHueAndChroma(25, 84),
  };
  const tone = (pal, tn) => MCU.hexFromArgb(pal.tone(tn)).toUpperCase();
  const scheme = {
    light: {
      primary: tone(palettes.primary, 40), onPrimary: tone(palettes.primary, 100),
      primaryContainer: tone(palettes.primary, 90), onPrimaryContainer: tone(palettes.primary, 10),
      secondary: tone(palettes.secondary, 40), onSecondary: tone(palettes.secondary, 100),
      secondaryContainer: tone(palettes.secondary, 90), onSecondaryContainer: tone(palettes.secondary, 10),
      tertiary: tone(palettes.tertiary, 40), onTertiary: tone(palettes.tertiary, 100),
      tertiaryContainer: tone(palettes.tertiary, 90), onTertiaryContainer: tone(palettes.tertiary, 10),
      error: tone(palettes.error, 40), onError: tone(palettes.error, 100),
      surface: tone(palettes.neutral, 98), onSurface: tone(palettes.neutral, 10),
      surfaceVariant: tone(palettes.neutralVariant, 90), onSurfaceVariant: tone(palettes.neutralVariant, 30),
    },
    dark: {
      primary: tone(palettes.primary, 80), onPrimary: tone(palettes.primary, 20),
      primaryContainer: tone(palettes.primary, 30), onPrimaryContainer: tone(palettes.primary, 90),
      secondary: tone(palettes.secondary, 80), onSecondary: tone(palettes.secondary, 20),
      secondaryContainer: tone(palettes.secondary, 30), onSecondaryContainer: tone(palettes.secondary, 90),
      tertiary: tone(palettes.tertiary, 80), onTertiary: tone(palettes.tertiary, 20),
      tertiaryContainer: tone(palettes.tertiary, 30), onTertiaryContainer: tone(palettes.tertiary, 90),
      error: tone(palettes.error, 80), onError: tone(palettes.error, 20),
      surface: tone(palettes.neutral, 6), onSurface: tone(palettes.neutral, 90),
      surfaceVariant: tone(palettes.neutralVariant, 30), onSurfaceVariant: tone(palettes.neutralVariant, 80),
    },
  };
  return { sourceHue: H, sourceChroma: src.chroma, palettes, scheme };
}
const M3_PALETTE_KEYS = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'];

/* ================= 批量对比度审计 ================= */
function paletteFlatColors(p){
  if (!p) return [];
  if (p.kind === 'multiscale') return [...new Set(p.scales.flatMap(s => s.steps))];
  if (p.colors) return p.colors.map(c => c.hex);
  if (p.sets) return p.sets.flatMap(s => s.colors);
  if (p.stops) return p.stops;
  if (p.kind === 'brewer') return p.schemes.flatMap(s => s.classes[Math.min(...Object.keys(s.classes).map(Number))]);
  return [];
}
function renderAuditSel(){
  const sel = $('#audSel');
  if (sel) sel.innerHTML = PALETTES.map(pp =>
    '<option value="' + pp.id + '"' + (pp.id === state.auditId ? ' selected' : '') + '>' + titleOf(pp) + '</option>').join('');
}
function renderAudit(){
  const bgEl = $('#audBg');
  const bg = bgEl ? bgEl.value.toUpperCase() : '#FFFFFF';
  const p = PAL(state.auditId);
  const fromPalette = paletteFlatColors(p);
  const customEl = $('#audCustom');
  const custom = (customEl ? customEl.value : '').split(/[\n,;]+/)
    .map(s => s.trim()).filter(Boolean).map(c => { const rgb = hexToRgb(c); return rgb ? rgbToHex(...rgb) : null; }).filter(Boolean);
  const unique = [...new Set([...custom, ...fromPalette])];
  const capNote = unique.length > 60 ? '<p class="text-mini">' + t('a11y.auditCap', { n: 60 }) + '</p>' : '';
  const list = unique.slice(0, 60);
  if (!list.length){
    if ($('#audOut')) $('#audOut').innerHTML = '<p class="text-mini">' + t('a11y.auditNone') + '</p>';
    return;
  }
  const chip = (label, ok) => '<span class="wcag-pill ' + (ok ? 'pass' : 'fail') + '" style="padding:2px 8px;font-size:11px">' + label + ' ' + (ok ? '✓' : '✗') + '</span>';
  const rows = list.map(hex => {
    const rr = contrast(hex, bg);
    const w = wcagVerdicts(rr);
    return '<div class="audit-row">' +
      '<span class="audit-dot" style="background:' + hex + '"></span>' +
      '<span class="mono audit-hex">' + hex + '</span>' +
      '<span class="mono audit-ratio">' + rr.toFixed(2) + '</span>' +
      '<span class="audit-chips">' + chip(t('a11y.aaText'), w.aa_normal) + chip(t('a11y.aaLarge'), w.aa_large) + chip(t('a11y.uiText'), w.ui_components) + '</span>' +
      '<span class="audit-verdict">' + (w.aa_normal ? t('scale.aaOk') : w.aa_large ? t('scale.aaOnly') : t('scale.fail')) + '</span>' +
      '</div>';
  }).join('');
  const passBody = list.filter(hex => wcagVerdicts(contrast(hex, bg)).aa_normal).length;
  $('#audOut').innerHTML = capNote + rows +
    '<p class="text-mini" style="margin-top:8px">' + t('scale.bgRead') + ': ' + bg + ' · ' + t('a11y.aaText') + ': ' + passBody + '/' + list.length + '</p>';
}
function renderAuditSelAndOut(){ renderAuditSel(); renderAudit(); }

/* ================= 应用预览 ================= */
const PV_VALUES = [62, 38, 91, 47, 73, 55, 84, 30];
function buildPreviewModel(pId, hueIdx, setIdx){
  const p = PAL(pId) || PALETTES[0];
  const sim = state.pv.sim;
  const S = h => simulate(h, sim);
  let roles, cat = [], seqFn = null, note = '';
  /* set/gradset：先解析出当前选中的「套」 */
  let setColors = null, setName = '', isGrad = false;
  if (p.kind === 'set' || p.kind === 'gradset'){
    isGrad = p.kind === 'gradset';
    const idx = Math.max(0, Math.min(setIdx || 0, p.sets.length - 1));
    const chosen = p.sets[idx];
    setColors = chosen.colors;
    setName = chosen.name;
  } else if (p.kind === 'palette'){
    setColors = p.colors.map(c => c.hex);
  }
  if (p.kind === 'multiscale'){
    const hue = p.scales[Math.min(hueIdx, p.scales.length - 1)];
    const st = hue.steps, n = st.length;
    roles = { bg: st[0], surface: st[Math.min(1, n - 1)], border: st[Math.min(5, n - 1)], text: st[n - 1], accent: st[Math.round(n * .55)], accentText: inkOn(st[Math.round(n * .55)]) };
    cat = p.scales.filter((s, i) => i !== hueIdx).map(s => s.steps[Math.round(s.steps.length * .55)]).slice(0, 8);
    seqFn = t => st[Math.min(n - 1, Math.round(t * (n - 1)))];
    note = t('pv.nMulti', { hue: hue.name });
  } else if (setColors){
    const colors = setColors;
    const bg = (!isGrad && p.bg) || colors.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)))[0];
    const byContrast = colors.slice().sort((a, b) => contrast(b, bg) - contrast(a, bg));
    const text = byContrast[0];
    const sat = colors.slice().sort((a, b) => { const [ha, sa] = rgbToHsl(...hexToRgb(a)), [hb, sb] = rgbToHsl(...hexToRgb(b)); return sb - sa; });
    roles = { bg, surface: lerpHex(bg, text, .06), border: lerpHex(bg, text, .22), text, accent: sat[0], accentText: inkOn(sat[0]) };
    const picked = [];
    for (const c of sat){
      if (picked.every(x => { const d = hexToRgb(x), e = hexToRgb(c); return Math.abs(d[0] - e[0]) + Math.abs(d[1] - e[1]) + Math.abs(d[2] - e[2]) > 90; })) picked.push(c);
      if (picked.length >= 8) break;
    }
    cat = picked;
    if (isGrad && colors.length >= 2){
      seqFn = t => oklabGradientHex(colors, t);
      note = t('pv.nGrad', { name: setName, n: colors.length });
    } else if (p.kind === 'palette'){
      const sorted = colors.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)));
      seqFn = t => sorted[Math.min(sorted.length - 1, Math.round(t * (sorted.length - 1)))];
      note = t('pv.nPalette');
    } else {
      const sorted = colors.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)));
      seqFn = t => sorted[Math.min(sorted.length - 1, Math.round(t * (sorted.length - 1)))];
      note = t('pv.nCurated', { name: setName, n: colors.length });
    }
  } else if (p.kind === 'brewer'){
    const sch = p.schemes[state.brewerScheme];
    const nums = Object.keys(sch.classes).map(Number).sort((a, b) => a - b);
    const cols = sch.classes[state.brewerClass] || sch.classes[nums[0]];
    const sorted = cols.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)));
    roles = { bg: sorted[0], surface: lerpHex(sorted[0], '#888888', -.08), border: lerpHex(sorted[0], sorted[sorted.length - 1], .5), text: sorted[sorted.length - 1], accent: cols[0], accentText: inkOn(cols[0]) };
    cat = cols.slice(0, 8);
    seqFn = t => cols[Math.min(cols.length - 1, Math.round(t * (cols.length - 1)))];
    note = t('pv.nBrewer', { scheme: sch.name, n: cols.length, type: t('brewerType.' + p.brewerType) });
    state._pvBrewer = { sch, cols };
  } else if (p.kind === 'map'){
    const st = p.stops;
    roles = { bg: st[1], surface: st[2], border: st[Math.round(st.length * .4)], text: st[st.length - 4] < st[1] ? st[0] : st[st.length - 1], accent: st[Math.round(st.length * .7)], accentText: inkOn(st[Math.round(st.length * .7)]) };
    cat = Array.from({ length: 8 }, (_, i) => st[Math.round(i * (st.length - 1) / 7)]);
    seqFn = t => st[Math.min(st.length - 1, Math.round(t * (st.length - 1)))];
    note = t('pv.nMap');
  }
  /* 通过色觉模拟 */
  const T = o => {
    if (Array.isArray(o)) return o.map(S);
    if (typeof o === 'string') return S(o);
    const r = {};
    for (const k of Object.keys(o)) r[k] = S(o[k]);
    return r;
  };
  if (!roles){   // 未知类型兜底，避免整页崩溃
    roles = { bg: '#F5F6F8', surface: '#FFFFFF', border: '#E4E7EC', text: '#1B1E23', accent: '#2563EB', accentText: '#FFFFFF' };
    cat = cat.length ? cat : ['#2563EB', '#7C3AED', '#0E9F6E', '#F59E0B', '#DC3232'];
    seqFn = seqFn || (t => t < .5 ? '#2563EB' : '#7C3AED');
    note = '该类型暂无专属预览模型，显示兜底样式。';
  }
  return { p, roles: T(roles), cat: T(cat), seqFn: t => S(seqFn(t)), note };
}
function renderMh(){
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
function renderPreviewSelect(){
  const opts = sel => PALETTES.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${titleOf(p)}</option>`).join('');
  $('#pvSelect').innerHTML = opts(state.pv.id);
  $('#pvB').innerHTML = opts(state.pv.bId);
  const p = PAL(state.pv.id);
  const hueWrap = $('#pvHueWrap'), setWrap = $('#pvSetWrap');
  if (p && p.kind === 'multiscale'){
    hueWrap.hidden = false;
    $('#pvHue').innerHTML = p.scales.map((s, i) => `<option value="${i}" ${i === state.pv.hue ? 'selected' : ''}>${s.cnName || s.name}</option>`).join('');
  } else hueWrap.hidden = true;
  if (p && (p.kind === 'set' || p.kind === 'gradset')){
    setWrap.hidden = false;
    $('#pvSet').innerHTML = p.sets.map((s, i) =>
      `<option value="${i}" ${i === (state.pv.setIdx || 0) ? 'selected' : ''}>${s.name}（${s.colors.length} 色）</option>`).join('');
  } else setWrap.hidden = true;
}
/* ---- 纯 HTML 构建器（单例与对比模式共用） ---- */
function uiMockHTML(roles, cat){
  return `
    <div style="display:flex;min-height:220px">
      <div class="side" style="background:${roles.bg}">
        <div class="brand-dot" style="background:${roles.accent}"></div>
        ${[0, 1, 2, 3, 4].map(i => `<div class="nav-line" style="background:${roles.text};opacity:${i === 1 ? .85 : .28};width:${i === 1 ? 82 : 64}%"></div>`).join('')}
      </div>
      <div class="main" style="background:${roles.surface}">
        <div class="title-line" style="background:${roles.text};opacity:.9"></div>
        <div class="body-line" style="background:${roles.text};opacity:.4;width:92%"></div>
        <div class="body-line" style="background:${roles.text};opacity:.4;width:78%"></div>
        <div class="body-line" style="background:${roles.text};opacity:.28;width:60%"></div>
        <div class="btn-line" style="background:${roles.accent};color:${roles.accentText};margin-top:4px">主要按钮</div>
        <div style="display:flex;gap:6px;margin-top:2px">
          ${cat.slice(0, 5).map(c => `<i style="width:22px;height:22px;border-radius:6px;background:${c};display:inline-block;border:1px solid ${roles.border}"></i>`).join('')}
        </div>
      </div>
    </div>`;
}
function barChartHTML(cat, seqFn, id){
  const idAttr = id ? ` id="${id}"` : '';
  const maxV = Math.max(...PV_VALUES);
  const barW = 34, gap = 8, x0 = 16, y0 = 168, H = 150;
  const bars = PV_VALUES.map((v, i) => {
    const h = Math.max(6, v / maxV * H);
    const x = x0 + i * (barW + gap);
    const fill = seqFn ? seqFn(v / 100) : cat[i % Math.max(1, cat.length)];
    return `<rect x="${x}" y="${y0 - h}" width="${barW}" height="${h}" rx="4" fill="${fill}"><title>${v}</title></rect>
      <text x="${x + barW / 2}" y="${y0 + 14}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="ui-monospace,monospace">${v}</text>`;
  }).join('');
  const w = x0 + PV_VALUES.length * (barW + gap);
  return `<svg${idAttr} class="chart-svg" viewBox="0 0 ${w} 190" role="img" aria-label="柱状图预览"><line x1="${x0 - 4}" y1="${y0 + .5}" x2="${w - gap + 4}" y2="${y0 + .5}" stroke="var(--border)" stroke-width="1"/>${bars}</svg>`;
}
const DONUT_SLICES = [30, 22, 18, 16, 14];
function donutSVGHTML(cat, id){
  const idAttr = id ? ` id="${id}"` : '';
  const donutColors = cat.slice(0, DONUT_SLICES.length);
  const R = 52, CX = 80, CY = 80, CIRC = 2 * Math.PI * R;
  let off = 0;
  const segs = DONUT_SLICES.map((v, i) => {
    const len = v / 100 * CIRC;
    const el = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${donutColors[i % Math.max(1, donutColors.length)]}" stroke-width="26"
      stroke-dasharray="${(len - 1.5).toFixed(2)} ${(CIRC - len + 1.5).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"><title>${v}%</title></circle>`;
    off += len;
    return el;
  }).join('');
  return `<svg${idAttr} class="chart-svg" style="max-height:190px" viewBox="0 0 160 160" role="img" aria-label="环形图预览">${segs}</svg>`;
}
function legendHTML(cat){
  return DONUT_SLICES.map((v, i) =>
    `<span class="li"><i style="background:${cat[i % Math.max(1, cat.length)]}"></i>${t('pv.series', { n: i + 1, v })}</span>`).join('');
}
function previewColHTML(tag, tagCls, model){
  return `
    <div class="pv-col">
      <span class="pv-tag ${tagCls}">${tag}</span>
      <h3>${model.p.cn}</h3>
      <div class="chart-card"><h3>界面样式模拟</h3><div class="ui-mock" style="border-color:${model.roles.border}">${uiMockHTML(model.roles, model.cat)}</div></div>
      <div class="chart-card"><h3>数据可视化模拟</h3>${barChartHTML(model.cat, model.seqFn)}${donutSVGHTML(model.cat)}<div class="legend-row">${legendHTML(model.cat)}</div></div>
    </div>`;
}
function renderPreview(){
  const model = buildPreviewModel(state.pv.id, state.pv.hue, state.pv.setIdx);
  const compare = state.pv.compare;
  $('#pvCompare').checked = compare;
  $('#pvBWrap').hidden = !compare;
  $('#pvSingle').hidden = compare;
  $('#pvCompareView').hidden = !compare;
  $('#pvNote').hidden = compare;
  if (compare){
    const mb = buildPreviewModel(state.pv.bId, 0, 0);
    $('#pvCompareView').innerHTML = `<div class="pv-cols">${previewColHTML('A · 当前', '', model)}${previewColHTML('B · 对比', 'b', mb)}</div>
      <p class="text-mini" style="margin-top:10px">${t('pv.compareHint')}</p>`;
    return;
  }
  $('#pvNote').textContent = model.note;
  const { roles, cat, seqFn } = model;
  const ui = $('#pvUI');
  ui.style.borderColor = roles.border;
  ui.innerHTML = uiMockHTML(roles, cat);
  $('#pvBar').outerHTML = barChartHTML(cat, seqFn, 'pvBar');
  $('#pvDonut').outerHTML = donutSVGHTML(cat, 'pvDonut');
  $('#pvLegend').innerHTML = legendHTML(cat);
}

/* ================= 色阶工坊（OKLCH 语义色阶 + 对比度目标模式） ================= */
let scaleResult = null;
/** 基色 → 12 阶语义色阶：基色锚定第 9 阶（主色），明度曲线向两端展开，色度先升后缓降 */
/** 对比度目标模式：n 阶，目标对比度在 [rMin, rMax] 区间几何分布，逐阶求解 */
function renderScale(){
  const contrastMode = state.scMode === 'contrast';
  const m3Mode = state.scMode === 'm3';
  $('#scContrastCtrls').hidden = !contrastMode;
  $('#scPanelTitle').textContent = contrastMode ? t('scale.h3contrast') : m3Mode ? t('scale.h3m3') : t('scale.h3semantic');
  $$('#scMode .cat-chip').forEach(b => b.classList.toggle('active', b.dataset.mode === state.scMode));
  const och = srgbToOklch(state.scaleHex);
  $('#scColorChip').value = state.scaleHex;
  $('#scHex').value = state.scaleHex;
  if (!och){ return; }
  $('#scOklch').textContent = `${t('gen.base')} OKLCH：L ${och[0].toFixed(3)} · C ${och[1].toFixed(3)} · H ${och[2].toFixed(1)}°`;

  let r;
  if (m3Mode){
    const g = genM3(state.scaleHex);
    if (!g){ $('#scSteps').innerHTML = '<p class="text-mini">MCU missing</p>'; return; }
    scaleResult = { m3: g, mode: 'm3' };
    let rowsHtml = '';
    M3_PALETTE_KEYS.forEach(key => {
      const tones = M3_TONES.map(tn => ({ tn, hex: MCU.hexFromArgb(g.palettes[key].tone(tn)).toUpperCase() }));
      rowsHtml += '<div class="scale-label"><b>' + t('m3.t' + key.charAt(0).toUpperCase() + key.slice(1)) + '</b><span>tone 0–100</span></div>' +
        '<div class="sw-grid">' + tones.map(o => swatchHtml(o.hex, { name: t('scale.m3Tone', { t: o.tn }) })).join('') + '</div>';
    });
    $('#scSteps').innerHTML = rowsHtml;
    const schemeRows = [];
    for (const [modeName, tokens] of Object.entries(g.scheme)){
      const label = modeName === 'light' ? t('scale.m3Light') : t('scale.m3Dark');
      for (const [k, v] of Object.entries(tokens)){
        schemeRows.push('<div class="audit-row"><span class="audit-dot" style="background:' + v + '"></span>' +
          '<span class="audit-hex mono">' + v + '</span><span class="audit-verdict">' + label + ' · ' + k + '</span></div>');
      }
    }
    $('#scReadout').innerHTML = schemeRows.join('');
    $('#scNote').textContent = t('scale.m3Note');
    return;
  } else if (contrastMode){
    const bg = $('#scBg').value.toUpperCase();
    const n = +$('#scCount').value;
    const rMin = Math.max(1.05, +$('#scMin').value || 1.1);
    const rMax = Math.min(21, +$('#scMax').value || 7);
    r = genContrastScale(state.scaleHex, bg, n, Math.min(rMin, rMax), Math.max(rMin, rMax));
  } else {
    r = genScale(state.scaleHex);
  }
  if (!r) return;
  scaleResult = r;
  scaleResult.mode = state.scMode;

  if (contrastMode){
    $('#scSteps').innerHTML = r.detail.map((o, i) =>
      swatchHtml(o.hex, { name: (i + 1) + '·' + o.target.toFixed(1) + '×' })).join('');
    const worst = Math.min(...r.detail.map(o => o.reached / o.target));
    const missed = r.detail.filter(o => o.reached < o.target - 0.05).length;
    $('#scReadout').innerHTML = `
      <div class="info-row" style="cursor:default"><span class="info-key">${t('scale.bgRead')}</span><span class="info-val">${r.bg} · ${t('scale.targetRange', { a: r.detail[0].target.toFixed(1), b: r.detail[r.detail.length - 1].target.toFixed(1) })}</span></div>
      <div class="info-row" style="cursor:default"><span class="info-key">求解精度</span><span class="info-val">${missed === 0 ? t('scale.solveHit') : t('scale.solveMiss', { n: missed })}</span></div>
      <div class="info-row" style="cursor:default"><span class="info-key">${t('scale.useCase')}</span><span class="info-val">${t('scale.useCaseVal', { bg: r.bg, a: r.detail[0] && r.detail[0].target.toFixed(1) })}</span></div>`;
    $('#scNote').textContent = missed === 0
      ? t('scale.noteContrastOk')
      : t('scale.noteContrastMiss');
  } else {
    $('#scSteps').innerHTML = r.steps.map((h, i) => swatchHtml(h, { name: (i + 1) + '·' + SCALE_ROLES[i] })).join('');
    const cw = contrast(r.steps[8], '#FFFFFF'), cb = contrast(r.steps[8], '#000000');
    const t12bg = contrast(r.steps[11], r.steps[0]), t11sub = contrast(r.steps[10], r.steps[1]);
    $('#scReadout').innerHTML = `
      <div class="info-row" style="cursor:default"><span class="info-key">${t('scale.readMain')}</span><span class="info-val">${t('scale.wText')} ${cw.toFixed(1)}:1 / ${t('scale.bText')} ${cb.toFixed(1)}:1 ${cw >= cb ? t('scale.suggestW') : t('scale.suggestB')}</span></div>
      <div class="info-row" style="cursor:default"><span class="info-key">${t('scale.readT12')}</span><span class="info-val">${t12bg.toFixed(1)}:1 ${t12bg >= 4.5 ? t('scale.aaOk') + (t12bg >= 7 ? ' · ' + t('aaaOk') : '') : t('scale.fail')}</span></div>
      <div class="info-row" style="cursor:default"><span class="info-key">${t('scale.readT11')}</span><span class="info-val">${t11sub.toFixed(1)}:1 ${t11sub >= 4.5 ? t('scale.aaOk') : t11sub >= 3 ? t('scale.aaOnly') : t('scale.fail')}</span></div>`;
    $('#scNote').textContent = r.clamped
      ? t('scale.noteClamped')
      : t('scale.noteOk');
  }
}
function setScaleBase(v, silent){
  const rgb = hexToRgb(v);
  if (!rgb){ if (!silent) showToast(t('toast.invalidHex')); return; }
  state.scaleHex = rgbToHex(...rgb);
  renderScale();
  if (!silent) showToast(t('toast.scaleUpdated', { hex: state.scaleHex }));
}
function scaleExportText(fmt){
  if (!scaleResult) return '';
  if (scaleResult.mode === 'contrast'){
    if (fmt === 'json'){
      return JSON.stringify({
        base: state.scaleHex, bg: scaleResult.bg, engine: 'OKLCH + WCAG contrast solve (Leonardo-style)',
        steps: scaleResult.detail.map((o, i) => ({ step: i + 1, target: +o.target.toFixed(2), reached: +o.reached.toFixed(2), hex: o.hex })),
      }, null, 2);
    }
    return `/* 对比度目标色阶 · 基色 ${state.scaleHex} · 背景 ${scaleResult.bg}\n   每阶对背景的实际对比度见注释（Leonardo 式生成，ColorCat 色阶工坊） */\n:root {\n` +
      scaleResult.detail.map((o, i) => `  --scale-${i + 1}: ${o.hex}; /* ${o.reached.toFixed(1)}:1 on ${scaleResult.bg} */`).join('\n') + '\n}';
  }
  if (fmt === 'json'){
    return JSON.stringify({
      base: state.scaleHex, engine: 'OKLCH',
      steps: scaleResult.steps.map((h, i) => ({ step: i + 1, role: SCALE_ROLES[i], hex: h })),
    }, null, 2);
  }
  return `/* 语义色阶 · 基色 ${state.scaleHex} · OKLCH 生成（ColorCat 色阶工坊）\n   角色: 1-2 背景 · 3-4 交互态 · 5-7 边框 · 8-10 强调 · 11-12 文字 */\n:root {\n` +
    scaleResult.steps.map((h, i) => `  --scale-${i + 1}: ${h}; /* ${SCALE_ROLES[i]} */`).join('\n') + '\n}';
}

/* ---------- ④ 渐变色阶检查器（chroma.js Palette Helper 思路重写） ---------- */
const GC_SAMPLES = 9, GC_STOPS = 33;
function gcAnchors(){
  return ['#' + $('#gcA').value.replace('#','').toUpperCase(), '#' + $('#gcM').value.replace('#','').toUpperCase(), '#' + $('#gcB').value.replace('#','').toUpperCase()];
}
function renderGradientChecker(){
  const anchors = gcAnchors();
  const grad = `linear-gradient(90deg, ${Array.from({ length: GC_STOPS }, (_, i) =>
    oklabGradientHex(anchors, i / (GC_STOPS - 1))).join(',')})`;
  const samples = Array.from({ length: GC_SAMPLES }, (_, i) => oklabGradientHex(anchors, i / (GC_SAMPLES - 1)));
  const Ls = samples.map(h => srgbToOklab(...hexToRgb(h))[0]);
  const CVD_LABELS = { none: t('cvd.none'), prot: t('cvd.prot'), deut: t('cvd.deut'), trit: t('cvd.trit') };
  const row = (sim, label) => `
    <div><div class="lab">${label}</div>
    <div class="grad-bar" style="margin:2px 0 8px;background:${sim === 'none' ? grad :
      `linear-gradient(90deg, ${Array.from({ length: GC_STOPS }, (_, i) => simulate(oklabGradientHex(anchors, i / (GC_STOPS - 1)), sim)).join(',')})`}"></div></div>`;
  /* 警告检测 */
  // 警告由引擎结构化 issues 生成（可本地化），与 check_gradient MCP 工具共享同一套检测
  const chk = checkGradient(anchors);
  const warns = (chk.issues || []).map(it =>
    it.type === 'band' ? t('gc.band')
    : it.type === 'cvdSimilar' ? t('gc.cvdSim', { cn: t('cvd.' + it.mode), a: it.seg[0], b: it.seg[1], de: it.de })
    : t('gc.cvdEnds', { cn: t('cvd.' + it.mode) }));
  $('#gcOut').innerHTML = `
    ${row('none', CVD_LABELS.none)}
    <div class="scale-row" style="margin:2px 0 10px">${samples.map((h, i) =>
      swatchHtml(h, { name: t('gc.lLabel', { l: Ls[i].toFixed(2) }) })).join('')}</div>
    ${row('prot', CVD_LABELS.prot)}
    ${row('deut', CVD_LABELS.deut)}
    ${row('trit', CVD_LABELS.trit)}
    ${warns.length
      ? `<div class="map-note">⚠ ${warns.join('<br>⚠ ')}</div>`
      : `<div class="wcag-row"><span class="wcag-pill pass">${t('gc.smooth')}</span></div>`}
    <p class="text-mini">${t('gc.interp')}</p>`;
}

/* ---------- 色阶工坊：图片取色 ---------- */
const scCanvas = $('#scCanvas');
async function loadScaleImageFromBlob(file){
  if (!file) return;
  if (!file.type.startsWith('image/')){ showToast(t('toast.needImage')); return; }
  if (window.createImageBitmap){
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });   // 修正 EXIF 方向
      loadScaleImageBitmap(bmp);
      return;
    } catch(e){ /* 旧浏览器回退到 dataURL 路径 */ }
  }
  const reader = new FileReader();
  reader.onload = ev => loadScaleImageSrc(ev.target.result);
  reader.readAsDataURL(file);
}
function loadScaleImageBitmap(bmp){
  const maxW = 480, maxH = 340;
  const scale = Math.min(maxW / bmp.width, maxH / bmp.height, 1);
  scCanvas.width = Math.max(1, Math.round(bmp.width * scale));
  scCanvas.height = Math.max(1, Math.round(bmp.height * scale));
  scCanvas.getContext('2d').drawImage(bmp, 0, 0, scCanvas.width, scCanvas.height);
  scCanvas.hidden = false;
  document.getElementById('scDzHint').style.display = 'none';
  computeScDominant();
  showToast(t('toast.imgLoaded'));
}
function loadScaleImageSrc(src){
  const img = new Image();
  img.onload = () => {
    const maxW = 480, maxH = 340;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    scCanvas.width = Math.round(img.width * scale);
    scCanvas.height = Math.round(img.height * scale);
    scCanvas.getContext('2d').drawImage(img, 0, 0, scCanvas.width, scCanvas.height);
    scCanvas.hidden = false;
    $('#scDzHint').style.display = 'none';
    computeScDominant();
    showToast(t('toast.imgLoaded'));
  };
  img.onerror = () => showToast(t('toast.imgFail'));
  img.src = src;
}
function computeScDominant(){
  const ctx = scCanvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, scCanvas.width, scCanvas.height);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 16){
    if (data[i + 3] < 200) continue;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const cur = buckets.get(key) || [0, 0, 0, 0];
    cur[0] += data[i]; cur[1] += data[i + 1]; cur[2] += data[i + 2]; cur[3]++;
    buckets.set(key, cur);
  }
  const sorted = [...buckets.values()].sort((a, b) => b[3] - a[3])
    .map(v => v.slice(0, 3).map(x => Math.round(x / v[3])));
  const picked = [];
  for (const rgb of sorted){
    if (picked.every(p => Math.abs(p[0] - rgb[0]) + Math.abs(p[1] - rgb[1]) + Math.abs(p[2] - rgb[2]) > 60)) picked.push(rgb);
    if (picked.length >= 8) break;
  }
  $('#scDomRow').innerHTML = picked.map(rgb => {
    const hex = rgbToHex(...rgb);
    return `<button type="button" class="dom-chip" style="background:${hex}" data-hex="${hex}" title="${hex}" aria-label="使用 ${hex} 作为基色"></button>`;
  }).join('');
}

/* ================= 事件绑定 ================= */
function bind(){
  /* 主题 */
  const btnTheme = $('#btnTheme');
  const applyTheme = t => {
    document.documentElement.dataset.theme = t;
    btnTheme.textContent = t === 'dark' ? I18N[state.lang]['theme.toLight'] : I18N[state.lang]['theme.toDark'];
    try { localStorage.setItem('hub.theme', t); } catch(e){}
  };
  btnTheme.addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  let saved = null;
  try { saved = localStorage.getItem('hub.theme'); } catch(e){}
  applyTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  applyThemeLabel();

  /* Tabs */
  $('#navTabs').addEventListener('click', e => {
    const b = e.target.closest('.nav-tab');
    if (b) switchTab(b.dataset.tab);
  });

  /* 色板库 */
  $('#libSearch').addEventListener('input', debounce(e => { state.search = e.target.value; renderLibrary(); }, 150));
  $('#catChips').addEventListener('click', e => {
    const c = e.target.closest('.cat-chip');
    if (c){ state.cat = c.dataset.cat; renderLibrary(); }
  });
  $('#libGrid').addEventListener('click', e => {
    const star = e.target.closest('.star-btn');
    if (star){
      toggleStar(star.dataset.star);
      renderLibrary();
      if (state.detailId === star.dataset.star) renderDetail();
      return;
    }
    const card = e.target.closest('.lib-card');
    if (card) openDetail(card.dataset.id);
  });
  $('#libGrid').addEventListener('keydown', e => {
    const card = e.target.closest('.lib-card');
    if (card && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openDetail(card.dataset.id); }
  });
  $('#detail').addEventListener('click', async e => {
    const sw = e.target.closest('.sw');
    if (sw){
      const ok = await copyText(sw.dataset.hex);
      showToast(ok ? t('toast.copied', { v: sw.dataset.hex }) : t('toast.copyFail'));
      return;
    }
  });
  $('#detail').addEventListener('dblclick', e => {
    const sw = e.target.closest('.sw');
    if (sw){
      const [h, s, l] = rgbToHsl(...hexToRgb(sw.dataset.hex));
      setGenBase(h, s, l, true);
      switchTab('generator');
      showToast(t('toast.toGen', { hex: sw.dataset.hex }));
    }
  });

  /* 生成器 */
  $('#genColorChip').addEventListener('input', e => tryGenHex(e.target.value));
  $('#genHex').addEventListener('input', e => {
    const v = e.target.value.trim();
    if (/^#?[0-9a-f]{6}$/i.test(v)) tryGenHex(v, true);
  });
  $('#genHex').addEventListener('keydown', e => { if (e.key === 'Enter') tryGenHex(e.target.value); });
  $('#btnGenApply').addEventListener('click', () => tryGenHex($('#genHex').value));
  $('#btnGenRandom').addEventListener('click', () =>
    setGenBase(Math.random() * 360, 40 + Math.random() * 50, 42 + Math.random() * 22));
  $('#wheelPills').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (pill) selectGenScheme(pill.dataset.id);
  });
  const grid = $('#genSchemeGrid');
  grid.addEventListener('click', async e => {
    const card = e.target.closest('.scheme-card');
    if (!card) return;
    const sch = GEN_SCHEMES.find(s => s.id === card.dataset.id);
    const act = e.target.closest('[data-act]');
    if (act){
      const hexes = genColors(sch);
      if (act.dataset.act === 'copy'){
        const ok = await copyText(hexes.join(', '));
        showToast(ok ? t('toast.schemeCopied', { n: hexes.length }) : t('toast.copyFail'));
      } else {
        download(`${sch.en}-palette.json`, JSON.stringify({
          base: { hex: genHex(), hsl: [state.gen.h, state.gen.s, state.gen.l] },
          scheme: sch.cn, en: sch.en, colors: hexes,
        }, null, 2));
        showToast(t('toast.exported', { file: sch.en + '-palette.json' }));
      }
      return;
    }
    if (e.target.closest('h3')) selectGenScheme(sch.id);
  });
  grid.addEventListener('dblclick', e => {
    const sw = e.target.closest('.sw');
    if (!sw) return;
    tryGenHex(sw.dataset.hex, true);
    showToast(t('toast.baseUpdated', { hex: sw.dataset.hex }));
  });
  $('#mhScheme').addEventListener('change', renderMh);
  ['#mh1', '#mh2', '#mh3'].forEach(id => $('#' + id).addEventListener('input', renderMh));
  $('#btnMh').addEventListener('click', renderMh);
  $('#genInfoRows').addEventListener('click', async e => {
    const row = e.target.closest('.info-row');
    if (!row) return;
    const ok = await copyText(row.dataset.copy);
    showToast(ok ? t('toast.copied', { v: row.dataset.copy }) : t('toast.copyFail'));
  });

  /* 无障碍 */
  $('#audBg').addEventListener('input', renderAudit);
  $('#audSel').addEventListener('change', e => { state.auditId = e.target.value; renderAudit(); });
  $('#audCustom').addEventListener('input', debounce(renderAudit, 200));
  $('#btnStarImport').addEventListener('click', () => $('#starImportFile').click());
  $('#starImportFile').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const ids = Array.isArray(data) ? data
          : Array.isArray(data.palettes) ? data.palettes.map(x => typeof x === 'string' ? x : x.id)
          : [];
        let n = 0;
        for (const id of ids){ if (PAL(id) && !starred.has(id)){ starred.add(id); n++; } }
        saveStars(); renderLibrary();
        showToast(t('toast.favImported', { n }));
      } catch(err){ showToast(t('toast.importFail')); }
    };
    reader.readAsText(f);
    e.target.value = '';
  });
  const rc = () => renderContrast();
  $('#fgColor').addEventListener('input', rc);
  $('#bgColor').addEventListener('input', rc);
  $('#fixArea').addEventListener('click', e => {
    if (e.target.closest('#btnToScaleWorkshop')){
      state.scMode = 'contrast';
      $('#scBg').value = $('#bgColor').value;
      setScaleBase($('#fgColor').value, true);
      switchTab('scale');
      showToast(t('toast.importedWorkshop'));
      return;
    }
    const chip = e.target.closest('.fix-chip');
    if (!chip) return;
    const hex = chip.dataset.hex;
    if (chip.dataset.role === 'fg') $('#fgColor').value = hex; else $('#bgColor').value = hex;
    renderContrast();
    showToast(t('toast.applied', { hex, r: contrast($('#fgColor').value, $('#bgColor').value).toFixed(2) }));
  });
  $('#btnSwap').addEventListener('click', () => {
    const f = $('#fgColor').value, b = $('#bgColor').value;
    $('#fgColor').value = b; $('#bgColor').value = f;
    renderContrast();
  });
  $('#convInput').addEventListener('input', renderConv);
  $('#convText').addEventListener('change', e => {
    const rgb = hexToRgb(e.target.value);
    if (rgb){ $('#convInput').value = rgbToHex(...rgb); renderConv(); }
    else showToast(t('toast.invalidHex'));
  });
  document.body.addEventListener('click', async e => {
    const row = e.target.closest('.info-row[data-copy]');
    if (row){
      const ok = await copyText(row.dataset.copy);
      showToast(ok ? t('toast.copied', { v: row.dataset.copy }) : t('toast.copyFail'));
    }
  });

  /* 预览 */
  $('#pvSelect').addEventListener('change', e => { state.pv.id = e.target.value; state.pv.setIdx = 0; renderPreviewSelect(); renderPreview(); });
  $('#pvHue').addEventListener('change', e => { state.pv.hue = +e.target.value; renderPreview(); });
  $('#pvSet').addEventListener('change', e => { state.pv.setIdx = +e.target.value; renderPreview(); });
  $('#pvSim').addEventListener('change', e => { state.pv.sim = e.target.value; renderPreview(); });
  $('#pvCompare').addEventListener('change', e => { state.pv.compare = e.target.checked; renderPreview(); });
  $('#pvB').addEventListener('change', e => { state.pv.bId = e.target.value; if (state.pv.compare) renderPreview(); });

  /* 收藏夹导出 */
  $('#btnStarExport').addEventListener('click', () => {
    const list = [...starred].map(id => PAL(id)).filter(Boolean);
    if (!list.length){ showToast(t('toast.favEmpty')); return; }
    download('omnipalette-favorites.json', JSON.stringify({
      tool: 'ColorCat 全能配色工作台', exportedAt: new Date().toISOString(),
      count: list.length, palettes: list.map(p => JSON.parse(exportText(p, 'json'))),
    }, null, 2));
    showToast(t('toast.favExported', { n: list.length }));
  });

  /* 色阶工坊 */
  $('#scColorChip').addEventListener('input', e => setScaleBase(e.target.value, true));
  $('#scHex').addEventListener('input', e => {
    const v = e.target.value.trim();
    if (/^#?[0-9a-f]{6}$/i.test(v)) setScaleBase(v, true);
  });
  $('#scHex').addEventListener('keydown', e => { if (e.key === 'Enter') setScaleBase(e.target.value); });
  $('#btnScRandom').addEventListener('click', () =>
    setScaleBase(rgbToHex(...hslToRgb(Math.random() * 360, 55 + Math.random() * 35, 46 + Math.random() * 18))));
  $('#scMode').addEventListener('click', e => {
    const b = e.target.closest('.cat-chip');
    if (b){ state.scMode = b.dataset.mode; renderScale(); }
  });
  ['scBg', 'scCount', 'scMin', 'scMax'].forEach(id =>
    $('#' + id).addEventListener('input', () => { if (state.scMode === 'contrast') renderScale(); }));

  /* 渐变检查器 */
  ['gcA', 'gcM', 'gcB'].forEach(id => $('#' + id).addEventListener('input', renderGradientChecker));
  $('#btnGcRandom').addEventListener('click', () => {
    const rnd = () => rgbToHex(...hslToRgb(Math.random() * 360, 60 + Math.random() * 35, 45 + Math.random() * 25));
    ['gcA', 'gcM', 'gcB'].forEach(id => { $('#' + id).value = rnd(); });
    renderGradientChecker();
  });
  $('#tab-scale').addEventListener('click', async e => {
    const sw = e.target.closest('.sw');
    if (sw){
      const ok = await copyText(sw.dataset.hex);
      showToast(ok ? t('toast.copied', { v: sw.dataset.hex }) : t('toast.copyFail'));
      return;
    }
    const chip = e.target.closest('.dom-chip');
    if (chip){
      setScaleBase(chip.dataset.hex);
      tryGenHex(chip.dataset.hex, true);   // 与取色行为一致：同步配色生成器
    }
  });
  $('#tab-scale').addEventListener('dblclick', e => {
    const sw = e.target.closest('.sw');
    if (sw){
      const [h, s, l] = rgbToHsl(...hexToRgb(sw.dataset.hex));
      setGenBase(h, s, l, true);
      switchTab('generator');
      showToast(t('toast.toGenFromScale', { hex: sw.dataset.hex }));
    }
  });
  const dz = $('#scDropzone'), fi = $('#scFile');
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fi.click(); } });
  fi.addEventListener('change', e => {
    loadScaleImageFromBlob(e.target.files[0]);
  });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('dragover');
    loadScaleImageFromBlob(e.dataTransfer.files[0]);
  });
  scCanvas.addEventListener('click', e => {
    const rect = scCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(scCanvas.width - 1, Math.round((e.clientX - rect.left) * (scCanvas.width / rect.width))));
    const y = Math.max(0, Math.min(scCanvas.height - 1, Math.round((e.clientY - rect.top) * (scCanvas.height / rect.height))));
    const [r, g, b] = scCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
    setScaleBase(rgbToHex(r, g, b));
    tryGenHex(rgbToHex(r, g, b), true);   // 同步配色生成器
    showToast(t('toast.picked', { hex: rgbToHex(r, g, b) }));
  });
  $$('#tab-scale [data-sc-fmt]').forEach(b => b.addEventListener('click', async () => {
    const ok = await copyText(scaleExportText(b.dataset.scFmt));
    showToast(ok ? t('toast.copied', { v: '' }) : t('toast.copyFail'));
  }));
  $('#btnScDownload').addEventListener('click', () => {
    download('semantic-scale.css', scaleExportText('css'));
    showToast(t('toast.exported', { file: 'semantic-scale.css' }));
  });

  /* hash 路由（分享链接） */
  window.addEventListener('hashchange', routeFromHash);
}

/* ================= 初始化 ================= */
(function init(){
  applyStaticI18n();
  buildWheelGradient();
  buildGenCards();
  renderLibrary();
  renderGenPills();
  /* 首屏数据徽章（运行时统计，避免文案与数据漂移） */
  {
    const setCount = PALETTES.filter(p => p.sets).reduce((n, p) => n + p.sets.length, 0);
    const swatchCount = PALETTES.reduce((n, p) => {
      if (p.scales) return n + p.scales.reduce((m, s) => m + s.steps.length + (s.dark ? s.dark.length : 0), 0);
      if (p.colors) return n + p.colors.length;
      if (p.stops) return n + p.stops.length;
      if (p.schemes) return n + p.schemes.reduce((m, s) => m + Object.values(s.classes).reduce((x, c) => x + c.length, 0), 0);
      return n;
    }, 0);
    $('#heroStats').innerHTML =
      `<span class="stat-chip"><b>${PALETTES.length}</b> ${t('stat.palettes')}</span>` +
      `<span class="stat-chip"><b>${setCount.toLocaleString()}</b> ${t('stat.sets')}</span>` +
      `<span class="stat-chip"><b>${swatchCount.toLocaleString()}</b> ${t('stat.swatches')}</span>` +
      `<span class="stat-chip">${t('stat.offline')}</span>`;
  }
  bind();
  const langSel = $('#langSel');
  if (langSel) langSel.addEventListener('change', e => {
    try { localStorage.setItem('hub.lang', e.target.value); } catch(err){}
    showToast(t('toast.langSaved'));
    setTimeout(() => location.reload(), 400);
  });
  const hx = genHex();
  $('#genHex').value = hx; $('#genColorChip').value = hx;
  selectGenScheme(state.gen.wheelScheme);
  setGenBase(state.gen.h, state.gen.s, state.gen.l, true);
  $('#mhScheme').innerHTML = GEN_SCHEMES.map(s => `<option value="${s.id}">${t('scheme.' + s.id + '.n')}</option>`).join('');
  renderMh();
  renderContrast();
  renderConv();
  renderCvdStrip();
  renderPreviewSelect();
  renderPreview();
  renderScale();
  renderGradientChecker();
  renderAuditSelAndOut();
  routeFromHash();   // 支持 #/p/tailwind/4 形式的分享链接
})();
