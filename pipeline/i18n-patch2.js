/* 补丁二：剩余 13 处 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 80).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};
/* chips */
R('data-cat="${c.id}">${c.cn}${c.id === \'starred\'', 'data-cat="${c.id}">${t(\'cat.\' + c.id)}${c.id === \'starred\'');
/* empty */
R("</article>`).join('') || '<p class=\"text-muted\">没有匹配的色板，先去别的分类转转，或点击卡片右上角的 ☆ 收藏喜欢的色板。</p>';",
  "</article>`).join('') || `<p class=\"text-muted\">${t('lib.empty')}</p>`;");
/* set/gradset fmts */
R("    ? [['css', 'CSS 变量'], ['json', 'JSON'], ['figma', 'Figma Tokens']]",
  "    ? [['css', t('export.css')], ['json', t('export.json')], ['figma', t('export.figma')]]");
/* scale notes（6 空格缩进） */
R("      ? '基色明度过于极端（过亮或过暗），主色阶（9）的明度已调整到可用范围以保住文字/按钮的对比度；色相与色彩特征保留。'\n      : '基色锚定第 9 阶（主色），向两端展开明度曲线；极浅/极深阶超出 sRGB 色域时自动压缩色度（保明度保色相）。';",
  "      ? t('scale.noteClamped')\n      : t('scale.noteOk');");
/* renderFix aaOnly/noFix（无 style 前缀版） */
R("      ? `<div class=\"text-mini\">已达 AA。当前色相的明度已接近极限，想达 AAA 请换更深的背景（在下方背景拾色器调整）。</div>${recHtml}${workshopBtn}`\n      : `<div class=\"text-mini\">该色相与背景明度过近，保留色相无法达标——建议直接换用黑/白文字，或调整背景。</div>${recHtml}${workshopBtn}`) + note;",
  "      ? `<div class=\"text-mini\">${t('a11y.aaOnlyNote')}</div>${recHtml}${workshopBtn}`\n      : `<div class=\"text-mini\">${t('a11y.noFixNote')}</div>${recHtml}${workshopBtn}`) + note;");
/* toasts */
R("showToast(ok ? '已复制 ' + row.dataset.copy : '复制失败');", "showToast(ok ? t('toast.copied', { v: row.dataset.copy }) : t('toast.copyFail'));");
R("showToast(`已导出 ${list.length} 组收藏色板`);", "showToast(t('toast.favExported', { n: list.length }));");
fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
