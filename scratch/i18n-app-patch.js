/* 一次性脚本：app.js 动态字符串 i18n 化（精确匹配，逐条报告） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 72).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* ---- state.lang ---- */
R("  pv: { id: 'tailwind', hue: 4, sim: 'none', compare: false, bId: 'material2', setIdx: 0 },",
  "  pv: { id: 'tailwind', hue: 4, sim: 'none', compare: false, bId: 'material2', setIdx: 0 },\n  lang: detectLang(),");

/* ---- CATS ---- */
R(`const CATS = [
  { id: 'all', cn: '全部' },
  { id: 'starred', cn: '★ 收藏' },
  { id: 'ui', cn: 'UI · 设计系统' },
  { id: 'viz', cn: '数据可视化' },
  { id: 'curated', cn: '策展合集' },
  { id: 'editor', cn: '编辑器主题' },
  { id: 'traditional', cn: '传统色' },
];`,
`const CATS = [
  { id: 'all' }, { id: 'starred' }, { id: 'ui' }, { id: 'viz' }, { id: 'curated' }, { id: 'editor' }, { id: 'traditional' },
];`);

/* ---- renderLibrary chips ---- */
R('data-cat="${c.id}">${c.cn}${c.id === \'starred\' && starred.size ? \' \' + starred.size : \'}',
  'data-cat="${c.id}">${t(\'cat.\' + c.id)}${c.id === \'starred\' && starred.size ? \' \' + starred.size : \'}');

/* ---- renderLibrary 卡片 ---- */
R('aria-label="打开 ${p.cn}">', 'aria-label="${t(\'lib.open\', { name: titleOf(p) })}">');
R('<span class="cn">${p.cn}</span>', '<span class="cn">${titleOf(p)}</span>');
R('title="${starred.has(p.id) ? \'取消收藏\' : \'收藏\'}" aria-label="${starred.has(p.id) ? \'取消收藏\' : \'收藏\'} ${p.cn}">${starred.has(p.id) ? \'★\' : \'☆\'}</button>',
  'title="${starred.has(p.id) ? t(\'lib.unstar\') : t(\'lib.star\')}" aria-label="${starred.has(p.id) ? t(\'lib.unstar\') : t(\'lib.star\')} ${titleOf(p)}">${starred.has(p.id) ? \'★\' : \'☆\'}</button>');
R('<div class="meta">${p.desc}</div>', '<div class="meta">${descOf(p)}</div>');
R("'</article>').join('') || '<p class=\"text-muted\">没有匹配的色板，先去别的分类转转，或点击卡片右上角的 ☆ 收藏喜欢的色板。</p>';",
  "'</article>').join('') || `<p class=\"text-muted\">${t('lib.empty')}</p>`;");

/* ---- renderDetail ---- */
R('<button type="button" class="btn btn-sm" id="btnBack">← 返回列表</button>',
  '<button type="button" class="btn btn-sm" id="btnBack">${t(\'btn.back\')}</button>');
R('<h2>${p.cn}</h2>', '<h2>${titleOf(p)}</h2>');
R('<p class="text-mini" style="margin:2px 0 4px">${p.desc}</p>',
  '<p class="text-mini" style="margin:2px 0 4px">${descOf(p)}</p>');
R('<button type="button" class="btn btn-sm btn-primary" id="btnApplyPreview">应用到应用预览 →</button>',
  '<button type="button" class="btn btn-sm btn-primary" id="btnApplyPreview">${t(\'btn.applyPreview\')}</button>');
R('<button type="button" class="btn btn-sm${starred.has(p.id) ? \' on\' : \'\'}" id="btnStar" title="${starred.has(p.id) ? \'取消收藏\' : \'收藏\'}">${starred.has(p.id) ? \'★ 已收藏\' : \'☆ 收藏\'}</button>',
  '<button type="button" class="btn btn-sm${starred.has(p.id) ? \' on\' : \'\'}" id="btnStar" title="${starred.has(p.id) ? t(\'lib.unstar\') : t(\'lib.star\')}">${starred.has(p.id) ? t(\'btn.unfav\') : t(\'btn.fav\')}</button>');
