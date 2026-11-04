/* server.js: import MCU + generate_m3 工具 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/server.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

R("import * as E from './engine.js';",
  "import * as E from './engine.js';\nimport MCU from './hct.js';");

const anchor = '/* ---------- 8. simulate_vision ---------- */';
if (!t.includes(anchor)) { console.log('anchor missing'); process.exit(1); }
const tool = `/* ---------- 7c. generate_m3 ---------- */
server.registerTool('generate_m3', {
  title: '生成 Material 3 主题',
  description: '从任意品牌色用官方 HCT 色彩空间生成 Material 3 动态主题：6 组音调色板（primary/secondary/tertiary/neutral/neutralVariant/error，各 13 档）+ 亮/暗 scheme 关键 token。色彩数学来自 Google 官方 material-color-utilities (Apache-2.0)。',
  inputSchema: {
    source: z.string().describe('品牌色/来源色'),
  },
}, async ({ source }) => {
  const hex = E.parseColor(source);
  if (!hex) return err('无法解析颜色: ' + source);
  const src = MCU.Hct.fromInt(MCU.argbFromHex(hex));
  const H = src.hue, C = Math.max(src.chroma, 48);
  const up = a => MCU.hexFromArgb(a).toUpperCase();
  const palettes = {
    primary: MCU.TonalPalette.fromHueAndChroma(H, C),
    secondary: MCU.TonalPalette.fromHueAndChroma(H, 16),
    tertiary: MCU.TonalPalette.fromHueAndChroma((H + 60) % 360, 24),
    neutral: MCU.TonalPalette.fromHueAndChroma(H, 4),
    neutralVariant: MCU.TonalPalette.fromHueAndChroma(H, 8),
    error: MCU.TonalPalette.fromHueAndChroma(25, 84),
  };
  const TONES = [100, 95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0];
  const tone = (pal, tn) => tone2(pal, tn);
  function tone2(pal, tn){ return up(MCU.hexFromArgb(pal.tone(tn))); }
  const out = {};
  for (const [k, pal] of Object.entries(palettes)){
    out[k] = TONES.map(tn => ({ tone: tn, hex: tone(pal, tn) }));
  }
  const scheme = {
    light: {
      primary: tone(palettes.primary, 40), onPrimary: tone(palettes.primary, 100),
      primaryContainer: tone(palettes.primary, 90), onPrimaryContainer: tone(palettes.primary, 10),
      secondary: tone(palettes.secondary, 40), tertiary: tone(palettes.tertiary, 40),
      error: tone(palettes.error, 40), surface: tone(palettes.neutral, 98),
      onSurface: tone(palettes.neutral, 10), surfaceVariant: tone(palettes.neutralVariant, 90),
      onSurfaceVariant: tone(palettes.neutralVariant, 30),
    },
    dark: {
      primary: tone(palettes.primary, 80), onPrimary: tone(palettes.primary, 20),
      primaryContainer: tone(palettes.primary, 30), onPrimaryContainer: tone(palettes.primary, 90),
      secondary: tone(palettes.secondary, 80), tertiary: tone(palettes.tertiary, 80),
      error: tone(palettes.error, 80), surface: tone(palettes.neutral, 6),
      onSurface: tone(palettes.neutral, 90), surfaceVariant: tone(palettes.neutralVariant, 30),
      onSurfaceVariant: tone(palettes.neutralVariant, 80),
    },
  };
  return ok({
    source: hex,
    hct: { hue: +H.toFixed(1), chroma: +C.toFixed(1), tone: src.tone.toFixed(1) },
    palettes: out, scheme,
  });
});

`;
R(anchor, tool + anchor);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
