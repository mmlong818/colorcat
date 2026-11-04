/* app.js：审计渲染 + 收藏导入 + 防抖 + EXIF + tooltip/aria i18n（v2 干净版） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* ---- 防抖工具 ---- */
R('async function copyText(t){',
`const debounce = (fn, ms = 150) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
async function copyText(t){`);

/* ---- swatch tooltip i18n ---- */
R('<span title="与白色的对比度">', '<span title="${t(\'a11y.titleW\')}">');
R('<span title="与黑色的对比度">', '<span title="${t(\'a11y.titleK\')}">');
R(' · 点击复制">${inner}</button>`;', ' · ${t(\'lib.copyHint\')}" aria-label="${hex}${opts.name ? \' \' + esc(opts.name) : \'\'} · ${t(\'lib.copyHint\')}">${inner}</button>`;');

/* ---- 批量审计渲染（插在应用预览区之前） ---- */
R('/* ================= 应用预览 ================= */',
`/* ================= 批量对比度审计 ================= */
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
  const custom = (customEl ? customEl.value : '').split(/[\\n,;]+/)
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

/* ================= 应用预览 ================= */`);

/* ---- state.auditId ---- */
R("  scMode: 'semantic',      // 色阶工坊模式：semantic | contrast",
`  scMode: 'semantic',      // 色阶工坊模式：semantic | contrast
  auditId: 'tailwind',     // 批量审计选中的色板`);

/* ---- 绑定 ---- */
R('  /* 无障碍 */\n  const rc = () => renderContrast();',
`  /* 无障碍 */
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
  const rc = () => renderContrast();`);

/* dropzone 键盘 */
R("  const dz = $('#scDropzone'), fi = $('#scFile');\n  dz.addEventListener('click', () => fi.click());",
`  const dz = $('#scDropzone'), fi = $('#scFile');
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fi.click(); } });`);

/* EXIF：drop/change 都走 Blob 入口 */
R("    const f = e.dataTransfer.files[0];\n    if (f && f.type.startsWith('image/')){\n      const reader = new FileReader();\n      reader.onload = ev => loadScaleImageSrc(ev.target.result);\n      reader.readAsDataURL(f);\n    } else showToast(t('toast.needDropImage'));\n  });",
"    loadScaleImageFromBlob(e.dataTransfer.files[0]);\n  });");
R("    const f = e.target.files[0];\n    if (f && f.type.startsWith('image/')){\n      const reader = new FileReader();\n      reader.onload = ev => loadScaleImageSrc(ev.target.result);\n      reader.readAsDataURL(f);\n    } else showToast(t('toast.needImage'));\n  });",
"    loadScaleImageFromBlob(e.target.files[0]);\n  });");

/* loadScaleImageFromBlob + bitmap 版绘制 */
R('function loadScaleImageSrc(src){',
`async function loadScaleImageFromBlob(file){
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
function loadScaleImageSrc(src){`);

/* ---- 搜索防抖 ---- */
R("  $('#libSearch').addEventListener('input', e => { state.search = e.target.value; renderLibrary(); });",
"  $('#libSearch').addEventListener('input', debounce(e => { state.search = e.target.value; renderLibrary(); }, 150));");
R("  if (setSearch) setSearch.addEventListener('input', e => { state.setId = e.target.value; renderDetail(); $('#setSearch').focus(); });",
"  if (setSearch) setSearch.addEventListener('input', debounce(e => { state.setId = e.target.value; renderDetail(); const s2 = document.getElementById('setSearch'); if (s2) s2.focus(); }, 200));");

/* ---- init ---- */
R('  renderScale();\n  renderGradientChecker();',
'  renderScale();\n  renderGradientChecker();\n  renderAuditSelAndOut();');
R("  applyTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));",
`  applyTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  applyThemeLabel();`);

/* applyThemeLabel 函数（语言/主题文案） */
R("/* ================= Tab 切换 ================= */",
`function applyThemeLabel(){
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = document.documentElement.dataset.theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
}

/* ================= Tab 切换 ================= */`);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