R("? [['css', 'CSS 变量'], ['json', 'JSON'], ['tailwind', 'Tailwind 配置'], ['figma', 'Figma Tokens'], ['theme', 'Tailwind v4 @theme']]",
  "? [['css', t('export.css')], ['json', t('export.json')], ['tailwind', t('export.tailwind')], ['figma', t('export.figma')], ['theme', t('export.theme')]]");
R(": [['css', 'CSS 变量'], ['json', 'JSON'], ['figma', 'Figma Tokens'], ['theme', 'Tailwind v4 @theme']];",
  ": [['css', t('export.css')], ['json', t('export.json')], ['figma', t('export.figma')], ['theme', t('export.theme')]];");
R(": [['css', 'CSS 变量'], ['json', 'JSON'], ['figma', 'Figma Tokens']];",
  ": [['css', t('export.css')], ['json', t('export.json')], ['figma', t('export.figma')]];");

/* multiscale 分支 */
R('<span>共 ${scale.steps.length} 阶 · 位置 1 = 最浅</span>',
  '<span>${t(\'detail.posFirst\', { n: scale.steps.length })}</span>');
R('浅色模式</button>', '${t(\'detail.modeLight\')}</button>');
R('深色模式</button>', '${t(\'detail.modeDark\')}</button>');
/* 显示对比度（4 处标签统一替换） */
R('> 显示对比度', '> ${t(\'detail.showContrast\')}');
/* multiscale 底部说明 */
R('<p class="text-mini" style="margin-top:10px">「白 4.6」表示该色与白色的对比度倍数（WCAG）；设计文字/背景时优先选择 ≥4.5 的组合。</p>',
  '<p class="text-mini" style="margin-top:10px">${t(\'detail.contrastHint\')}</p>');
/* brewer */
R('<label class="text-mini">色块数', '<label class="text-mini">${t(\'detail.brewerCount\')}');
R('${blindOk ? \'✓ 色盲安全\' : \'✗ 该档位未标注色盲安全\'}', '${blindOk ? t(\'detail.blindOk\') : t(\'detail.blindFail\')}');
R('${printOk ? \'✓ 打印安全\' : \'✗ 该档位未标注打印安全\'}', '${printOk ? t(\'detail.printOk\') : t(\'detail.printFail\')}');
/* map */
R('<b>采样色标（${p.stops.length} 档）</b>', '<b>${t(\'detail.sampled\', { n: p.stops.length })}</b>');
R("${p.mapType ? `<p class=\"text-mini\" style=\"margin-top:8px\">色图类型：${p.mapType}（顺序=数量渐变；发散=相对中心值的正负偏差；循环=角度/相位）。</p>` : ''}",
  "${p.mapType ? `<p class=\"text-mini\" style=\"margin-top:8px\">${t('detail.mapType', { type: p.mapType })}</p>` : ''}");
R("${p.license.includes('引用') ? `<div class=\"map-note\">学术使用请在论文方法部分按官方要求引用 Crameri 等人的原始文献（见 fabiocrameri.ch/colourmaps）。</div>` : ''}",
  "${p.license.includes('引用') ? `<div class=\"map-note\">${t('detail.cite')}</div>` : ''}");
/* set / gradset */
R('placeholder="在此包内搜索套名（共 ${p.sets.length} 套${shown.length !== p.sets.length ? `，匹配 ${shown.length} 套` : \'\'}）…" value="${state.setId || \'\'}"',
  'placeholder="${t(\'detail.setSearchPh\', { n: p.sets.length, more: shown.length !== p.sets.length ? t(\'detail.matched\', { n: shown.length }) : \'\' })}" value="${state.setId || \'\'}"');
R('${shown.length > 400 ? \'<p class="text-mini">匹配过多，仅显示前 400 套，请继续缩小搜索词。</p>\' : \'\'}',
  '${shown.length > 400 ? `<p class="text-mini">${t(\'detail.tooMany\')}</p>` : \'\'}');
