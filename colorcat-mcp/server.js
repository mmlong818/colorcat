#!/usr/bin/env node
/* ColorCat 配色猫 — MCP Server
 * 9 个工具：色板检索/取色板/颜色转换/对比度检查/修正建议/色阶生成/渐变检查/色觉模拟/界面角色映射
 * 数据：125 组开源色板（离线内置）；引擎：engine.js（与网页版同一套公式）
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as E from './engine.js';
import MCU from './hct.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PALETTES = JSON.parse(readFileSync(join(__dirname, 'data.json'), 'utf8'));
const PAL = id => PALETTES.find(p => p.id === id);

export function buildServer(){
const server = new McpServer({ name: 'colorcat', version: '1.0.0' });
const ok = obj => ({ content: [{ type: 'text', text: JSON.stringify(obj) }] });
const err = msg => ({ content: [{ type: 'text', text: 'error: ' + msg }], isError: true });
const clampInt = (v, def, min, max) => {
  const n = Number.isInteger(v) ? v : parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};

/* ---------- 1. search_palettes ---------- */
server.registerTool('search_palettes', {
  title: '搜索色板',
  description: 'Search 127 built-in open-source palettes (UI design systems / scientific colormaps / curated packs / editor themes / traditional colors). 在 127 组内置开源色板中检索（UI 设计系统 / 数据可视化 / 策展合集 / 编辑器主题 / 传统色）。返回匹配的色板 id 与元信息，之后可用 get_palette 取色值。Categories: ui=design systems, viz=scientific colormaps, curated=65 themed packs (Pokémon/Ghibli/Met Museum...), editor=editor themes, traditional=Chinese & Japanese traditional colors. 类别：ui=设计系统, viz=数据可视化, curated=策展合集, editor=编辑器主题, traditional=传统色',
  inputSchema: {
    query: z.string().optional().describe('关键词，如 tailwind / nord / 传统色 / catppuccin / 宝可梦'),
    category: z.enum(['ui', 'viz', 'curated', 'editor', 'traditional', 'all']).optional().describe('类别筛选，默认 all'),
    limit: z.number().int().min(1).max(50).optional().describe('返回条数，默认 20'),
  },
}, async ({ query = '', category = 'all', limit = 20 }) => {
  const q = query.trim().toLowerCase();
  const list = PALETTES.filter(p =>
    (category === 'all' || p.category === category) &&
    (!q || (p.id + ' ' + p.name + ' ' + p.cn + ' ' + p.desc).toLowerCase().includes(q)));
  const size = p =>
    p.scales ? `${p.scales.length} 个色相` :
    p.schemes ? `${p.schemes.length} 个官方方案` :
    p.stops ? `${p.stops.length} 档渐变` :
    p.sets ? `${p.sets.length} 套` : `${p.colors.length} 色`;
  return ok({
    total: list.length,
    shown: Math.min(limit, list.length),
    palettes: list.slice(0, limit).map(p => ({
      id: p.id, cn: p.cn, category: p.category, kind: p.kind, size: size(p), desc: p.desc.slice(0, 80),
    })),
  });
});

