/* MCP：12 工具描述补英文 + 新增 sample_colormap 工具 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/server.js';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 90).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

/* —— 双语描述（zh 换行 + EN） —— */
R("description: '在 125 组内置开源色板中检索",
  "description: 'Search 127 built-in open-source palettes (UI design systems / scientific colormaps / curated packs / editor themes / traditional colors). 在 127 组内置开源色板中检索");
R("类别：ui=设计系统, viz=数据可视化/学术色图, curated=策展合集(宝可梦/吉卜力/大都会等65包), editor=编辑器主题, traditional=中日传统色',",
  "Categories: ui=design systems, viz=scientific colormaps, curated=65 themed packs (Pokémon/Ghibli/Met Museum...), editor=editor themes, traditional=Chinese & Japanese traditional colors. 类别：ui=设计系统, viz=数据可视化, curated=策展合集, editor=编辑器主题, traditional=传统色',");
R("description: '取回一个色板的完整色值。多阶色板返回各色相色阶；策展合集返回多套配色（支持分页）；ColorBrewer 返回官方方案（含色盲/打印安全标注）。先用 search_palettes 拿 id。',",
  "description: 'Return full color values of one palette: multi-scale hues, paginated curated sets, ColorBrewer schemes with safety flags. Get ids via search_palettes. 取回一个色板的完整色值（多阶/策展分页/ColorBrewer 方案）。先用 search_palettes 获取 id。',");
R("description: '取 ColorBrewer 指定方案、指定色块数的具体色值，并附该档位的色盲/打印安全判定。',",
  "description: 'Return ColorBrewer scheme colors for a given class count, with official colorblind/print safety flags (null = not annotated). 取 ColorBrewer 指定方案与色块数的色值及安全判定。',");
R("description: '任意颜色格式互转：#hex / rgb() / hsl() → HEX、RGB、HSL、HSV、CMYK、CIE L*a*b*、OKLCH + 最近色名。',",
  "description: 'Convert any color (#hex / rgb() / hsl()) to HEX, RGB, HSL, HSV, CMYK, CIE L*a*b*, OKLCH plus the nearest common color name. 任意颜色格式互转（含 OKLCH 与最近色名）。',");
R("description: '计算前景/背景对比度并给出 WCAG 2.1 五项判定（正文 AA/AAA、大字 AA/AAA、UI 组件）。不达标时提示可用 suggest_fix 获取修正方案。',",
  "description: 'Compute the WCAG 2.1 contrast ratio and five verdicts (body AA/AAA, large AA/AAA, UI components). If failing, call suggest_fix for corrections. 计算对比度并给出五项 WCAG 判定；不达标可用 suggest_fix。',");
R("description: '对比度不达标时给出可执行的修正方案：保色相 OKLCH 求解（AA/AAA）、黑/白替代、背景反向求解，以及从 Tailwind/Ant/OpenColor/Radix 内置色阶中推荐色相最接近的现成达标色。',",
  "description: 'Actionable fixes for failing contrast: hue-preserving OKLCH solves (AA/AAA), black/white swap, background adjustment, plus ready-made accessible steps from Tailwind/Ant/OpenColor/Radix. 对比度不达标时的修正方案：保色相求解、黑白替代、背景调整与现成达标色推荐。',");
R("description: '从基色生成整套可用色阶。mode=semantic：12 阶 Radix 风格语义色阶（1-2 背景 / 3-4 交互态 / 5-7 边框 / 8-10 强调 / 11-12 文字），基色锚定第 9 阶主色；mode=contrast：Leonardo 式按目标 WCAG 对比度逐阶求解（适合文字/图标色）。引擎为 OKLCH，感知均匀。',",
  "description: 'Generate a full scale from a base color. mode=semantic: 12-step Radix-style roles (base anchored at step 9); mode=contrast: Leonardo-style solve per step against target WCAG ratios. OKLCH engine, perceptually uniform. 从基色生成语义色阶或对比度目标色阶（OKLCH 引擎）。',");