R('<span class="text-mini">${s.colors.length} 锚点</span>', '<span class="text-mini">${t(\'detail.anchors\', { n: s.colors.length })}</span>');
R('<span class="text-mini">${s.colors.length} 色</span>', '<span class="text-mini">${t(\'detail.nColors\', { n: s.colors.length })}</span>');
R('<button type="button" class="btn btn-sm" id="btnCopyExport">复制</button>',
  '<button type="button" class="btn btn-sm" id="btnCopyExport">${t(\'btn.copy\')}</button>');
R('<button type="button" class="btn btn-sm" id="btnDownloadExport">下载文件</button>',
  '<button type="button" class="btn btn-sm" id="btnDownloadExport">${t(\'btn.downloadFile\')}</button>');

/* ---- swatchHtml ---- */
R('<span title="与白色的对比度">白${cw.toFixed(1)}</span><span title="与黑色的对比度">黑${cb.toFixed(1)}</span>',
  '<span title="与白色的对比度">${t(\'detail.w\')}${cw.toFixed(1)}</span><span title="与黑色的对比度">${t(\'detail.k\')}${cb.toFixed(1)}</span>');

/* ---- 生成器 ---- */
R('<h3 data-role="title" title="点击在色环中查看几何关系">${s.cn}<span class="en">${s.en}</span></h3>',
  '<h3 data-role="title" title="${t(\'gen.wheelHint\')}">${t(\'scheme.\' + s.id + \'.n\')}<span class="en">${s.en}</span></h3>');
R('<p class="theory"><b>原理</b>${s.principle}<br><b>特点</b>${s.trait}<br><b>适用</b>${s.usage}</p>',
  '<p class="theory"><b>${t(\'gen.theoryP\')}</b>${t(\'scheme.\' + s.id + \'.p\')}<br><b>${t(\'gen.theoryT\')}</b>${t(\'scheme.\' + s.id + \'.t\')}<br><b>${t(\'gen.theoryU\')}</b>${t(\'scheme.\' + s.id + \'.u\')}</p>');
R('<button type="button" class="btn btn-sm" data-act="copy">复制 HEX</button>',
  '<button type="button" class="btn btn-sm" data-act="copy">${t(\'gen.cardCopy\')}</button>');
R('<button type="button" class="btn btn-sm" data-act="json">导出 JSON</button>',
  '<button type="button" class="btn btn-sm" data-act="json">${t(\'gen.cardJson\')}</button>');
R('<button type="button" class="pill${s.id === state.gen.wheelScheme ? \' active\' : \'\'}" data-id="${s.id}" role="tab" aria-selected="${s.id === state.gen.wheelScheme}">${s.cn}</button>',
  '<button type="button" class="pill${s.id === state.gen.wheelScheme ? \' active\' : \'\'}" data-id="${s.id}" role="tab" aria-selected="${s.id === state.gen.wheelScheme}">${t(\'scheme.\' + s.id + \'.n\')}</button>');
R("['最近色名', hueName(state.gen.h, state.gen.s, state.gen.l)]", "['${t('gen.nearest')}'.replace('{','').replace('}',''), hueName(state.gen.h, state.gen.s, state.gen.l)]");

/* ---- renderScale ---- */
R("$('#scPanelTitle').textContent = contrastMode\n    ? '③ 对比度目标色阶（Leonardo 式生成）'\n    : '③ 语义色阶 · 12 阶（OKLCH 感知均匀生成）';",
  "$('#scPanelTitle').textContent = contrastMode ? t('scale.h3contrast') : t('scale.h3semantic');");
R("<div class=\"info-row\" style=\"cursor:default\"><span class=\"info-key\">主色（9）配按钮文字</span><span class=\"info-val\">白字 ${cw.toFixed(1)}:1 / 黑字 ${cb.toFixed(1)}:1 → 建议${cw >= cb ? '白字' : '黑字'}</span></div>",
  "<div class=\"info-row\" style=\"cursor:default\"><span class=\"info-key\">${t('scale.readMain')}</span><span class=\"info-val\">${t('scale.wText')} ${cw.toFixed(1)}:1 / ${t('scale.bText')} ${cb.toFixed(1)}:1 ${cw >= cb ? t('scale.suggestW') : t('scale.suggestB')}</span></div>");