/* ---------- 2. get_palette ---------- */
server.registerTool('get_palette', {
  title: '获取色板色值',
  description: 'Return full color values of one palette: multi-scale hues, paginated curated sets, ColorBrewer schemes with safety flags. Get ids via search_palettes. 取回一个色板的完整色值（多阶/策展分页/ColorBrewer 方案）。先用 search_palettes 获取 id。',
  inputSchema: {
    id: z.string().describe('色板 id，来自 search_palettes，如 tailwind / catppuccin-mocha / p-palettetown'),
    offset: z.number().int().min(0).optional().describe('分页起点（对 palette/set 类生效），默认 0'),
    limit: z.number().int().min(1).max(200).optional().describe('每页条数（palette 默认 100，set 默认 30，上限 200）'),
  },
}, async ({ id, offset = 0, limit }) => {
  const p = PAL(id);
  if (!p) return err(`找不到色板 "${id}"，用 search_palettes 查询有效 id`);
  const meta = { id: p.id, cn: p.cn, kind: p.kind, category: p.category, license: p.license };
  if (p.kind === 'multiscale'){
    return ok({ ...meta, scales: p.scales.map(s => ({ name: s.name, cn: s.cnName || undefined, steps: s.steps, dark: s.dark })) });
  }
  if (p.kind === 'map'){
    return ok({ ...meta, stops: p.stops, gradientCss: `linear-gradient(90deg, ${p.stops.join(', ')})` });
  }
  if (p.kind === 'brewer'){
    return ok({
      ...meta, typeLabel: p.typeLabel,
      schemes: p.schemes.map(s => ({
        name: s.name, type: s.type, availableClassCounts: Object.keys(s.classes).map(Number).sort((a, b) => a - b),
        blindSafe: s.blind.some(v => v >= 1), printSafe: s.print.some(v => v >= 1),
      })),
      tip: '每个 scheme 可用 get_palette_brewer_classes 取具体色值',
    });
  }
  /* palette / set / gradset：统一分页 */
  const items = p.kind === 'palette'
    ? p.colors.map(c => ({ name: c.name || undefined, hex: c.hex }))
    : p.sets.map(s => ({ name: s.name, colors: s.colors }));
  const lim = clampInt(limit, p.kind === 'palette' ? 100 : 30, 1, 200);
  return ok({
    ...meta, total: items.length, offset: Math.min(offset, items.length),
    items: items.slice(offset, offset + lim),
    hasMore: offset + lim < items.length,
  });
});

/* ---------- 2b. get_brewer_classes ---------- */
server.registerTool('get_brewer_classes', {
  title: '取 ColorBrewer 方案色值',
  description: 'Return ColorBrewer scheme colors for a given class count, with official colorblind/print safety flags (null = not annotated). 取 ColorBrewer 指定方案与色块数的色值及安全判定。',
  inputSchema: {
    id: z.string().describe('色板 id（colorbrewer-seq / colorbrewer-div / colorbrewer-qual）'),
    scheme: z.string().describe('方案名，如 Blues / BrBG / Set2（来自 get_palette 返回的 schemes）'),
    classCount: z.number().int().min(3).max(12).optional().describe('色块数，默认该方案最少档'),
  },
}, async ({ id, scheme, classCount }) => {
  const p = PAL(id);
  if (!p || p.kind !== 'brewer') return err(`"${id}" 不是 ColorBrewer 色板`);
  const sch = p.schemes.find(s => s.name.toLowerCase() === String(scheme).toLowerCase());
  if (!sch) return err(`找不到方案 "${scheme}"，可用: ${p.schemes.map(s => s.name).join(', ')}`);
  const nums = Object.keys(sch.classes).map(Number).sort((a, b) => a - b);
  const n = classCount ? (sch.classes[classCount] ? classCount : null) : nums[0];
  if (!n) return err(`方案 ${sch.name} 没有 ${classCount} 类档位，可用: ${nums.join(', ')}`);
  const idx = nums.indexOf(n);
  /* 官方 blind/print 数组可能只覆盖低档位：越界 = 未标注（null），不能当作不安全 */
  const tri = (arr) => arr[idx] === undefined ? null : arr[idx] >= 1;
  return ok({
    scheme: sch.name, type: sch.type, classCount: n, colors: sch.classes[n],
    blindSafe: tri(sch.blind),
    printSafe: tri(sch.print),
    blindSafeNote: (sch.blind[idx] === undefined) ? '官方数据未覆盖该档位' : undefined,
  });
});

/* ---------- 3. convert_color ---------- */
server.registerTool('convert_color', {
  title: '颜色格式转换',
  description: 'Convert any color (#hex / rgb() / hsl()) to HEX, RGB, HSL, HSV, CMYK, CIE L*a*b*, OKLCH plus the nearest common color name. 任意颜色格式互转（含 OKLCH 与最近色名）。',
  inputSchema: {
    color: z.string().describe('颜色，如 #3B82F6 / 3B82F6 / rgb(59,130,246) / hsl(217,91%,60%)'),
  },
}, async ({ color }) => {
  const hex = E.parseColor(color);
  if (!hex) return err(`无法解析颜色 "${color}"，支持 #hex / rgb() / hsl()`);
  const rgb = E.hexToRgb(hex);
  const [h, s, l] = E.rgbToHsl(...rgb);
  const [L, C, H] = E.srgbToOklch(hex);
  return ok({
    hex, rgb: `rgb(${rgb.join(', ')})`, hsl: `hsl(${h}, ${s}%, ${l}%)`,
    hsv: `hsv(${E.rgbToHsv(...rgb).join('%, ')}%)`.replace('hsv(', 'hsv('),
    cmyk: `cmyk(${E.rgbToCmyk(...rgb).join('%, ')}%)`,
    lab: `lab(${E.rgbToLab(...rgb).join(', ')})`,
    oklch: `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`,
    name: E.hueName(h, s, l),
  });
});

