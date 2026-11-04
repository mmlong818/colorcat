/* app.js：M3 模式分支（genM3 + 渲染 + mc3 控件隐藏逻辑调整） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* genM3：官方 MCU 打包的 HCT 推导 */
R('/* ================= 批量对比度审计 ================= */',
`/* ================= M3 动态主题（官方 HCT 引擎） ================= */
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

/* ================= 批量对比度审计 ================= */`);

/* renderScale：mc3 控件隐藏 + m3 分支 */
R("  $('#scContrastCtrls').hidden = !contrastMode;\n  $('#scPanelTitle').textContent = contrastMode ? t('scale.h3contrast') : t('scale.h3semantic');",
`  const m3Mode = state.scMode === 'm3';
  $('#scContrastCtrls').hidden = !contrastMode;
  $('#scPanelTitle').textContent = contrastMode ? t('scale.h3contrast') : m3Mode ? t('scale.h3m3') : t('scale.h3semantic');
  $$('#scMode .cat-chip').forEach(b => b.classList.toggle('active', b.dataset.mode === state.scMode));`);
R("  $$('#scMode .cat-chip').forEach(b => b.classList.toggle('active', b.dataset.mode === state.scMode));\n  const och = srgbToOklch(state.scaleHex);",
"  const och = srgbToOklch(state.scaleHex);");

/* renderScale 尾部 m3 分支（在 else { semantic } 之后加 else if (m3Mode)） */
R("  } else {\n    $('#scSteps').innerHTML = r.steps.map((h, i) => swatchHtml(h, { name: (i + 1) + '·' + SCALE_ROLES[i] })).join('');",
`  } else if (m3Mode) {
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
  } else {
    $('#scSteps').innerHTML = r.steps.map((h, i) => swatchHtml(h, { name: (i + 1) + '·' + SCALE_ROLES[i] })).join('');`);

/* contrast 分支只在 contrast 模式下进入（原 else if 结构保持）：把 `if (contrastMode){` 保持，m3 已在其前 return */
R("  let r;\n  if (contrastMode){", "  let r;\n  if (m3Mode){ /* handled above */ } else if (contrastMode){");

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