R("<span class=\"info-key\">标题文字（12）在页面背景（1）上</span><span class=\"info-val\">${t12bg.toFixed(1)}:1 ${t12bg >= 4.5 ? 'AA ✓' + (t12bg >= 7 ? ' · AAA ✓' : '') : '✗ 未达标'}</span>",
  "<span class=\"info-key\">${t('scale.readT12')}</span><span class=\"info-val\">${t12bg.toFixed(1)}:1 ${t12bg >= 4.5 ? t('scale.aaOk') + (t12bg >= 7 ? ' · ' + t('aaaOk') : '') : t('scale.fail')}</span>");
R("<span class=\"info-key\">次要文字（11）在浅背景（2）上</span><span class=\"info-val\">${t11sub.toFixed(1)}:1 ${t11sub >= 4.5 ? 'AA ✓' : t11sub >= 3 ? '仅大字达标' : '✗ 未达标'}</span>",
  "<span class=\"info-key\">${t('scale.readT11')}</span><span class=\"info-val\">${t11sub.toFixed(1)}:1 ${t11sub >= 4.5 ? t('scale.aaOk') : t11sub >= 3 ? t('scale.aaOnly') : t('scale.fail')}</span>");
R("? '基色明度过于极端（过亮或过暗），主色阶（9）的明度已调整到可用范围以保住文字/按钮的对比度；色相与色彩特征保留。'\n    : '基色锚定第 9 阶（主色），向两端展开明度曲线；极浅/极深阶超出 sRGB 色域时自动压缩色度（保明度保色相）。';",
  "? t('scale.noteClamped')\n    : t('scale.noteOk');");
R("$('#scOklch').textContent = `基色 OKLCH：L ${och[0].toFixed(3)} · C ${och[1].toFixed(3)} · H ${och[2].toFixed(1)}°`;",
  "$('#scOklch').textContent = `${t('gen.base')} OKLCH：L ${och[0].toFixed(3)} · C ${och[1].toFixed(3)} · H ${och[2].toFixed(1)}°`;");
/* contrast 分支 readout */
R("<span class=\"info-key\">背景</span><span class=\"info-val\">${r.bg} · 目标对比度 ${r.detail[0].target.toFixed(1)}× → ${r.detail[r.detail.length - 1].target.toFixed(1)}×（几何分布）</span>",
  "<span class=\"info-key\">${t('scale.bgRead')}</span><span class=\"info-val\">${r.bg} · ${t('scale.targetRange', { a: r.detail[0].target.toFixed(1), b: r.detail[r.detail.length - 1].target.toFixed(1) })}</span>");
R("${missed === 0 ? '全部命中目标 ±0.05 ✓' : missed + ' 阶未完全命中（已取最接近值）'}",
  "${missed === 0 ? t('scale.solveHit') : t('scale.solveMiss', { n: missed })}");
R("<span class=\"info-key\">用途</span><span class=\"info-val\">每阶都是「在 ${r.bg} 上至少 ${r.detail[0] && r.detail[0].target.toFixed(1)}× 可辨」的实色，可直接当文字色/图标色用</span>",
  "<span class=\"info-key\">${t('scale.useCase')}</span><span class=\"info-val\">${t('scale.useCaseVal', { bg: r.bg, a: r.detail[0] && r.detail[0].target.toFixed(1) })}</span>");
R("? '保留基色色相，逐阶二分求解明度以命中目标对比度；色度已限制在文字可读范围内。'\n      : '部分高对比目标接近 sRGB 极限（黑/白），已返回可达到的最接近值；可下调最大对比度或更换背景。';",
  "? t('scale.noteContrastOk')\n      : t('scale.noteContrastMiss');");