/* ---------- 4. contrast_check ---------- */
server.registerTool('contrast_check', {
  title: 'WCAG 对比度检查',
  description: 'Compute the WCAG 2.1 contrast ratio and five verdicts (body AA/AAA, large AA/AAA, UI components). If failing, call suggest_fix for corrections. 计算对比度并给出五项 WCAG 判定；不达标可用 suggest_fix。',
  inputSchema: {
    fg: z.string().describe('前景色（文字色）'),
    bg: z.string().describe('背景色'),
  },
}, async ({ fg, bg }) => {
  const f = E.parseColor(fg), b = E.parseColor(bg);
  if (!f || !b) return err('无法解析颜色');
  const r = E.contrast(f, b);
  return ok({
    fg: f, bg: b, ratio: +r.toFixed(2), wcag: E.wcagVerdicts(r),
    hint: r < 4.5 ? '正文未达 AA，调用 suggest_fix 获取修正方案' : r < 7 ? 'AA 已达标，AAA 需 ≥7:1，可用 suggest_fix' : '全部达标',
  });
});

/* ---------- 5. suggest_fix ---------- */
server.registerTool('suggest_fix', {
  title: '对比度修正建议',
  description: 'Actionable fixes for failing contrast: hue-preserving OKLCH solves (AA/AAA), black/white swap, background adjustment, plus ready-made accessible steps from Tailwind/Ant/OpenColor/Radix. 对比度不达标时的修正方案：保色相求解、黑白替代、背景调整与现成达标色推荐。',
  inputSchema: {
    fg: z.string().describe('前景色（文字色）'),
    bg: z.string().describe('背景色'),
    target: z.union([z.literal(4.5), z.literal(7), z.literal(3)]).optional().describe('目标对比度，默认按未达标项自动选择'),
  },
}, async ({ fg, bg, target }) => {
  const res = E.suggestFix(PALETTES, fg, bg, target);
  return res.error ? err(res.error) : ok(res);
});

/* ---------- 6. generate_scale ---------- */
server.registerTool('generate_scale', {
  title: '生成语义色阶',
  description: 'Generate a full scale from a base color. mode=semantic: 12-step Radix-style roles (base anchored at step 9); mode=contrast: Leonardo-style solve per step against target WCAG ratios. OKLCH engine, perceptually uniform. 从基色生成语义色阶或对比度目标色阶（OKLCH 引擎）。',
  inputSchema: {
    base: z.string().describe('基色（主色）'),
    mode: z.enum(['semantic', 'contrast']).optional().describe('默认 semantic'),
    bg: z.string().optional().describe('contrast 模式的背景色，默认 #FFFFFF'),
    count: z.number().int().min(4).max(16).optional().describe('contrast 模式阶数，默认 10'),
    minRatio: z.number().min(1.05).max(21).optional().describe('contrast 模式最小对比度，默认 1.1'),
    maxRatio: z.number().min(1.05).max(21).optional().describe('contrast 模式最大对比度，默认 7'),
  },
}, async ({ base, mode = 'semantic', bg = '#FFFFFF', count = 10, minRatio = 1.1, maxRatio = 7 }) => {
  const hex = E.parseColor(base);
  if (!hex) return err(`无法解析基色 "${base}"`);
  if (mode === 'contrast'){
    const bgN = E.parseColor(bg);
    if (!bgN) return err(`无法解析背景 "${bg}"`);
    const r = E.genContrastScale(hex, bgN, clampInt(count, 10, 4, 16), Math.min(minRatio, maxRatio), Math.max(minRatio, maxRatio));
    return ok({
      mode, base: hex, bg: bgN,
      steps: r.detail.map((o, i) => ({ step: i + 1, target: +o.target.toFixed(2), reached: +o.reached.toFixed(2), hex: o.hex })),
      allTargetsHit: r.detail.every(o => o.reached >= o.target - 0.05),
      css: ':root {\n' + r.steps.map((h, i) => `  --scale-${i + 1}: ${h};`).join('\n') + '\n}',
    });
  }
  const sc = E.genScale(hex);
  return ok({
    mode, base: hex, clamped: sc.clamped,
    clampedNote: sc.clamped ? '基色明度过极端，主色阶(9)已调整到可用范围以保住对比度，色相保留' : undefined,
    steps: sc.steps.map((h, i) => ({ step: i + 1, role: E.SCALE_ROLES[i], hex: h })),
    mainColor: sc.steps[8],
    css: ':root {\n' + sc.steps.map((h, i) => `  --scale-${i + 1}: ${h}; /* ${E.SCALE_ROLES[i]} */`).join('\n') + '\n}',
  });
});

