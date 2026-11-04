/* ColorCat MCP 端到端测试：SDK Client 实连 server.js（stdio），逐工具验证 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { srgbToOklab as E_srgbToOklab, hexToRgb } from '../engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, '..');

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(serverDir, 'server.js')],
  cwd: serverDir,
});
const client = new Client({ name: 'colorcat-test', version: '0.0.1' });
await client.connect(transport);

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond){ pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} — ${detail ?? ''}`); }
};
const call = async (tool, args) => {
  const res = await client.callTool({ name: tool, arguments: args });
  const text = res.content?.[0]?.text ?? '';
  if (res.isError) return { isError: true, text };
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

/* 1. 工具清单 */
const tools = await client.listTools();
console.log(`\n[1] 工具清单：${tools.tools.length} 个`);
check('工具数量 = 12', tools.tools.length === 12, `实际 ${tools.tools.length}`);
check('含核心工具', ['search_palettes','get_palette','convert_color','contrast_check','suggest_fix','generate_scale','check_gradient','simulate_vision','preview_roles','get_brewer_classes','audit_contrast','generate_m3'].every(n => tools.tools.some(t => t.name === n)));

/* 2. search_palettes */
console.log('\n[2] search_palettes');
{
  const r = await call('search_palettes', { query: '宝可梦' });
  check('宝可梦包可检索', r.palettes?.some(p => p.id === 'p-palettetown'), JSON.stringify(r).slice(0, 120));
  const r2 = await call('search_palettes', { category: 'ui' });
  check('ui 分类 ≥7 组', r2.palettes?.filter(p => p.category === 'ui').length >= 7);
  const r3 = await call('search_palettes', { query: 'zzz-不存在' });
  check('无结果时 total=0', r3.total === 0);
}

/* 3. get_palette */
console.log('\n[3] get_palette');
{
  const r = await call('get_palette', { id: 'catppuccin-mocha' });
  check('mocha 26 色', r.items?.length === 26, `实际 ${r.items?.length}`);
  check('含 base 色', r.items?.some(c => c.name === 'base'));
  const r2 = await call('get_palette', { id: 'p-palettetown', offset: 5, limit: 3 });
  check('分页：389 套 / offset=5 取 3', r2.total === 389 && r2.items.length === 3 && r2.items[0].name === 'charizard', JSON.stringify(r2.items?.[0]));
  const r3 = await call('get_palette', { id: 'mpl-viridis' });
  check('viridis 24 档渐变', r3.stops?.length === 24);
  const r4 = await call('get_palette', { id: 'not-exist' });
  check('未知 id 返回 error', r4.isError === true);
  const r5 = await call('get_palette', { id: 'colorbrewer-div' });
  check('brewer 返回 9 方案', r5.schemes?.length === 9);
}

/* 4. get_brewer_classes */
console.log('\n[4] get_brewer_classes');
{
  const r = await call('get_brewer_classes', { id: 'colorbrewer-div', scheme: 'BrBG', classCount: 5 });
  check('BrBG 5 类 = 5 色', r.colors?.length === 5, JSON.stringify(r.colors));
  check('BrBG 5 类官方未标注色盲 → null', r.blindSafe === null && String(r.blindSafeNote).includes('未覆盖'), JSON.stringify({ b: r.blindSafe, n: r.blindSafeNote }));
  const r3c = await call('get_brewer_classes', { id: 'colorbrewer-div', scheme: 'BrBG', classCount: 3 });
  check('BrBG 3 类官方标注色盲安全', r3c.blindSafe === true, JSON.stringify(r3c.blindSafe));
  const bad = await call('get_brewer_classes', { id: 'colorbrewer-div', scheme: 'BrBG', classCount: 99 });
  check('非法档位报错', bad.isError === true);
}

/* 5. convert_color */
console.log('\n[5] convert_color');
{
  const r = await call('convert_color', { color: 'rgb(59, 130, 246)' });
  check('rgb→hex', r.hex === '#3B82F6', r.hex);
  check('oklch 数值合理', typeof r.oklch === 'string' && r.oklch.startsWith('oklch(0.62'), r.oklch);
  const r2 = await call('convert_color', { color: 'hsl(212, 72%, 52%)' });
  check('hsl→hex', r2.hex === '#2C7FDD', r2.hex);
  check('最近色名=蓝', r2.name === '蓝');
}

/* 6. contrast_check */
console.log('\n[6] contrast_check');
{
  const r = await call('contrast_check', { fg: '#FFFFFF', bg: '#2563EB' });
  check('白/蓝 = 5.17', r.ratio === 5.17, r.ratio);
  check('AA 达标 AAA 未达', r.wcag.aa_normal === true && r.wcag.aaa_normal === false);
}

/* 7. suggest_fix */
console.log('\n[7] suggest_fix');
{
  const r = await call('suggest_fix', { fg: '#7C9AB8', bg: '#FFFFFF' });
  check('原始对比度 2.93', r.ratio === 2.93, r.ratio);
  const aa = r.suggestions?.find(s => s.action.includes('达 AA（'));
  check('AA 修正色 #5D7996 (4.53)', aa && aa.hex === '#5D7996' && aa.ratio === 4.53, JSON.stringify(aa));
  check('现成方案来自设计系统', Array.isArray(r.readyMade) && r.readyMade.every(o => /Tailwind|Ant|Open Color|Radix/.test(o.source)), JSON.stringify(r.readyMade?.[0]));
  const r2 = await call('suggest_fix', { fg: '#FFFFFF', bg: '#1B1E23' });
  check('深底白字判 AAA 达标', r2.verdict?.includes('AAA'), r2.ratio);
}

