/* 修复 mh 面板插入造成的结构错乱：移除错位块 → 在正确位置插入 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/index.html';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* 1. 移除错位的 mh 面板（连同我多打的两个闭合 div） */
const badStart = `          <p class="text-mini" data-i18n="gen.wheelHint">点击方案卡标题，可在色环中查看它的几何关系。</p>
      </div>
    </div>

    <div class="panel">
      <h2 data-i18n="mh.h">多色和谐配色</h2>`;
const mhEnd = `      <div id="mhOut" aria-live="polite"></div>
    </div>
        </div>
        <div>`;
const si = t.indexOf(badStart);
if (si >= 0) {
  const ei = t.indexOf(mhEnd, si);
  if (ei >= 0) {
    t = t.slice(0, si) + `          <p class="text-mini" data-i18n="gen.wheelHint">点击方案卡标题，可在色环中查看它的几何关系。</p>
        </div>
        <div>` + t.slice(ei + mhEnd.length);
    hit++;
    console.log('removed mangled block');
  } else { console.log('mhEnd not found'); miss++; }
} else {
  console.log('badStart not found — 检查是否已是正确结构');
}

/* 2. 在 genSchemeGrid 前插入 mh 面板（作为 generator 内独立 panel） */
const mhPanel = `    <div class="panel">
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

    <section id="genSchemeGrid"`;
R('    <section id="genSchemeGrid"', mhPanel);

/* 3. 版本号统一 */
t = t.replace(/app\.js\?v=[\d]+/g, 'app.js?v=20261116');
t = t.replace(/engine\.js\?v=[\d]+/g, 'engine.js?v=20261116');
t = t.replace(/i18n\.js\?v=[\d]+/g, 'i18n.js?v=20261116');
t = t.replace(/style\.css\?v=[\d]+/g, 'style.css?v=20261116');
t = t.replace(/palettes\.js\?v=[\d]+/g, 'palettes.js?v=20261116');
t = t.replace(/hct\.js\?v=[\d]+/g, 'hct.js?v=20261116');
t = t.replace(/color-names\.js\?v=[\d]+/g, 'color-names.js?v=20261116');

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