/* ---------- 7. check_gradient ---------- */
server.registerTool('check_gradient', {
  title: '渐变色阶检查',
  description: 'Check a 2-6 anchor gradient (OKLab perceptual interpolation) for lightness banding and colorblind distinguishability per segment; returns sampled stops and warnings. 检查 2-6 锚点渐变的亮带与三类色盲可区分性，返回采样色标与警告。',
  inputSchema: {
    colors: z.array(z.string()).min(2).max(6).describe('锚点色数组，2-6 个'),
  },
}, async ({ colors }) => {
  const res = E.checkGradient(colors);
  return res.error ? err(res.error) : ok(res);
});

/* ---------- 7b. audit_contrast ---------- */
server.registerTool('audit_contrast', {
  title: '批量对比度审计',
  description: 'Batch-judge a list of colors against a background for body AA (≥4.5), large AA (≥3) and UI components (≥3) — quickly find which steps of a scale work as text colors. 对一批颜色逐个判定三档 WCAG 达标情况。',
  inputSchema: {
    bg: z.string().describe('背景色'),
    colors: z.array(z.string()).min(1).max(60).describe('待审计的颜色列表，最多 60 个'),
  },
}, async ({ bg, colors }) => {
  const b = E.parseColor(bg);
  if (!b) return err();
  const rows = colors.map(c => {
    const h = E.parseColor(c);
    if (!h) return { input: c, error: 'unparsed' };
    const r = E.contrast(h, b);
    const w = E.wcagVerdicts(r);
    return { hex: h, ratio: +r.toFixed(2), bodyAA: w.aa_normal, largeAA: w.aa_large, uiComponent: w.ui_components };
  });
  return ok({
    bg: b, count: rows.length,
    passBodyAA: rows.filter(x => x.bodyAA).length,
    rows,
  });
});

/* ---------- 7c. generate_m3 ---------- */
server.registerTool('generate_m3', {
  title: '生成 Material 3 主题',
  description: 'Generate a Material 3 dynamic theme from any brand color via Google\'s official HCT engine: 6 tonal palettes × 13 tones + light/dark scheme key tokens (Apache-2.0 material-color-utilities). 从品牌色用官方 HCT 引擎生成 M3 动态主题（6 组音调色板 + scheme token）。',
  inputSchema: {
    source: z.string().describe('品牌色/来源色'),
  },
}, async ({ source }) => {
  const hex = E.parseColor(source);
  if (!hex) return err('无法解析颜色: ' + source);
  const src = MCU.Hct.fromInt(MCU.argbFromHex(hex));
  const H = src.hue, C = Math.max(src.chroma, 48);
  const up = a => a.toUpperCase();   // 入参已是 HEX 字符串（此前误二次调用 hexFromArgb 导致全黑）
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
  function tone2(pal, tn){
    const argb = pal.tone(tn);
    const hx = MCU.hexFromArgb(argb);
      return up(hx);
  }
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

/* ---------- 7d. sample_colormap ---------- */
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
  const n = clampInt(count, 8, 2, 33);
  const ts = (Array.isArray(positions) && positions.length)
    ? positions.map(v => Math.max(0, Math.min(1, v)))
    : Array.from({ length: n }, (_, i) => i / (n - 1));
  const colors = ts.map(tn => stops[Math.min(stops.length - 1, Math.round(tn * (stops.length - 1)))]);
  return ok({
    id: p.id, cn: p.cn,
    positions: ts, colors,
    gradientCss: 'linear-gradient(90deg, ' + colors.join(', ') + ')',
    note: '连续取色请按 t 在 stops 间线性插值；本工具返回最近采样档。用于分类时建议 ≤8 档并检查色盲可区分性（check_gradient）。',
  });
});

