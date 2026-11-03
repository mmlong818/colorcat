/* transform.js — 把各开源配色数据统一成 palettes.js（浏览器可直接 <script> 引入）
 * 用法: node transform.js   （在 scratch/ 目录下运行，数据在 dl/）
 * 所有文案（desc）为原创撰写；色值为各 MIT/Apache/开放许可项目公开发布的事实数据，逐条带署名。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DL = path.join(__dirname, 'dl');
const OUT = path.join(__dirname, '..', 'color-hub', 'palettes.js');

const read = f => fs.readFileSync(path.join(DL, f), 'utf8');
const hexUp = h => '#' + h.replace('#', '').toUpperCase();
const assertHex = h => {
  h = String(h).replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('bad hex #' + h);
  return hexUp('#' + h);
};

const PALETTES = [];

/* ---------- 1. Open Color (MIT) ---------- */
{
  const j = JSON.parse(read('opencolor.json'));
  const scales = [];
  for (const hue of ['gray','red','pink','grape','violet','indigo','blue','cyan','teal','green','lime','yellow','orange']) {
    const s = j[hue];
    scales.push({ name: hue, steps: [0,1,2,3,4,5,6,7,8,9].map(k => assertHex(s[k])) });
  }
  PALETTES.push({
    id: 'opencolor', name: 'Open Color', cn: 'Open Color · 开源 UI 色板', category: 'ui', kind: 'multiscale',
    license: 'MIT', source: 'https://yeun.github.io/open-color/',
    attribution: '© yeastn/Yeun, Open Color (MIT)',
    desc: '专为 UI 优化的 13 色相 × 10 阶开源色板，灰阶与彩色配套，深浅主题都好用。',
    scales,
  });
}