/* 8. generate_scale */
console.log('\n[8] generate_scale');
{
  const r = await call('generate_scale', { base: '#2563EB' });
  check('semantic 12 阶', r.steps?.length === 12);
  check('主色锚定第 9 阶', r.mainColor === '#2563EB');
  check('角色标注完整', r.steps[0].role === '页面背景' && r.steps[11].role === '标题文字');
  const r2 = await call('generate_scale', { base: '#0E9F6E', mode: 'contrast', bg: '#FFFFFF', count: 6, minRatio: 1.1, maxRatio: 7 });
  check('contrast 模式几何分布', r2.steps[0].target === 1.1 && r2.steps[5].target === 7, JSON.stringify(r2.steps.map(s => s.target)));
  check('全部命中 ±0.05', r2.allTargetsHit === true);
  check('CSS 片段输出', r.css.startsWith(':root'));
}

/* 9. check_gradient */
console.log('\n[9] check_gradient');
{
  const r = await call('check_gradient', { colors: ['#2C7FDD', '#7C3AED', '#F59E0B'] });
  check('9 档采样', r.samples?.length === 9);
  check('捕获 CVD 警告（蓝紫段）', r.warnings?.some(w => w.includes('不可区分')), JSON.stringify(r.warnings));
  const r2 = await call('check_gradient', { colors: ['#000000', '#FFFFFF'] });
  check('黑白渐变通过', r2.ok === true, JSON.stringify(r2.warnings));
}

/* 9a2. generate_m3 */
{
  const r = await call('generate_m3', { source: '#6750A4' });
  const p40 = r.palettes?.primary?.find(x => x.tone === 40);
  check('M3 primary tone40 精确往返 #6750A4', p40?.hex === '#6750A4', JSON.stringify(p40));
  check('M3 tone100 = #FFFFFF', r.palettes?.primary?.find(x => x.tone === 100)?.hex === '#FFFFFF');
  check('M3 light.primary = #6750A4', r.scheme?.light?.primary === '#6750A4', r.scheme?.light?.primary);
  check('M3 dark.primary = tone80', typeof r.scheme?.dark?.primary === 'string' && /^#[0-9A-F]{6}$/.test(r.scheme.dark.primary));
  const bad = await call('generate_m3', { source: 'zzz' });
  check('非法颜色报错', bad.isError === true);
}

/* 9b. audit_contrast */
{
  const r = await call('audit_contrast', { bg: '#FFFFFF', colors: ['#000000', '#888888', 'zzz'] });
  check('audit 3 行（含 1 解析失败）', r.rows?.length === 3 && r.rows[2].error === 'unparsed', JSON.stringify(r.rows?.[2]));
  check('#000000 正文AA 过 (21:1)', r.rows?.[0].bodyAA === true && r.rows?.[0].ratio === 21, JSON.stringify(r.rows?.[0]));
  check('#888888 仅大字/UI 过', r.rows?.[1].bodyAA === false && r.rows?.[1].largeAA === true && r.rows?.[1].uiComponent === true, JSON.stringify(r.rows?.[1]));
  check('passBodyAA 计数 = 1', r.passBodyAA === 1);
}

/* 10. simulate_vision */
console.log('\n[10] simulate_vision');
{
  const r = await call('simulate_vision', { colors: ['#FF0000', '#00FF00'], mode: 'deut' });
  // 趋同断言：模拟后的 OKLab ΔE 应小于原始 ΔE（区分度下降）
  const de = (h1, h2) => {
    const A = E_srgbToOklab(...hexToRgb(h1)), B = E_srgbToOklab(...hexToRgb(h2));
    return Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  };
  const orig = de(r.colors[0].from, r.colors[1].from);
  const sim = de(r.colors[0].to, r.colors[1].to);
  check(`绿盲下红绿趋同（ΔE ${orig.toFixed(2)} → ${sim.toFixed(2)}）`, sim < orig, JSON.stringify(r.colors));
  const bad = await call('simulate_vision', { colors: ['#FF0000'], mode: 'nope' });
  check('非法 mode 被拒', bad.isError === true);
}

/* 11. preview_roles */
console.log('\n[11] preview_roles');
{
  const r = await call('preview_roles', { id: 'p-palettetown', setIdx: 5 });
  check('charizard 角色: bg/text/accent 齐全', r.roles?.bg && r.roles?.text && r.roles?.accent, JSON.stringify(r.roles));
  check('note 指明套名', r.note?.includes('charizard'), r.note);
  const r2 = await call('preview_roles', { id: 'tailwind', hueIdx: 4 });
  check('multiscale 色相映射', r2.roles?.accent !== undefined && r2.note.includes('色阶'));
  const r3 = await call('preview_roles', { id: 'p-palettetown', setIdx: 0 });
  check('不同套角色不同', r3.roles.bg !== r.roles.bg);
}

console.log(`\n========== 结果: ${pass} 通过 / ${fail} 失败 ==========`);
await client.close();
process.exit(fail ? 1 : 0);