/* ---- renderGradientChecker labels ---- */
R("const row = (sim, label) => `", "const CVD_LABELS = { none: t('cvd.none'), prot: t('cvd.prot'), deut: t('cvd.deut'), trit: t('cvd.trit') };\n  const row = (sim, label) => `");
R("${row('none', '正常视觉')}", "${row('none', CVD_LABELS.none)}");
R("${row('prot', '红色盲 Protanopia')}", "${row('prot', CVD_LABELS.prot)}");
R("${row('deut', '绿色盲 Deuteranopia')}", "${row('deut', CVD_LABELS.deut)}");
R("${row('trit', '蓝黄色盲 Tritanopia')}", "${row('trit', CVD_LABELS.trit)}");
R("? `<div class=\"map-note\">⚠ ${warns.join('<br>⚠ ')}</div>`\n      : '<div class=\"wcag-row\"><span class=\"wcag-pill pass\">✓ 明度过渡平滑，三类色盲视角下相邻段均可区分</span></div>'}",
  "? `<div class=\"map-note\">⚠ ${warns.join('<br>⚠ ')}</div>`\n      : `<div class=\"wcag-row\"><span class=\"wcag-pill pass\">${t('gc.smooth')}</span></div>`}");
R("name: 'L' + Ls[i].toFixed(2)", "name: t('gc.lLabel', { l: Ls[i].toFixed(2) })");
/* 警告文案：由引擎 warnings（中文）改为本地化 issues（若引擎提供） */
R("<p class=\"text-mini\">插值在 OKLab 空间进行（感知均匀），采样 ${GC_SAMPLES} 档并标注各档明度 L；检查逻辑参考开源工具 chroma.js Color Palette Helper 的思路。</p>",
  "<p class=\"text-mini\">${t('gc.interp')}</p>");

/* ---- renderContrast ---- */
R("const badge = (name, need) => `<span class=\"wcag-pill ${r >= need ? 'pass' : 'fail'}\">${name} ${r >= need ? '✓ 达标' : '✗ 未达标'}（≥${need}:1）</span>`;",
  "const badge = (name, need) => `<span class=\"wcag-pill ${r >= need ? 'pass' : 'fail'}\">${name} ${r >= need ? t('a11y.pass') : t('a11y.fail')}${t('a11y.need', { n: need })}</span>`;");
R("badge('正文 AA', 4.5) + badge('正文 AAA', 7) +\n    badge('大字 AA', 3) + badge('大字 AAA', 4.5) + badge('UI 组件', 3);",
  "badge(t('a11y.aaText'), 4.5) + badge(t('a11y.aaaText'), 7) +\n    badge(t('a11y.aaLarge'), 3) + badge(t('a11y.aaaLarge'), 4.5) + badge(t('a11y.uiText'), 3);");
R("<div class=\"t1\">正文文字 14px — The quick brown fox jumps over the lazy dog</div>\n    <div class=\"t2\">大号文字 19px Bold — 32px 以上视为大字</div>\n    <div class=\"t3\">次要文字与说明 · 按钮文字、图标、表单边框等 UI 组件同样受 3:1 约束</div>",
  "<div class=\"t1\">${t('a11y.sample1')}</div>\n    <div class=\"t2\">${t('a11y.sample2')}</div>\n    <div class=\"t3\">${t('a11y.sample3')}</div>");

/* ---- renderFix ---- */
R("area.innerHTML = '<div class=\"wcag-row\"><span class=\"wcag-pill pass\">✓ 组合已达 AAA，正文/大字/组件全部可用，无需调整</span></div>';\n    return;",
  "area.innerHTML = `<div class=\"wcag-row\"><span class=\"wcag-pill pass\">${t('a11y.allPass')}</span></div>`;\n    return;");
R("'调整前景达 AAA（保色相）'", "t('a11y.fixAaa')");
R("'调整前景达 AA（保色相）'", "t('a11y.fixAa')");
R('`改用${mono[2]}色文字`', "mono[2] === '白' ? t('a11y.fixMonoW') : t('a11y.fixMonoB')");
R("'调整背景达 AA（保色相）'", "t('a11y.fixBg')");
R("<div class=\"text-mini\" style=\"margin-bottom:6px\">修改方案（★ 为首选；保留原色相，明度由 OKLCH 求解，点击应用）：</div>",
  "<div class=\"text-mini\" style=\"margin-bottom:6px\">${t('a11y.fixHead')}</div>");
