/* i18n: M3 模式键（5 语言） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/i18n.js';
let t = fs.readFileSync(p, 'utf8');
const KEYS = {
  zh: [
    "  'scale.modeM3': 'M3 主题生成（HCT）',",
    "  'scale.h3m3': '③ M3 动态主题 · 从品牌色生成（HCT 色彩空间）',",
    "  'scale.m3Light': '浅色 scheme', 'scale.m3Dark': '深色 scheme',",
    "  'scale.m3Note': '使用 HCT（感知色相/色度/音调）从品牌色推导 6 组音调色板与 Material 3 亮/暗 scheme 关键 token；色彩数学打包自官方 material-color-utilities（Apache-2.0）。',",
    "  'scale.m3Tone': 'T{t}', 'm3.tPrimary': 'Primary 主色', 'm3.tSecondary': 'Secondary 次色', 'm3.tTertiary': 'Tertiary 第三色', 'm3.tNeutral': 'Neutral 中性', 'm3.tNeutralVariant': 'Neutral Variant 中性变体', 'm3.tError': 'Error 错误',",
  ],
  en: [
    "  'scale.modeM3': 'M3 theme (HCT)',",
    "  'scale.h3m3': '③ M3 dynamic theme from a brand color (HCT color space)',",
    "  'scale.m3Light': 'Light scheme', 'scale.m3Dark': 'Dark scheme',",
    "  'scale.m3Note': 'Six tonal palettes and Material 3 light/dark scheme key tokens derived from a brand color in HCT space; color math bundled from the official material-color-utilities (Apache-2.0).',",
    "  'scale.m3Tone': 'T{t}', 'm3.tPrimary': 'Primary', 'm3.tSecondary': 'Secondary', 'm3.tTertiary': 'Tertiary', 'm3.tNeutral': 'Neutral', 'm3.tNeutralVariant': 'Neutral Variant', 'm3.tError': 'Error',",
  ],
  fr: [
    "  'scale.modeM3': 'Thème M3 (HCT)',",
    "  'scale.h3m3': '③ Thème dynamique M3 depuis une couleur de marque (espace HCT)',",
    "  'scale.m3Light': 'Schéma clair', 'scale.m3Dark': 'Schéma sombre',",
    "  'scale.m3Note': 'Six palettes tonales et tokens clés du schéma M3 clair/sombre dérivés en espace HCT ; math embarquée depuis material-color-utilities officiel (Apache-2.0).',",
    "  'scale.m3Tone': 'T{t}', 'm3.tPrimary': 'Primary', 'm3.tSecondary': 'Secondary', 'm3.tTertiary': 'Tertiary', 'm3.tNeutral': 'Neutral', 'm3.tNeutralVariant': 'Neutral Variant', 'm3.tError': 'Error',",
  ],
  ru: [
    "  'scale.modeM3': 'M3-тема (HCT)',",
    "  'scale.h3m3': '③ Динамическая M3-тема из цвета бренда (пространство HCT)',",
    "  'scale.m3Light': 'Светлая схема', 'scale.m3Dark': 'Тёмная схема',",
    "  'scale.m3Note': 'Шесть тональных палитр и ключевые токены светлой/тёмной схемы M3 выводятся в пространстве HCT; математика из официального material-color-utilities (Apache-2.0).',",
    "  'scale.m3Tone': 'T{t}', 'm3.tPrimary': 'Primary', 'm3.tSecondary': 'Secondary', 'm3.tTertiary': 'Tertiary', 'm3.tNeutral': 'Neutral', 'm3.tNeutralVariant': 'Neutral Variant', 'm3.tError': 'Error',",
  ],
  ja: [
    "  'scale.modeM3': 'M3 テーマ生成（HCT）',",
    "  'scale.h3m3': '③ M3 ダイナミックテーマ · ブランド色から生成（HCT 色空間）',",
    "  'scale.m3Light': 'ライトスキーム', 'scale.m3Dark': 'ダークスキーム',",
    "  'scale.m3Note': 'HCT（知覚色相/彩度/トーン）でブランド色から 6 組のトーナルパレットと Material 3 のライト/ダークスキーム主要トークンを導出。色彩数学は公式 material-color-utilities（Apache-2.0）からバンドル。',",
    "  'scale.m3Tone': 'T{t}', 'm3.tPrimary': 'Primary 主色', 'm3.tSecondary': 'Secondary 次色', 'm3.tTertiary': 'Tertiary 第三色', 'm3.tNeutral': 'Neutral 中性', 'm3.tNeutralVariant': 'Neutral Variant 中性変体', 'm3.tError': 'Error エラー',",
  ],
};
for (const [loc, blockLines] of Object.entries(KEYS)) {
  const start = t.indexOf(`\n${loc}: {`);
  if (start < 0) { console.log(loc, 'LOCALE MISSING'); continue; }
  const gi = t.indexOf("'scale.modeSemantic':", start);
  if (gi < 0) { console.log(loc, 'anchor missing'); continue; }
  const le = t.indexOf('\n', gi);
  t = t.slice(0, le) + '\n' + blockLines.join('\n') + t.slice(le);
  console.log(loc, 'inserted');
}
fs.writeFileSync(p, t);