/* ---------- 8. simulate_vision ---------- */
server.registerTool('simulate_vision', {
  title: '色觉模拟',
  description: 'Simulate colors under protanopia/deuteranopia/tritanopia/grayscale (Viénot 1999 approximation) to spot colliding categorical palettes. 模拟四类色觉下的颜色呈现。',
  inputSchema: {
    colors: z.array(z.string()).min(1).max(24).describe('要模拟的颜色列表'),
    mode: z.enum(['prot', 'deut', 'trit', 'gray']).describe('模拟类型'),
  },
}, async ({ colors, mode }) => {
  const out = [];
  for (const c of colors){
    const hex = E.parseColor(c);
    if (!hex) return err(`无法解析颜色 "${c}"`);
    out.push({ from: hex, to: E.simulate(hex, mode) });
  }
  return ok({ mode, colors: out });
});

/* ---------- 9. preview_roles ---------- */
server.registerTool('preview_roles', {
  title: '色板 → 界面角色映射',
  description: 'Map any built-in palette to UI roles (bg/surface/border/text/accent) plus categorical colors for charts and a lightness-sorted ramp. 把内置色板映射为界面角色 + 分类色 + 明度 ramp。',
  inputSchema: {
    id: z.string().describe('色板 id'),
    hueIdx: z.number().int().min(0).optional().describe('multiscale 色相索引，默认 0'),
    setIdx: z.number().int().min(0).optional().describe('set/gradset 套索引，默认 0'),
  },
}, async ({ id, hueIdx = 0, setIdx = 0 }) => {
  const p = PAL(id);
  if (!p) return err(`找不到色板 "${id}"`);
  const roles = E.paletteRoles(p, hueIdx, setIdx);
  if (!roles) return err(`色板 "${id}" 类型（${p.kind}）暂不支持角色映射`);
  return ok({ id: p.id, cn: p.cn, ...roles });
});

  return server;
}

/* ---------- 启动：stdio（默认）或 --http 端口 ---------- */
function authOk(req){
  const need = process.env.COLORCAT_TOKEN;
  if (!need) return true;   // 未设 token = 不鉴权（仅建议本机/内网）
  return (req.headers.authorization || '') === 'Bearer ' + need;
}

async function startHttp(port){
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.get('/', (req, res) => res.json({
    name: 'colorcat', version: '1.0.0', transport: 'streamable-http',
    endpoint: '/mcp', auth: process.env.COLORCAT_TOKEN ? 'Bearer token required' : 'open',
    tools: 11,
  }));
  app.use('/mcp', (req, res, next) => {
    if (!authOk(req)) return res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'unauthorized: send header Authorization: Bearer <COLORCAT_TOKEN>' } });
    next();
  });
  app.post('/mcp', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      const instance = buildServer();
      res.on('close', () => { transport.close(); instance.close(); });
      await instance.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: String(e && e.message || e) } });
    }
  });
  const notSupported = (req, res) => res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'stateless mode: GET/DELETE not supported' } });
  app.get('/mcp', notSupported);
  app.delete('/mcp', notSupported);
  app.listen(port, () => console.error(`ColorCat 配色猫 HTTP 已监听 :${port}/mcp · ${PALETTES.length} 组色板 · ${process.env.COLORCAT_TOKEN ? '鉴权开启' : '无鉴权'}`));
}

if (process.argv.includes('--http')){
  const port = parseInt(process.argv[process.argv.indexOf('--http') + 1], 10) || 3000;
  startHttp(port);
} else {
  const transport = new StdioServerTransport();
  await buildServer().connect(transport);
  console.error(`ColorCat 配色猫 MCP 已启动（stdio）· ${PALETTES.length} 组色板内置`);
}