/* ---------- 2. Tailwind CSS v3 (MIT) ---------- */
{
  const text = read('tw-colors-lib.js');
  const scales = [];
  const hueRe = /(\w+):\s*\{([^{}]*?)\}/g;
  let m;
  while ((m = hueRe.exec(text))) {
    const hue = m[1], body = m[2];
    const stepRe = /(\d+):\s*['"]#([0-9a-fA-F]{6})['"]/g;
    const steps = [];
    let s;
    while ((s = stepRe.exec(body))) steps.push({ k: +s[1], hex: assertHex('#' + s[2]) });
    if (steps.length >= 9 && !['stroke','fill'].includes(hue)) {
      steps.sort((a, b) => a.k - b.k);
      scales.push({ name: hue, steps: steps.map(x => x.hex) });
    }
  }
  if (scales.length < 20) throw new Error('tailwind parse failed: ' + scales.length);
  PALETTES.push({
    id: 'tailwind', name: 'Tailwind CSS', cn: 'Tailwind CSS · 内置色板', category: 'ui', kind: 'multiscale',
    license: 'MIT', source: 'https://tailwindcss.com/docs/customizing-colors',
    attribution: '© Tailwind Labs, Tailwind CSS default palette (MIT)',
    desc: '22 色相 × 11 阶（50–950），Web 圈使用最广的默认调色板，可直接对标 Tailwind 类名。',
    scales,
  });
}

/* ---------- 3. Ant Design colors (MIT) ---------- */
{
  const p = require('./dl/antd-pkg/package/lib/presets.js');
  const wanted = ['red','volcano','orange','gold','yellow','lime','green','cyan','blue','geekblue','purple','magenta'];
  const scales = wanted.map(h => ({
    name: h,
    steps: p[h].map(assertHex),
    dark: p[h + 'Dark'] ? p[h + 'Dark'].map(assertHex) : undefined,
  }));
  PALETTES.push({
    id: 'antd', name: 'Ant Design', cn: 'Ant Design · 系统色板', category: 'ui', kind: 'multiscale',
    license: 'MIT', source: 'https://ant.design/docs/spec/colors',
    attribution: '© Ant Design / 蚂蚁集团, @ant-design/colors (MIT)',
    desc: '蚂蚁设计体系色板：12 色相 × 10 阶，含官方暗色版本，色阶由调色算法生成、主色在第 6 阶。',
    scales,
  });
}

/* ---------- 4. Radix Colors (MIT) ---------- */
{
  const hues = ['gray','mauve','slate','sage','olive','sand','tomato','red','crimson','pink','plum','purple','violet','iris','indigo','blue','sky','cyan','teal','jade','mint','green','grass','lime','yellow','amber','orange','brown','gold','bronze','ruby'];
  const cnHue = { gray:'灰', mauve:'灰紫', slate:'蓝灰', sage:'灰绿', olive:'灰黄', sand:'沙棕', tomato:'番茄', red:'红', crimson:'深红', pink:'粉', plum:'洋李', purple:'紫', violet:'紫罗兰', iris:'鸢尾', indigo:'靛', blue:'蓝', sky:'天蓝', cyan:'青', teal:'蓝绿', jade:'翠', mint:'薄荷', green:'绿', grass:'草绿', lime:'青柠', yellow:'黄', amber:'琥珀', orange:'橙', brown:'棕', gold:'金', bronze:'青铜', ruby:'宝石红' };
  const scales = [];
  for (const h of hues) {
    const base = read(`radix-${h}.css`);
    const darkText = read(`radix-${h}-dark.css`);
    const pick = text => {
      const m = [...text.matchAll(new RegExp(`--${h}-(\\d+):\\s*(#[0-9a-fA-F]{6})`, 'g'))];
      return m.slice(0, 12).map(x => assertHex(x[2]));   // 前 12 个 sRGB hex；P3 的 color() 值忽略
    };
    const light = pick(base), dark = pick(darkText);
    if (light.length !== 12 || dark.length !== 12) throw new Error(`radix ${h}: ${light.length}/${dark.length}`);
    scales.push({ name: h, cnName: cnHue[h], steps: light, dark });
  }
  PALETTES.push({
    id: 'radix', name: 'Radix Colors', cn: 'Radix Colors · 语义色阶', category: 'ui', kind: 'multiscale',
    license: 'MIT', source: 'https://www.radix-ui.com/colors',
    attribution: '© WorkOS / Radix UI, Radix Colors (MIT)',
    desc: '31 色相全量 × 12 阶，每阶有明确语义（1-2 背景 / 5-7 边框 / 9-10 强调 / 11-12 文字），亮暗两套原生配套，无障碍设计的事实标准。',
    scales,
  });
}

/* ---------- 5. ColorBrewer 2.0 (Apache-2.0) ---------- */
{
  const text = read('colorbrewer.js').replace(/^\/\*[\s\S]*?\*\//, '');
  const cb = vm.runInNewContext(text + '; colorbrewer;', {}, { timeout: 1000 });
  const groups = { seq: [], div: [], qual: [] };
  for (const [name, byClass] of Object.entries(cb)) {
    if (!byClass || typeof byClass !== 'object') continue;
    const props = (byClass.properties && typeof byClass.properties === 'object') ? byClass.properties : null;
    const type = props && props.type;
    if (!['seq', 'div', 'qual'].includes(type)) continue;   // 用官方分类，跳过元数据
    const classNums = Object.keys(byClass).filter(k => Number.isInteger(Number(k))).map(Number).sort((a, b) => a - b);
    const conv = c => c.startsWith('#') ? assertHex(c) :
      assertHex('#' + c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/).slice(1).map(n => (+n).toString(16).padStart(2, '0')).join(''));
    const entry = {
      name,
      type,
      max: classNums[classNums.length - 1],
      classes: Object.fromEntries(classNums.map(n => [n, byClass[String(n)].map(conv)])),
      blind: props.blind || [],      // 按 class 数索引：>=1 表示该档位色盲安全
      print: props.print || [],      // >=1 表示打印安全（1）或两者皆可（2）
    };
    groups[type].push(entry);
  }
  const cnType = { seq: 'Sequential · 顺序（单色渐变，适合数量）', div: 'Diverging · 发散（中间向两端，适合正负偏差）', qual: 'Qualitative · 定性（分类数据）' };
  const cnName = { seq: '顺序色板', div: '发散色板', qual: '定性色板' };
  for (const t of ['seq', 'div', 'qual']) {
    PALETTES.push({
      id: 'colorbrewer-' + t, name: 'ColorBrewer ' + t, cn: `ColorBrewer · ${cnName[t]}`, category: 'viz',
      kind: 'brewer', brewerType: t, typeLabel: cnType[t],
      license: 'Apache-2.0', source: 'https://colorbrewer2.org/',
      attribution: '© Cynthia A. Brewer, Geography, Penn State — ColorBrewer (Apache-2.0)',
      desc: '地图学经典配色标准（制图学家 Cynthia Brewer 设计），按数据类型分三类、每类 3-' + (t === 'qual' ? 12 : 11) + ' 个色块数可选，其中多数方案标注了色盲友好与打印安全。',
      schemes: groups[t].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
}

/* ---------- 6. Matplotlib 色图 (matplotlib 许可) ---------- */
{
  const py = read('viridis.py');
  const grab = name => {
    const start = py.indexOf(`_${name}_data`);
    if (start < 0) throw new Error('no ' + name);
    const open = py.indexOf('[', start);
    let depth = 0, end = open;
    for (let i = open; i < py.length; i++){          // 括号深度扫描，兼容 [...] 嵌套与 (...) 元组
      const ch = py[i];
      if (ch === '[' || ch === '(') depth++;
      else if (ch === ']' || ch === ')'){ depth--; if (depth === 0){ end = i; break; } }
    }
    const vals = py.slice(open, end).match(/\d*\.?\d+/g).map(Number);
    if (vals.length < 768) throw new Error(name + ' 解析点数异常: ' + vals.length / 3);
    const stops = [];
    for (let i = 0; i < vals.length; i += 3)
      stops.push('#' + vals.slice(i, i + 3).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase());
    return stops;
  };
  const sample = (stops, n = 24) => Array.from({ length: n }, (_, i) => stops[Math.round(i * (stops.length - 1) / (n - 1))]);
  const defs = [
    ['viridis', 'Viridis', '感知均匀、色盲友好的默认顺序色图，从深紫过渡到亮黄，暗背景下辨识度极佳。', false],
    ['plasma', 'Plasma', 'Viridis 的暖色姊妹版：深紫 → 品红 → 橙 → 亮黄，高对比顺序色图。', false],
    ['inferno', 'Inferno', '黑 → 紫 → 红 → 橙 → 亮黄，类似黑体辐射，适合热力类数据。', false],
    ['magma', 'Magma', '与 Inferno 相近但更柔和，黑 → 紫粉 → 橙 → 浅黄，感知均匀。', false],
    ['cividis', 'Cividis', '专为红绿色盲优化的蓝黄顺序色图，两类色盲下几乎无畸变。', false],
    ['turbo', 'Turbo', 'Google 改进的「彩虹」色图，比 jet 均匀但仍需谨慎——学术场景建议改用 Viridis 系。', true],
    ['twilight', 'Twilight', '循环色图：白 → 蓝 → 黑 → 蓝 → 白 首尾相接，适合角度、相位等循环数据。', false],
    ['managua', 'Managua', '循环色图（Crameri managua 的 matplotlib 版），绿-白-紫首尾闭环。', false],
    ['berlin', 'Berlin', '循环色图：黑 → 蓝 → 绿 → 白再回黑，首尾闭环，圆环图与相位图适用。', false],
    ['vanimo', 'Vanimo', '循环色图（Crameri vanimo 的 matplotlib 版）：红-灰-蓝首尾闭环，色盲友好。', false],
  ];
  for (const [key, name, desc, warn] of defs) {
    PALETTES.push({
      id: 'mpl-' + key, name, cn: `Matplotlib · ${name}`, category: 'viz', kind: 'map',
      license: 'matplotlib License（含色图分发条款）', source: 'https://matplotlib.org/stable/users/explain/colors/colormaps.html',
      attribution: '© Matplotlib developers (PSF-style license, colormap terms)',
      desc, warn: warn || undefined,
      stops: sample(grab(key)),
    });
  }
}

/* ---------- 7. Scientific Colour Maps (免费使用，需引用) ---------- */
{
  const loadTxt = f => read(f).trim().split('\n').map(line => {
    const [r, g, b] = line.trim().split(/\s+/).map(Number);
    return '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  });
  const sample = (stops, n = 24) => Array.from({ length: n }, (_, i) => stops[Math.round(i * (stops.length - 1) / (n - 1))]);
  const defs = [
    ['batlow.txt', 'Batlow', '顺序', 'Crameri 最流行的感知均匀色图：深蓝 → 青 → 黄 → 橙红，学术出版首选之一。'],
    ['roma.txt', 'Roma', '发散', '冷 → 浅 → 暖的发散色图，适合表示相对某中心值的正负偏差。'],
    ['vik.txt', 'Vik', '发散', '深蓝 ↔ 深红的强对比发散色图，中间经浅色过渡。'],
    ['bam.txt', 'Bam', '发散', '蓝 ↔ 棕的柔和发散色图，感知均匀。'],
    ['sci-bamako.txt', 'Bamako', '顺序', '感知均匀顺序色图。'],
    ['sci-bilbao.txt', 'Bilbao', '顺序', '感知均匀顺序色图。'],
    ['sci-broc.txt', 'Broc', '发散', '棕 ↔ 蓝的发散色图。'],
    ['sci-davos.txt', 'Davos', '顺序', '感知均匀顺序色图。'],
    ['sci-devon.txt', 'Devon', '顺序', '感知均匀顺序色图。'],
    ['sci-grayC.txt', 'GrayC', '顺序', '灰度感知均匀色图，适合印刷与单色场景。'],
    ['sci-hawaii.txt', 'Hawaii', '顺序', '蓝 → 绿 → 黄的顺序色图。'],
    ['sci-imola.txt', 'Imola', '顺序', '感知均匀顺序色图。'],
    ['sci-lajolla.txt', 'La Jolla', '顺序', '白 → 黄 → 深红的顺序色图，热力数据常用。'],
    ['sci-lapaz.txt', 'La Paz', '顺序', '深蓝 → 青 → 亮的顺序色图。'],
    ['sci-lipari.txt', 'Lipari', '顺序', '感知均匀顺序色图。'],
    ['sci-lisbon.txt', 'Lisbon', '发散', '蓝 ↔ 红的发散色图。'],
    ['sci-navia.txt', 'Navia', '发散', '蓝 ↔ 黄棕的发散色图。'],
    ['sci-oleron.txt', 'Oléron', '顺序', '感知均匀顺序色图。'],
    ['sci-oslo.txt', 'Oslo', '顺序', '感知均匀顺序色图，黑白印刷友好。'],
    ['sci-tofino.txt', 'Tofino', '发散', '青 ↔ 棕的发散色图。'],
    ['sci-tokyo.txt', 'Tokyo', '发散', '深蓝 ↔ 深红的发散色图。'],
    ['sci-turku.txt', 'Turku', '顺序', '感知均匀顺序色图。'],
  ];
  for (const [f, name, type, desc] of defs) {
    PALETTES.push({
      id: 'sci-' + name.toLowerCase(), name, cn: `科学色图 · ${name}`, category: 'viz', kind: 'map',
      license: '免费使用，学术出版需引用 Crameri et al.', source: 'https://www.fabiocrameri.ch/colourmaps.php',
      attribution: '© Fabio Crameri — Scientific Colour Maps（使用需按要求引用）',
      desc, mapType: type,
      stops: sample(loadTxt(f)),
    });
  }
}

/* ---------- 8. Catppuccin (MIT) ---------- */
{
  const j = JSON.parse(read('catppuccin.json'));
  const cnFlavor = { latte: 'Latte · 浅色', frappe: 'Frappé', macchiato: 'Macchiato', mocha: 'Mocha · 深色' };
  const pastel = { latte: '#eff1f5', frappe: '#303446', macchiato: '#24273a', mocha: '#1e1e2e' };
  for (const f of ['latte', 'frappe', 'macchiato', 'mocha']) {
    const cols = j[f].colors;
    const colors = Object.entries(cols).map(([k, v]) => ({ name: k, hex: assertHex(v.hex) }));
    PALETTES.push({
      id: 'catppuccin-' + f, name: 'Catppuccin ' + j[f].name, cn: `Catppuccin · ${cnFlavor[f]}`, category: 'editor', kind: 'palette',
      license: 'MIT', source: 'https://catppuccin.com/',
      attribution: '© Catppuccin community (MIT)',
      desc: '低饱和「奶咖」主题，社区庞大、移植到上百个应用；' + (f === 'latte' ? '这是浅色款。' : '这是深色款，背景越深色彩越柔。'),
      colors, bg: pastel[f],
    });
  }
}

/* ---------- 9. Nord (MIT) ---------- */
{
  const scss = read('nord.scss');
  const found = [...scss.matchAll(/\$nord(\d+):\s*#([0-9a-fA-F]{6})/g)];
  if (found.length !== 16) throw new Error('nord parse: ' + found.length);
  const names = ['Polar Night 1','Polar Night 2','Polar Night 3','Polar Night 4',
    'Snow Storm 1','Snow Storm 2','Snow Storm 3','Frost 1','Frost 2','Frost 3','Frost 4',
    'Aurora Red','Aurora Orange','Aurora Yellow','Aurora Green','Aurora Violet'];
  PALETTES.push({
    id: 'nord', name: 'Nord', cn: 'Nord · 极地冷蓝主题', category: 'editor', kind: 'palette',
    license: 'MIT', source: 'https://www.nordtheme.com/',
    attribution: '© Sven Greb / Nord (MIT)',
    desc: '北极意象的 16 色主题：Polar Night 深底、Snow Storm 前景、Frost 冷蓝、Aurora 点缀，干净耐看的深色 UI 经典。',
    colors: found.map((m, i) => ({ name: `nord${m[1]} · ${names[i]}`, hex: assertHex('#' + m[2]) })),
    bg: '#2E3440',
  });
}

/* ---------- 10. Dracula (MIT) ---------- */
{
  const md = read('dracula.md');
  const rows = [...md.matchAll(/^\| (.+?) +\| `#([0-9a-fA-F]{6})`/gm)];
  const take = [];
  for (const r of rows) {
    if (/Background/i.test(r[1]) && take.length) break;   // 第二张表（变体）开始即停
    take.push({ name: r[1].trim(), hex: assertHex('#' + r[2]) });
  }
  if (take.length < 10) throw new Error('dracula parse: ' + take.length);
  PALETTES.push({
    id: 'dracula', name: 'Dracula', cn: 'Dracula · 吸血鬼紫主题', category: 'editor', kind: 'palette',
    license: 'MIT', source: 'https://draculatheme.com/',
    attribution: '© Zeno Rocha / Dracula Theme (MIT)',
    desc: '深紫底 + 高饱和荧光色的暗色主题顶流，识别度极高，被移植到 300+ 编辑器与应用。',
    colors: take, bg: '#282A36',
  });
}

/* ---------- 11. Solarized (MIT，官方 README 校验) ---------- */
{
  const colors = [
    ['base03 最深底', '#002B36'], ['base02 深底/高亮', '#073642'],
    ['base01 注释/次要文字', '#586E75'], ['base00 强调正文', '#657B83'],
    ['base0 正文', '#839496'], ['base1 次要前景', '#93A1A1'],
    ['base2 浅底/高亮', '#EEE8D5'], ['base3 最浅底', '#FDF6E3'],
    ['yellow', '#B58900'], ['orange', '#CB4B16'], ['red', '#DC322F'], ['magenta', '#D33682'],
    ['violet', '#6C71C4'], ['blue', '#268BD2'], ['cyan', '#2AA198'], ['green', '#859900'],
  ];
  PALETTES.push({
    id: 'solarized', name: 'Solarized', cn: 'Solarized · 太阳能双模式主题', category: 'editor', kind: 'palette',
    license: 'MIT', source: 'https://ethanschoonover.com/solarized/',
    attribution: '© Ethan Schoonover, Solarized (MIT) — 色值已与官方 README 校验',
    desc: '精心校准明度的 16 色体系，同一组色值同时服务深色（base03 底）与浅色（base3 底）两种模式，降低视觉疲劳的经典。',
    colors: colors.map(([name, hex]) => ({ name, hex })), bg: '#002B36',
  });
}

/* ---------- 12. 中国传统色 (MIT, zerosoul/chinese-colors) ---------- */
{
  const j = JSON.parse(read('chinese-colors.json'));
  for (const fam of j) {
    if (!fam.colors || !fam.colors.length) continue;
    PALETTES.push({
      id: 'cn-' + fam.hex.slice(1), name: 'Chinese Traditional · ' + fam.name, cn: `中国传统色 · ${fam.name}系`, category: 'traditional', kind: 'palette',
      license: 'MIT', source: 'https://github.com/zerosoul/chinese-colors/',
      attribution: '数据来源 zerosoul/chinese-colors (MIT)，色名考据源自《中国传统色谱》类公开资料',
      desc: `「${fam.name}」色系传统色名与色值 ${fam.colors.length} 条，点击色块可看色名。`,
      colors: fam.colors.map(c => ({ name: c.name, hex: assertHex(c.hex) })),
      bg: '#F7F4EE',
    });
  }
}

/* ---------- 13. 日本の伝統色 (数据来自 nipponcolors 镜像, MIT) ---------- */
{
  const j = JSON.parse(read('nippon.json'));
  PALETTES.push({
    id: 'nippon', name: 'Nippon Colors', cn: '日本の伝統色 · 传统色 250 选', category: 'traditional', kind: 'palette',
    license: 'MIT（nipponcolors 整理数据）', source: 'https://nipponcolors.com/',
    attribution: '数据整理自 nipponcolors.com 的开源镜像 lcat/nippon-colors (MIT)',
    desc: '日本传统色名（罗马字 + 汉字名）与色值约 250 条，源自日本传统色系谱，气质细腻克制。',
    colors: j.map(c => ({ name: `${c.cname}（${c.name}）`, hex: assertHex('#' + c.color) })),
    bg: '#F4F2EE',
  });
}

/* ---------- 14. Material Design 2 色板（Google, Apache-2.0） ---------- */
{
  const j = JSON.parse(read('material-colors.json'));
  const scales = [];
  const numKey = k => (/^A/.test(k) ? 1000 + parseInt(k.slice(1), 10) : parseInt(k, 10));
  for (const [hue, variants] of Object.entries(j)) {
    if (typeof variants !== 'object' || variants === null || hue === 'black' || hue === 'white') continue;
    const entries = Object.entries(variants);
    if (!entries.length || !entries.every(([, v]) => /^#[0-9a-fA-F]{6}$/i.test(v))) continue;
    const main = entries.filter(([k]) => !/^A/.test(k)).sort((a, b) => numKey(a[0]) - numKey(b[0]));
    const acc = entries.filter(([k]) => /^A/.test(k)).sort((a, b) => numKey(a[0]) - numKey(b[0]));
    if (main.length >= 8) scales.push({ name: hue, steps: main.map(([, v]) => assertHex(v)) });
    if (acc.length >= 3) scales.push({ name: hue + '（强调色）', steps: acc.map(([, v]) => assertHex(v)) });
  }
  PALETTES.push({
    id: 'material2', name: 'Material Design 2', cn: 'Material Design 2 · 经典色板', category: 'ui', kind: 'multiscale',
    license: 'Apache-2.0', source: 'https://m2.material.io/design/color/the-color-system.html',
    attribution: '© Google, Material Design 色板 (Apache-2.0) · 数据镜像 material-colors (MIT)',
    desc: 'Google 经典 MD 色板：18 色相 × 10 阶 + 500 系强调色，Android/Google 生态十年标准，500 号即官方主色。',
    scales,
  });
}

/* ---------- 15. Material Design 3 音调色板（官方 material-color-utilities 生成, Apache-2.0） ---------- */
{
  const j = JSON.parse(read('m3-tonal.json'));
  const order = { primary: 0, secondary: 1, tertiary: 2, error: 3, neutral: 4, neutralVariant: 5 };
  const scales = Object.entries(j.palettes)
    .sort((a, b) => (order[a[0]] ?? 9) - (order[b[0]] ?? 9))
    .map(([key, pal]) => ({
      name: key,
      cnName: pal.label,
      steps: pal.tones.slice().sort((a, b) => b.tone - a.tone).map(t => assertHex(t.hex)), // tone 100→0，浅→深
    }));
  PALETTES.push({
    id: 'material3', name: 'Material Design 3', cn: 'Material Design 3 · 音调色板', category: 'ui', kind: 'multiscale',
    license: 'Apache-2.0', source: 'https://m3.material.io/styles/color/system',
    attribution: '© Google，由官方 material-color-utilities (Apache-2.0) 从基线主色 #6750A4 经 HCT 色彩空间生成',
    desc: 'M3 动态配色的核心：6 组 13 档音调（tone）色板，由 HCT（感知色相/色度/音调）空间生成——tone 40 ≈ 主色、tone 80 ≈ 暗色主题主色、tone 10 ≈ 深底文字。',
    scales,
  });
}

/* ---------- 16. IBM Carbon（Apache-2.0） ---------- */
{
  const j = JSON.parse(read('carbon-pkg/package/tokens/colors.tokens.json'));
  const cnHue = { black: '黑', white: '白', blue: '蓝', gray: '灰', 'cool-gray': '冷灰', 'warm-gray': '暖灰', cyan: '青', teal: '蓝绿', green: '绿', yellow: '黄', orange: '橙', red: '红', magenta: '品红', purple: '紫' };
  const scales = [];
  for (const [hue, variants] of Object.entries(j)) {
    if (!variants || typeof variants !== 'object' || String(hue).startsWith('$')) continue;
    const entries = Object.entries(variants)
      .filter(([k]) => Number.isInteger(Number(k)))
      .sort((a, b) => Number(a[0]) - Number(b[0]));
    if (entries.length < 6) continue;
    const steps = entries.map(([, tok]) => {
      const v = tok && tok.$value || tok.value;
      let hex = null;
      if (typeof v === 'string') hex = v;
      else if (v && v.components) hex = rgbToHexSafe(v.components);
      return hex ? assertHex(hex) : null;
    }).filter(Boolean);
    if (steps.length >= 6) scales.push({ name: hue, cnName: (cnHue[hue] || hue), steps });
  }
  function rgbToHexSafe(c){ return '#' + c.slice(0, 3).map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase(); }
  if (scales.length < 10) throw new Error('carbon parse: ' + scales.length);
  PALETTES.push({
    id: 'carbon', name: 'IBM Carbon', cn: 'IBM Carbon · 企业级色板', category: 'ui', kind: 'multiscale',
    license: 'Apache-2.0', source: 'https://carbondesignsystem.com/guidelines/color/usage/',
    attribution: '© IBM, Carbon Design System 官方 tokens v11 (Apache-2.0)',
    desc: 'IBM 设计语言的官方 token 色板：14 色系 × 10 阶（x0 最浅 → x100 最深），规范严谨、明度跨度均匀，企业级产品的老牌标杆（标志蓝 = blue60）。',
    scales,
  });
}

/* ---------- 17. Paletteer 聚合策展色板（GPL-3 聚合，69 包 ~2500 套） ---------- */
{
  const j = JSON.parse(read('paletteer-d.json'));
  // 与库内已有数据重复或纯工具型的包不重复收录
  const SKIP = new Set(['RColorBrewer', 'nord', 'grDevices', 'colorblindr', 'colorBlindness', 'dichromat']);
  const PKG_INFO = {
    palettetown: ['宝可梦配色', '宝可梦系列游戏角色/场景取色的社区色板合集'],
    fishualize: ['海洋鱼类配色', '从海洋鱼类与珊瑚礁生物取色的自然色板'],
    beyonce: ['碧昂丝专辑配色', '碧昂丝各专辑视觉与 MV 取色'],
    nbapalettes: ['NBA 球队配色', 'NBA 各球队官方队色'],
    lisa: ['美术馆名画配色', '从美术馆藏画取色的社区色板（lisa 包）'],
    ggthemes: ['经济学人与经典图表风', 'Economist/Excel/WSJ/Stata 等经典出版与软件风格'],
    ggsci: ['科学期刊配色', 'NPG/AAAS/NEJM/Lancet/JAMA 等期刊视觉规范'],
    ggprism: ['GraphPad 出版风', '模仿 GraphPad Prism 软件的出版风格色板'],
    tvthemes: ['影视动画配色', '瑞克与莫蒂/冒险时光/怪奇物语/辛普森等影视动画'],
    MetBrewer: ['大都会艺术馆配色', '大都会艺术博物馆馆藏作品取色'],
    colRoz: ['澳洲自然配色', '澳洲动植物与地貌取色'],
    palettesForR: ['R 社区通用色板', 'R 社区常用通用色板合集'],
    PrettyCols: [' PrettyCols', '美观易用的多用途 R 色板'],
    calecopal: ['加州生态配色', '加州植物与生态取色'],
    poisonfrogs: ['箭毒蛙配色', '箭毒蛙物种取色——自然界最艳丽的警戒色'],
    Redmonder: ['MSDN 风', '微软文档风格色板'],
    MoMAColors: ['MoMA 展览配色', '纽约现代艺术博物馆展览视觉'],
    rcartocolor: ['CARTO 地图配色', 'CARTO 出品的地图学配色规范'],
    trekcolors: ['星际迷航配色', '星际迷航系列舰徽/种族/剧集取色'],
    ButterflyColors: ['蝴蝶配色', '蝴蝶物种取色'],
    NatParksPalettes: ['国家公园配色（NatParks）', '各国国家公园风景取色'],
    ghibli: ['吉卜力配色', '龙猫/千与千寻/天空之城等吉卜力动画取色'],
    nationalparkcolors: ['国家公园配色', '美国国家公园风景取色'],
    impressionistcolors: ['印象派配色', '印象派画作取样'],
    ltc: ['LTC 配色', 'ltc 包社区色板'],
    wesanderson: ['韦斯·安德森电影配色', '布达佩斯大饭店/月升王国等韦斯·安德森电影取色'],
    tayloRswift: ['Taylor Swift 专辑配色', '霉霉各专辑视觉取色'],
    LaCroixColoR: ['LaCroix 气泡水配色', 'LaCroix 气泡水包装配色'],
    Manu: ['新西兰鸟类配色', '新西兰本土鸟类取色（Manu 包）'],
    peRReo: ['拉丁音乐配色', '拉丁音乐人 MV 与专辑取色'],
    rockthemes: ['摇滚专辑配色', '经典摇滚专辑封面取色'],
    yarrr: ['海盗配色', 'R 海盗主题包的航海配色'],
    futurevisions: ['复古太空海报配色', 'NASA 风格复古未来主义海报取色'],
    DresdenColor: ['德累斯顿档案配色', '科幻小说《德累斯顿档案》各卷取色'],
    ggthemr: ['ggthemr 主题色板', 'ggthemr 包的整体图表主题配色'],
    MexBrewer: ['墨西哥配色', '墨西哥建筑、电影与艺术取色'],
    werpals: ['werpals 社区色板', 'werpals 包色板合集'],
    miscpalettes: ['杂选色板', 'miscpalettes 包的杂类色板'],
    IslamicArt: ['伊斯兰艺术配色', '伊斯兰艺术与建筑取色'],
    ochRe: ['澳洲原住民艺术配色', '澳洲原住民艺术与文化取色（ochRe 包）'],
    unikn: ['unikn 学术色板', 'unikn 包的学术机构风格色板'],
    Rdune: ['沙丘配色', '电影《沙丘》美术取色'],
    rtist: ['艺术家配色', '以艺术家命名的社区色板（rtist 包）'],
    vangogh: ['梵高配色', '梵高画作取色'],
    waRhol: ['安迪·沃霍尔配色', '沃霍尔波普艺术作品取色'],
    PNWColors: ['太平洋西北配色', '美国太平洋西北地区风景取色'],
    soilpalettes: ['土壤学配色', '土壤剖面与土壤类型取色——冷门但严谨'],
    vapoRwave: ['蒸汽波配色', 'Vaporwave 美学色板'],
    jcolors: ['jcolors 亮色板', '高饱和通用亮色板'],
    feathers: ['鸟类羽毛配色', '鸟类羽毛物种取色'],
    NineteenEightyR: ['80 年代配色', '1980 年代流行文化取色'],
    basetheme: ['basetheme 主题色板', 'R base 绘图主题色板'],
    pals: ['pals 色板集', 'pals 包的多用途色板'],
    Polychrome: ['Polychrome 多色板', '面向分类数据的多色色板算法输出'],
    vapeplot: ['Vapewave 配色', '合成器波/蒸汽波美学'],
    musculusColors: ['座头鲸配色', '座头鲸及相关海洋生物取色'],
    severance: ['人生切割术配色', 'Apple TV+ 剧集《人生切割术》美术取色'],
    awtools: ['awtools 图表色板', 'awtools 包的仪表盘图表配色'],
    dutchmasters: ['荷兰黄金时代配色', '伦勃朗/维米尔等荷兰大师画作取色'],
    MapPalettes: ['地图配色', 'MapPalettes 包的制图配色'],
    suffrager: ['妇女参政配色', '英国妇女参政运动历史海报取色'],
    amerika: ['美国政治配色', '美国政党与选举地图色板'],
    RSkittleBrewer: ['彩虹糖配色', 'Skittles/M&M 糖果包装配色'],
    blueycolors: ['布鲁伊配色', '动画《布鲁伊》取色'],
    tidyquant: ['金融图表配色', 'tidyquant 金融可视化主题'],
    ggpomological: ['果园手绘配色', '美国农业部果园手绘图鉴取色'],
  };
  let added = 0, addedSets = 0;
  for (const [pkg, pals] of Object.entries(j)) {
    if (SKIP.has(pkg)) continue;
    const to6 = c => (/^#[0-9a-fA-F]{8}$/.test(c) ? c.slice(0, 7) : c);   // 8 位 RGBA → 丢弃 alpha（paletteer 部分包为 #RRGGBBAA）
    const sets = Object.entries(pals)
      .filter(([, v]) => Array.isArray(v) && v.length >= 3 && v.every(c => /^#[0-9a-fA-F]{6}$/.test(to6(c))))
      .map(([name, colors]) => ({ name, colors: colors.map(c => assertHex(to6(c))) }));
    if (!sets.length) continue;
    const [cn, desc] = PKG_INFO[pkg] || [pkg, pkg + ' 包社区色板'];
    PALETTES.push({
      id: 'p-' + pkg.toLowerCase(), name: pkg,
      cn: `${cn.trim()} · ${sets.length} 套`, category: 'curated', kind: 'set',
      license: 'GPL-3（paletteer 聚合，原包以其自身许可发布）',
      source: 'https://github.com/EmilHvitfeldt/paletteer',
      attribution: `© ${pkg} 原作者，经 EmilHvitfeldt/paletteer (GPL-3) 聚合`,
      desc: `${desc}——共 ${sets.length} 套。`,
      sets,
    });
    added++; addedSets += sets.length;
  }
  console.log(`paletteer: ${added} 包 ${addedSets} 套`);
}

/* ---------- 18. uiGradients 渐变合集（MIT） ---------- */
{
  const j = JSON.parse(read('uigradients.json'));
  const sets = j.filter(g => Array.isArray(g.colors) && g.colors.length >= 2)
    .map(g => ({ name: g.name, colors: g.colors.map(c => assertHex(c)) }));
  if (sets.length < 100) throw new Error('uigradients parse: ' + sets.length);
  PALETTES.push({
    id: 'uigradients', name: 'uiGradients', cn: `uiGradients · ${sets.length} 条网页渐变`, category: 'curated', kind: 'gradset',
    license: 'MIT', source: 'https://uigradients.com/',
    attribution: '© uiGradients 社区贡献者 (MIT，ghosh/uiGradients)',
    desc: '社区维护的网页设计渐变色合集，每条含 2-5 个锚点色，CSS 一行即可复用。',
    sets,
  });
}

/* ---------- 输出 ---------- */
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const banner = `/* palettes.js — 由 scratch/transform.js 自动生成
 * 数据均为各开源项目公开发布的配色数据，逐条附协议与署名；文案为原创。
 * 生成时间: ${new Date().toISOString()}
 */\nwindow.PALETTES = `;
fs.writeFileSync(OUT, banner + JSON.stringify(PALETTES) + ';\n');
// 同步输出 ColorCat MCP 用的纯 JSON
const MCP_OUT = path.join(__dirname, '..', 'colorcat-mcp', 'data.json');
fs.writeFileSync(MCP_OUT, JSON.stringify(PALETTES));
console.log(`同步输出: ${MCP_OUT}`);
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`palettes.js 写出: ${PALETTES.length} 组色板, ${kb} KB`);
for (const p of PALETTES) {
  const n = p.scales ? p.scales.length + ' 色相' : p.schemes ? p.schemes.length + ' 方案' : p.stops ? p.stops.length + ' 渐变点' : p.sets ? p.sets.length + ' 套' : p.colors.length + ' 色';
  console.log(`  [${p.category}] ${p.id} (${n})`);
}
