/* esc() 注入 + brewerType 本地化 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 80).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

R('function t(key, params){',
`const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function t(key, params){`);

/* titleOf / descOf 出口转义（第三方数据防注入） */
R("function titleOf(p){\n  if (state.lang === 'zh') return p.cn;",
  "function titleOf(p){\n  if (state.lang === 'zh') return esc(p.cn);");
R("  const o = I18N[state.lang]['title.' + p.id];\n  return o || p.cn;\n}",
  "  const o = I18N[state.lang]['title.' + p.id];\n  return o ? esc(o) : esc(p.cn);\n}");
R("    return t('desc.curated', { theme: t('theme.' + p.name), n: p.sets.length });",
  "    return esc(t('desc.curated', { theme: t('theme.' + p.name), n: p.sets.length }));");
R("    return state.lang === 'zh' ? p.desc : t('desc.sci', { type: t('mapType.' + (p.mapType || '顺序')) });",
  "    return state.lang === 'zh' ? esc(p.desc) : esc(t('desc.sci', { type: t('mapType.' + (p.mapType || '顺序')) }));");
R("    return t('desc.cn', { fam: t('family.' + famKey), n: p.colors.length });",
  "    return esc(t('desc.cn', { fam: t('family.' + famKey), n: p.colors.length }));");
R("  if (state.lang === 'zh') return p.desc;\n  return I18N[state.lang]['desc.' + p.id] ?? I18N.en['desc.' + p.id] ?? p.desc;",
  "  if (state.lang === 'zh') return esc(p.desc);\n  return esc(I18N[state.lang]['desc.' + p.id] ?? I18N.en['desc.' + p.id] ?? p.desc);");

/* set 渲染处 s.name 转义（gradset 与 set 两个分支） */
R('<div class="set-name">${s.name} <span class="text-mini">${s.colors.length} 锚点</span>',
  '<div class="set-name">${esc(s.name)} <span class="text-mini">${t("detail.anchors", { n: s.colors.length })}</span>');
R('<div class="set-name">${s.name} <span class="text-mini">${s.colors.length} 色</span>',
  '<div class="set-name">${esc(s.name)} <span class="text-mini">${t("detail.nColors", { n: s.colors.length })}</span>');
/* swatch name/title 转义 */
R('const inner = (opts.name ? `<span class="nm" title="${opts.name}">${opts.name}</span>` : \'\')',
  'const inner = (opts.name ? `<span class="nm" title="${esc(opts.name)}">${esc(opts.name)}</span>` : \'\')');
R('data-hex="${hex}" title="${hex}${opts.name ? \' · \' + opts.name : \'}\'',
  'data-hex="${hex}" title="${hex}${opts.name ? \' · \' + esc(opts.name) : \'}\'');
/* brewer detail typeLabel 本地化 */
R('<b>${sch.name}</b><span>${p.typeLabel}</span>',
  '<b>${sch.name}</b><span>${t("brewerType." + p.brewerType)}</span>');
/* preview_roles brewer note 里的 typeLabel 同步 */
R("note = t('pv.nBrewer', { scheme: sch.name, n: cols.length, type: p.typeLabel.split('·')[0].trim() });",
  "note = t('pv.nBrewer', { scheme: sch.name, n: cols.length, type: t('brewerType.' + p.brewerType) });");

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
