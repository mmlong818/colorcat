/* 本轮增强：色名库升级 + 多色和谐 + 色卡图 + MCP 新工具 + i18n + 测试更新 */
const fs = require('fs');
const ROOT = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05';
let miss = 0, hit = 0;
const R = (p, pairs) => {
  let t = fs.readFileSync(p, 'utf8');
  for (const [o, n] of pairs) {
    if (!t.includes(o)) { console.log(p.split('/').pop(), 'MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; continue; }
    t = t.split(o).join(n); hit++;
  }
  fs.writeFileSync(p, t);
};

/* ========== 1. index.html ========== */
R(ROOT + '/color-hub/index.html', [
  // 色名库脚本
  ['<script src="i18n.js?v=', '<script src="color-names.js?v=20261116"></script>\n<script src="i18n.js?v='],
  // 多色和谐面板（插在生成器 controls 面板结束后、top-grid 之前）
  ['      <div class="top-grid">\n        <div>\n          <h2 data-i18n="gen.baseInfo">基础颜色信息</h2>',
`      <div class="top-grid">
        <div>
          <h2 data-i18n="gen.baseInfo">基础颜色信息</h2>`],
  ['        <p class="text-mini" data-i18n="gen.wheelHint">点击方案卡标题，可在色环中查看它的几何关系。</p>\n      </div>\n    </div>\n    <section id="genSchemeGrid"',
`        <p class="text-mini" data-i18n="gen.wheelHint">点击方案卡标题，可在色环中查看它的几何关系。</p>
      </div>
    </div>

    <div class="panel">
      <h2 data-i18n="mh.h">多色和谐配色</h2>
      <p class="text-mini" data-i18n="mh.hint">输入 2–3 个基色，选择和谐方案：每个基色的整套关系色合并去重——适合多主体/多品牌界面的统一配色。</p>
      <div class="controls">
        <input type="color" id="mh1" class="chip" value="#2563EB" aria-label="基色 1">
        <input type="color" id="mh2" class="chip" value="#D95A2B" aria-label="基色 2">
        <input type="color" id="mh3" class="chip" value="#0E9F6E" aria-label="基色 3">
        <select id="mhScheme" class="text-input" aria-label="和谐方案"></select>
        <button id="btnMh" class="btn btn-primary" type="button" data-i18n="mh.gen">生成联合配色</button>
      </div>
      <div id="mhOut" aria-live="polite"></div>
    </div>
    <section id="genSchemeGrid"`],
  // 详情操作加色卡图按钮
  ['<button type="button" class="btn btn-sm" id="btnDownloadExport">${t(\'btn.downloadFile\')}</button>',
   '<button type="button" class="btn btn-sm" id="btnDownloadExport">${t(\'btn.downloadFile\')}</button>'],
]);

/* 详情 actions 加色卡图（在导出 fmt 按钮后追加） */
{
  let t = fs.readFileSync(ROOT + '/color-hub/app.js', 'utf8');
  // 在 renderDetail 的 fmts 使用处追加“色卡图”按钮
  const old = "${fmts.map(([v, l]) => `<button type=\"button\" class=\"btn btn-sm\" data-fmt=\"${v}\">${l}</button>`).join('')}";
  if (!t.includes(old)) { console.log('card btn MISS'); miss++; }
  else { t = t.replace(old, old + '\n      <button type="button" class="btn btn-sm" id="btnCardPng" title="生成色卡图 PNG">${t(\'btn.card\')}</button>'); hit++; }
  fs.writeFileSync(ROOT + '/color-hub/app.js', t);
}

console.log(`phase1 done: ${hit}, ${miss} missed`);