R("<div class=\"text-mini\" style=\"margin:10px 0 6px\">现成方案（内置设计系统色阶中色相最接近且对背景 ≥${target}:1 的颜色，点击应用为前景）：</div>",
  "<div class=\"text-mini\" style=\"margin:10px 0 6px\">${t('a11y.readyMade', { n: target })}</div>");
R('<div style="margin-top:10px"><button type="button" class="fix-chip" id="btnToScaleWorkshop" title="按当前前景/背景在色阶工坊用对比度目标模式生成整套色阶">按此组合生成整套达标色阶（去色阶工坊 →）</button></div>',
  '<div style="margin-top:10px"><button type="button" class="fix-chip" id="btnToScaleWorkshop" title="Scale Studio">${t(\'a11y.toWorkshop\')}</button></div>');
R("if (r < 4.5 && r >= 3) note = '<div class=\"text-mini\" style=\"margin-top:6px\">提示：当前对比度适合大字号文字（≥18.66px 粗体 / ≥24px）与图形组件，不适合正文。</div>';",
  "if (r < 4.5 && r >= 3) note = `<div class=\"text-mini\" style=\"margin-top:6px\">${t('a11y.bigOnly')}</div>`;");
R(": r >= 4.5\n      ? '<div class=\"text-mini\">已达 AA。当前色相的明度已接近极限，想达 AAA 请换更深的背景（在下方背景拾色器调整）。</div>'\n      : '<div class=\"text-mini\">该色相与背景明度过近，保留色相无法达标——建议直接换用黑/白文字，或调整背景。</div>') + note;",
  ": r >= 4.5\n      ? `<div class=\"text-mini\">${t('a11y.aaOnlyNote')}</div>`\n      : `<div class=\"text-mini\">${t('a11y.noFixNote')}</div>`) + note;");
/* recommendScaleColors 调用（renderFix 内）返回的 lib 名保持英文，无需改 */

/* ---- renderCvdStrip ---- */
R("const modes = [['none', '正常视觉'], ['prot', '红色盲 Protanopia'], ['deut', '绿色盲 Deuteranopia'], ['trit', '蓝黄色盲 Tritanopia'], ['gray', '灰度']];",
  "const modes = [['none', t('cvd.none')], ['prot', t('cvd.prot')], ['deut', t('cvd.deut')], ['trit', t('cvd.trit')], ['gray', t('cvd.gray')]];");

/* ---- buildPreviewModel notes ---- */
R("note = `单色相阶演示：界面角色取自「${hue.name}」色阶的不同明度位置（背景/表面/边框/强调/文字），分类色取自其它色相同一位置——这正是 Tailwind/Ant 等多阶色板的典型用法。`;",
  "note = t('pv.nMulti', { hue: hue.name });");
R("note = `整组主题色演示：背景取主题底色，文字取对比度最高的颜色，强调色取饱和度最高者——编辑器主题（Nord/Dracula 等）就是这样组织界面的。`;",
  "note = t('pv.nPalette');");
R("note = `渐变「${setName}」演示：柱状图按数值在 ${colors.length} 个锚点间做 OKLab 插值取色——渐变用作连续数据映射的正确方式（界面角色由锚点色推导）。`;",
  "note = t('pv.nGrad', { name: setName, n: colors.length });");
R("note = `策展色板「${setName}」（${colors.length} 色）演示：背景取最浅色，文字取与背景对比最高者，强调色取饱和度最高者。可在上方「套」下拉中切换同包的其它色板。`;",
  "note = t('pv.nCurated', { name: setName, n: colors.length });");
R("note = `ColorBrewer ${sch.name}（${cols.length} 类，${p.typeLabel.split('·')[0].trim()}）：在「色板库」中打开该色板并选择方案/色块数后，这里同步更新。`;",
  "note = t('pv.nBrewer', { scheme: sch.name, n: cols.length, type: p.typeLabel.split('·')[0].trim() });");