R("description: '对一批颜色逐个判定 WCAG 三档（正文 AA ≥4.5、大字 AA ≥3、UI 组件 ≥3）在给定背景下的达标情况——用于快速找出整套色阶里哪些能当文字色。',",
  "description: 'Batch-judge a list of colors against a background for body AA (≥4.5), large AA (≥3) and UI components (≥3) — quickly find which steps of a scale work as text colors. 对一批颜色逐个判定三档 WCAG 达标情况。',");
R("description: '检查 2-6 个锚点色构成的渐变（OKLab 感知均匀插值）：明度曲线是否出现亮带、相邻段在色盲视角下能否区分。返回采样色标与警告。',",
  "description: 'Check a 2-6 anchor gradient (OKLab perceptual interpolation) for lightness banding and colorblind distinguishability per segment; returns sampled stops and warnings. 检查渐变亮带与色盲可区分性。',");
R("description: '模拟颜色在色觉缺陷人群下的呈现（Viénot 1999 近似）：prot=红色盲, deut=绿色盲, trit=蓝黄色盲, gray=灰度。用于判断分类配色是否「撞色」。',",
  "description: 'Simulate colors under protanopia/deuteranopia/tritanopia/grayscale (Viénot 1999 approximation) to spot colliding categorical palettes. 模拟四类色觉下的颜色呈现。',");
R("description: '把任意内置色板映射成一套界面角色：bg 页面背景 / surface 卡片面 / border 边框 / text 文字 / accent 强调色，另附分类色板（用于图表）与按明度排序的 ramp。支持 multiscale 指定色相、set 指定套。',",
  "description: 'Map any built-in palette to UI roles (bg/surface/border/text/accent) plus categorical colors for charts and a lightness-sorted ramp. 把内置色板映射为界面角色 + 分类色 + 明度 ramp。',");
R("description: '从任意品牌色用官方 HCT 色彩空间生成 Material 3 动态主题：6 组音调色板（primary/secondary/tertiary/neutral/neutralVariant/error，各 13 档）+ 亮/暗 scheme 关键 token。色彩数学来自 Google 官方 material-color-utilities (Apache-2.0)。',",
  "description: 'Generate a Material 3 dynamic theme from any brand color via Google\\'s official HCT engine: 6 tonal palettes × 13 tones + light/dark scheme key tokens (Apache-2.0 material-color-utilities). 从品牌色用官方 HCT 引擎生成 M3 动态主题（6 组音调色板 + scheme token）。',");

/* —— sample_colormap 工具 —— */
R("/* ---------- 8. simulate_vision ---------- */",
`/* ---------- 7d. sample_colormap ---------- */
server.registerTool('sample_colormap', {
  title: '采样连续色图',
  description: 'Sample a continuous colormap at arbitrary positions: give a map-kind palette id (mpl-* / sci-*) and either a count for evenly spaced samples or explicit positions in [0,1]. Returns hexes + a ready CSS gradient. 在任意位置采样连续色图（数值→颜色的确定性取色）。',
  inputSchema: {
    paletteId: z.string().describe('色图 id，如 mpl-viridis / sci-batlow'),
    count: z.number().int().min(2).max(33).optional().describe('均匀采样数，默认 8'),
    positions: z.array(z.number().min(0).max(1)).optional().describe('显式采样位置数组（0-1），优先于 count'),
  },
}, async ({ paletteId, count = 8, positions }) => {
  const p = PAL(paletteId);
  if (!p || p.kind !== 'map') return err('"' + paletteId + '" 不是连续色图，用 search_palettes(category=viz) 查找 mpl-*/sci-*');
  const stops = p.stops;
  const ts = (Array.isArray(positions) && positions.length)
    ? positions.map(v => Math.max(0, Math.min(1, v)))
    : Array.from({ length: clampInt(count, 2, 33) }, (_, i) => i / (clampInt(count, 2, 33) - 1));
  const colors = ts.map(tn => stops[Math.min(stops.length - 1, Math.round(tn * (stops.length - 1)))]);
  return ok({
    id: p.id, cn: p.cn,
    positions: ts, colors,
    gradientCss: 'linear-gradient(90deg, ' + colors.join(', ') + ')',
    note: '连续取色请按 t 在 stops 间线性插值；本工具返回最近采样档。用于分类时建议 ≤8 档并检查色盲可区分性（check_gradient）。',
  });
});

/* ---------- 8. simulate_vision ---------- */`);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
