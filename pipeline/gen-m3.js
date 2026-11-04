/* gen-m3.js — 用 Google 官方 material-color-utilities (Apache-2.0) 从基线主色
 * 生成 Material Design 3 的 6 组官方音调色板，输出 m3-tonal.json 供 transform.js 使用 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const pkgUrl = pathToFileURL(path.join(__dirname, 'dl', 'mcu-pkg', 'package', 'index.js')).href;
  const mcu = await import(pkgUrl);
  const { themeFromSourceColor, argbFromHex, hexFromArgb } = mcu;

  const theme = themeFromSourceColor(argbFromHex('#6750A4'));
  const TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  const names = { primary: 'Primary 主色', secondary: 'Secondary 次色', tertiary: 'Tertiary 第三色', neutral: 'Neutral 中性', neutralVariant: 'Neutral Variant 中性变体', error: 'Error 错误' };
  const out = { source: '#6750A4', palettes: {} };
  for (const [key, pal] of Object.entries(theme.palettes)) {
    out.palettes[key] = {
      label: names[key] || key,
      tones: TONES.map(t => ({ tone: t, hex: hexFromArgb(pal.tone(t)).toUpperCase() })),
    };
  }
  fs.writeFileSync(path.join(__dirname, 'dl', 'm3-tonal.json'), JSON.stringify(out, null, 1));
  console.log('m3-tonal.json 写出:', Object.keys(out.palettes).join(', '));
  console.log('primary tone40 =', out.palettes.primary.tones.find(t => t.tone === 40).hex, '(官方基线应为 #6750A4)');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