R("note = `连续色图（colormap）演示：柱状图按数值从色图中插值取色——这是科研可视化中 colormap 的正确用法（数值 → 颜色一一对应）。`;",
  "note = t('pv.nMap');");

/* ---- renderPreview ---- */
R("`<span class=\"li\"><i style=\"background:${cat[i % Math.max(1, cat.length)]}\"></i>系列 ${i + 1} · ${v}%</span>`",
  "`<span class=\"li\"><i style=\"background:${cat[i % Math.max(1, cat.length)]}\"></i>${t('pv.series', { n: i + 1, v })}</span>`");
R("<p class=\"text-mini\" style=\"margin-top:10px\">同一组数值、同一色觉模拟下的并排对比。A 的色相在上方「色相」下拉中选择；切换模拟类型可对比两种方案在色盲视角下的区分度。</p>",
  "<p class=\"text-mini\" style=\"margin-top:10px\">${t('pv.compareHint')}</p>");

/* ---- renderPreviewSelect / pvSelect options ---- */
R("const opts = sel => PALETTES.map(p => `<option value=\"${p.id}\" ${p.id === sel ? 'selected' : ''}>${p.cn}</option>`).join('');",
  "const opts = sel => PALETTES.map(p => `<option value=\"${p.id}\" ${p.id === sel ? 'selected' : ''}>${titleOf(p)}</option>`).join('');");

/* ---- heroStats ---- */
R("`<span class=\"stat-chip\"><b>${PALETTES.length}</b> 组色板</span>` +\n      `<span class=\"stat-chip\"><b>${setCount.toLocaleString()}</b> 套现成配色</span>` +\n      `<span class=\"stat-chip\"><b>${swatchCount.toLocaleString()}</b> 个色块</span>` +\n      `<span class=\"stat-chip\">纯前端 · 离线可用</span>`",
  "`<span class=\"stat-chip\"><b>${PALETTES.length}</b> ${t('stat.palettes')}</span>` +\n      `<span class=\"stat-chip\"><b>${setCount.toLocaleString()}</b> ${t('stat.sets')}</span>` +\n      `<span class=\"stat-chip\"><b>${swatchCount.toLocaleString()}</b> ${t('stat.swatches')}</span>` +\n      `<span class=\"stat-chip\">${t('stat.offline')}</span>`");

/* ---- applyTheme ---- */
R("btnTheme.textContent = t === 'dark' ? '浅色' : '深色';",
  "btnTheme.textContent = t === 'dark' ? I18N[state.lang]['theme.toLight'] : I18N[state.lang]['theme.toDark'];");

/* ---- toasts ---- */
R("showToast(starred.has(id) ? '已收藏 ' + (PAL(id) || {}).cn : '已取消收藏');",
  "showToast(starred.has(id) ? t('toast.fav', { name: titleOf(PAL(id) || {}) }) : t('toast.unfav'));");
R("showToast('已复制 ' + sw.dataset.hex)", "showToast(t('toast.copied', { v: sw.dataset.hex }))");
R("showToast(ok ? '已复制' : '复制失败')", "showToast(ok ? t('toast.copied', { v: '' }) : t('toast.copyFail'))");
R("showToast('已应用 ' + hex + '（当前 ' + contrast($('#fgColor').value, $('#bgColor').value).toFixed(2) + ':1）')",
  "showToast(t('toast.applied', { hex, r: contrast($('#fgColor').value, $('#bgColor').value).toFixed(2) }))");
