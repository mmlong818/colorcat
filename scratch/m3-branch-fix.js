/* 修正 renderScale 分支：m3 渲染块移到首分支，删除空分支与重复块 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* A. 空分支 → 真正的 m3 渲染（提前 return，不再落入 else 的语义渲染） */
R(`  let r;
  if (m3Mode){ /* handled above */ } else if (contrastMode){`,
`  let r;
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
  } else if (contrastMode){`);

/* B. 删除后面的重复 m3 块 */
R(`  } else if (m3Mode) {
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
  } else {`,
`  } else {`);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
