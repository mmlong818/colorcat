/* index.html：审计面板 + 收藏导入按钮 + dropzone 键盘可达 + 版本号 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/index.html';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 76).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* 审计面板：插在色盲模拟对照面板之后（a11y tab 末尾） */
R(`    <p class="text-mini" data-i18n="a11y.cvdHint">同一组示例色（取自当前色板库第一个 UI 色板）在各类色觉下的呈现。用它可以快速判断你的配色方案是否「撞色」。</p>
    <div class="cvd-strip" id="cvdStrip"></div>
  </div>`,
`    <p class="text-mini" data-i18n="a11y.cvdHint">同一组示例色（取自当前色板库第一个 UI 色板）在各类色觉下的呈现。用它可以快速判断你的配色方案是否「撞色」。</p>
    <div class="cvd-strip" id="cvdStrip"></div>
  </div>

  <div class="panel">
    <h2 data-i18n="a11y.auditTitle">批量对比度审计</h2>
    <p class="text-mini" data-i18n="a11y.auditHint">选一个背景色和一批颜色（来自色板或自定义），逐个判定正文 / 大字 / UI 三档是否达标——快速找出整套色阶里哪些能当文字色。</p>
    <div class="controls">
      <label class="text-mini"><span data-i18n="a11y.bgC">背景</span><input type="color" id="audBg" class="chip" value="#FFFFFF" aria-label="背景色"></label>
      <label class="text-mini"><span data-i18n="a11y.auditPalette">从色板</span>
        <select id="audSel" class="text-input" aria-label="审计色板"></select>
      </label>
    </div>
    <textarea id="audCustom" class="text-input" style="width:100%;min-height:52px" data-i18n-ph="a11y.auditCustom" placeholder="#FF0000（每行一个，可选）" aria-label="自定义颜色"></textarea>
    <div id="audOut" aria-live="polite" style="margin-top:10px"></div>
  </div>`);

/* 收藏导入按钮（放在导出收藏夹旁） */
R(`<button id="btnStarExport" class="btn" type="button" hidden title="导出全部收藏色板的 JSON">导出收藏夹</button>`,
`<button id="btnStarExport" class="btn" type="button" hidden title="导出全部收藏色板的 JSON" data-i18n="lib.exportFav">导出收藏夹</button>
      <button id="btnStarImport" class="btn" type="button" data-i18n="lib.importFav">导入收藏</button>
      <input type="file" id="starImportFile" accept=".json,application/json" hidden>`);

/* dropzone 键盘可达 */
R(`<div id="scDropzone" class="dropzone">`,
`<div id="scDropzone" class="dropzone" role="button" tabindex="0" aria-label="上传图片">`);

/* 版本号 */
t = t.split('?v=20261109').join('?v=20261110');
if (!t.includes('app.js?v=20261110')) {
  // 兜底：替换任意旧版本号
  t = t.replace(/app\.js\?v=\d+/g, 'app.js?v=20261110');
  t = t.replace(/palettes\.js\?v=\d+/g, 'palettes.js?v=20261110');
  t = t.replace(/i18n\.js\?v=\d+/g, 'i18n.js?v=20261110');
  t = t.replace(/style\.css\?v=\d+/g, 'style.css?v=20261110');
}

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