R("showToast('已将 ' + sw.dataset.hex + ' 设为生成器基色')", "showToast(t('toast.toGen', { hex: sw.dataset.hex }))");
R("showToast(sw.dataset.hex + ' 已设为配色生成器基色')", "showToast(t('toast.toGenFromScale', { hex: sw.dataset.hex }))");
R("showToast('已复制 ' + row.dataset.copy)", "showToast(t('toast.copied', { v: row.dataset.copy }))");
R("showToast('已生成 11 组方案 · 基色 ' + hx)", "showToast(t('toast.generated', { hex: hx }))");
R("showToast('基色已更新为 ' + genHex())", "showToast(t('toast.baseUpdated', { hex: genHex() }))");
R("showToast('无法识别的颜色，如 #3B82F6')", "showToast(t('toast.invalidHex'))");
R("showToast('无法识别的颜色')", "showToast(t('toast.invalidHex'))");
R("showToast('色阶已更新 · 基色 ' + state.scaleHex)", "showToast(t('toast.scaleUpdated', { hex: state.scaleHex }))");
R("showToast('已加载图片，点击画面取色')", "showToast(t('toast.imgLoaded'))");
R("showToast('图片加载失败')", "showToast(t('toast.imgFail'))");
R("showToast('请选择图片文件')", "showToast(t('toast.needImage'))");
R("showToast('请拖入图片文件')", "showToast(t('toast.needDropImage'))");
R("showToast('取色 ' + rgbToHex(r, g, b) + ' · 色阶与生成器已同步')",
  "showToast(t('toast.picked', { hex: rgbToHex(r, g, b) }))");
R("showToast('已下载 ' + p.id + '.' + ext)", "showToast(t('toast.exported', { file: p.id + '.' + ext }))");
R("showToast('已应用到预览：' + p.cn)", "showToast(t('toast.appliedPreview', { name: titleOf(p) }))");
R("showToast('已带入色阶工坊（对比度目标模式），按当前前景/背景生成整套色阶')",
  "showToast(t('toast.importedWorkshop'))");
R("showToast('已导出 ' + list.length + ' 组收藏色板')", "showToast(t('toast.favExported', { n: list.length }))");
R("showToast('收藏夹是空的')", "showToast(t('toast.favEmpty'))");
R("showToast(ok ? `已复制 ${hexes.length} 个色值` : '复制失败')", "showToast(ok ? t('toast.schemeCopied', { n: hexes.length }) : t('toast.copyFail'))");
R("showToast('已下载 ' + sch.en + '-palette.json')", "showToast(t('toast.exported', { file: sch.en + '-palette.json' }))");
R("showToast('基色已更新为 ' + sw.dataset.hex)", "showToast(t('toast.baseUpdated', { hex: sw.dataset.hex }))");
R("showToast('无法识别的颜色，请输入如 #3B82F6')", "showToast(t('toast.invalidHex'))");
R("showToast('已复制 ' + val)", "showToast(t('toast.copied', { v: val }))");
R("showToast(ok ? '已复制 ' + sw.dataset.hex : '复制失败')", "showToast(ok ? t('toast.copied', { v: sw.dataset.hex }) : t('toast.copyFail'))");
R("showToast(ok ? '已复制' : '复制失败');\n  }));", "showToast(ok ? t('toast.copied', { v: '' }) : t('toast.copyFail'));\n  }));");
R("showToast('已下载 semantic-scale.css')", "showToast(t('toast.exported', { file: 'semantic-scale.css' }))");
R("showToast('取色 ' + rgbToHex(r, g, b))", "showToast(t('toast.picked', { hex: rgbToHex(r, g, b) }))");
R("showToast('语言已切换，正在刷新…')", "showToast(t('toast.langSaved'))");

/* ---- init: applyStaticI18n + langSel ---- */
R("(function init(){\n  buildWheelGradient();", "(function init(){\n  applyStaticI18n();\n  buildWheelGradient();");
R("  const hx = genHex();\n  $('#genHex').value = hx; $('#genColorChip').value = hx;",
  "  const langSel = $('#langSel');\n  if (langSel) langSel.addEventListener('change', e => {\n    try { localStorage.setItem('hub.lang', e.target.value); } catch(err){}\n    showToast(t('toast.langSaved'));\n    setTimeout(() => location.reload(), 400);\n  });\n  const hx = genHex();\n  $('#genHex').value = hx; $('#genColorChip').value = hx;");

/* ---- renderPreviewSelect 后再刷 langSel（applyStaticI18n 只在 init 跑） ---- */

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
