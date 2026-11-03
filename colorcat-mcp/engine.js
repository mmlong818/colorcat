/* ColorCat 引擎 — 纯函数色彩数学（与网页版共用同一套公式，无 DOM 依赖）
 * 基准验证：OKLCH 与 Björn Ottosson 公开数值吻合；对比度求解误差 <0.05；10 色往返无损 */

export const norm = h => ((h % 360) + 360) % 360;

export function hslToRgb(h, s, l){
  h = norm(h); s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}
export const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
export function hexToRgb(hex){
  hex = String(hex).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (d){
    s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(norm(h)), Math.round(s * 100), Math.round(l * 100)];
}
export function rgbToHsv(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return [Math.round(norm(h)), mx ? Math.round(d / mx * 100) : 0, Math.round(mx * 100)];
}
export function rgbToCmyk(r, g, b){
  const R = r / 255, G = g / 255, B = b / 255, k = 1 - Math.max(R, G, B);
  if (k === 1) return [0, 0, 0, 100];
  const f = v => Math.round((1 - v - k) / (1 - k) * 100);
  return [f(R), f(G), f(B), Math.round(k * 100)];
}
export const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
export const gam = c => c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055;
export const lum = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);

export function rgbToLab(r, g, b){
  const [rl, gl, bl] = [lin(r), lin(g), lin(b)];
  const X = (rl * .4124 + gl * .3576 + bl * .1805) / .95047;
  const Y = rl * .2126 + gl * .7152 + bl * .0722;
  const Z = (rl * .0193 + gl * .1192 + bl * .9505) / 1.08883;
  const f = t => t > .008856 ? Math.cbrt(t) : (7.787 * t) + 16 / 116;
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [Math.round(116 * fy - 16), Math.round(500 * (fx - fy)), Math.round(200 * (fy - fz))];
}
export function contrast(hex1, hex2){
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  if (!a || !b) return 1;
  const L1 = lum(...a), L2 = lum(...b);
  return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
}
export const inkOn = hex => { const rgb = hexToRgb(hex); return (.299 * rgb[0] + .587 * rgb[1] + .114 * rgb[2]) > 150 ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.95)'; };
export const lerpHex = (h1, h2, t) => {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return rgbToHex(...a.map((v, i) => Math.round(v + (b[i] - v) * t)));
};
export function hueName(h, s, l){
  if (l <= 8) return '近黑'; if (l >= 95) return '近白'; if (s <= 10) return '中性灰';
  for (const [lim, n] of [[15,'红'],[45,'橙'],[70,'黄'],[95,'黄绿'],[150,'绿'],[175,'青'],[200,'天蓝'],[255,'蓝'],[290,'紫'],[330,'品红'],[360,'红']])
    if (h <= lim) return n;
  return '红';
}
/** 宽松解析：#abc / #aabbcc / rgb(r,g,b) / hsl(h,s,l) → 规范 HEX */
export function parseColor(str){
  if (typeof str !== 'string') return null;
  const s = str.trim();
  let rgb = hexToRgb(s.startsWith('#') ? s : '#' + s);
  if (rgb) return rgbToHex(...rgb);
  let m = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (m){ const [r, g, b] = m.slice(1).map(Number); if ([r, g, b].every(v => v <= 255)) return rgbToHex(r, g, b); }
  m = s.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%?\s*,\s*(\d{1,3}(?:\.\d+)?)%?/i);
  if (m){ const [h, sa, l] = m.slice(1).map(Number); return rgbToHex(...hslToRgb(h, sa, l)); }
  return null;
}

/* ---------- OKLab / OKLCH（Björn Ottosson 公有领域成果） ---------- */
export function srgbToOklab(r, g, b){
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const l = Math.cbrt(.4122214708 * rl + .5363325363 * gl + .0514459929 * bl);
  const m = Math.cbrt(.2119034982 * rl + .6806995451 * gl + .1073969566 * bl);
  const s = Math.cbrt(.0883024619 * rl + .2817188376 * gl + .6299787005 * bl);
  return [
    .2104542553 * l + .7936177850 * m - .0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + .4505937099 * s,
    .0259040371 * l + .7827717662 * m - .8086757660 * s,
  ];
}
export function oklabToSrgbLinear(L, a, b){
  const l_ = L + .3963377774 * a + .2158037573 * b;
  const m_ = L - .1055613458 * a - .0638541728 * b;
  const s_ = L - .0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + .2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s,
    -.0041960863 * l - .7034186147 * m + 1.7076147010 * s,
  ];
}
export function srgbToOklch(hex){
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [L, a, b] = srgbToOklab(...rgb);
  return [L, Math.sqrt(a * a + b * b), norm(Math.atan2(b, a) * 180 / Math.PI)];
}
export function oklchInGamut(L, C, H){
  const rad = H * Math.PI / 180;
  return oklabToSrgbLinear(L, C * Math.cos(rad), C * Math.sin(rad)).every(v => v >= -.0002 && v <= 1.0002);
}
export function oklchToHex(L, C, H){
  const rad = H * Math.PI / 180;
  let c = C;
  while (c > 0 && !oklchInGamut(L, c, H)) c = Math.max(0, c - Math.max(.002, c * .04));
  const linC = oklabToSrgbLinear(L, c * Math.cos(rad), c * Math.sin(rad));
  return rgbToHex(...linC.map(v => Math.round(255 * Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, v))))))));
}
export function oklabToHex(L, a, b){
  const linC = oklabToSrgbLinear(L, a, b);
  return rgbToHex(...linC.map(v => Math.round(255 * Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, v))))))));
}
export function oklabGradientHex(anchors, t){
  const seg = (anchors.length - 1) * Math.min(1, Math.max(0, t));
  const i = Math.min(anchors.length - 2, Math.floor(seg));
  const f = seg - i;
  const A = srgbToOklab(...hexToRgb(anchors[i]));
  const B = srgbToOklab(...hexToRgb(anchors[i + 1]));
  return oklabToHex(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f);
}

/* ---------- 色觉模拟（Viénot 1999 近似） ---------- */
export const CVD_MATRIX = {
  prot: [[.567, .433, 0], [.558, .442, 0], [0, .242, .758]],
  deut: [[.625, .375, 0], [.7, .3, 0], [0, .3, .7]],
  trit: [[.95, .05, 0], [0, .433, .567], [0, .475, .525]],
};
export function simulate(hex, mode){
  if (!mode || mode === 'none') return hex;
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  if (mode === 'gray'){
    const g = Math.round(lum(...rgb) * 255);
    return rgbToHex(g, g, g);
  }
  const m = CVD_MATRIX[mode];
  const linC = rgb.map(lin);
  const out = [0, 1, 2].map(i => m[i][0] * linC[0] + m[i][1] * linC[1] + m[i][2] * linC[2]);
  return rgbToHex(...out.map(c => Math.max(0, Math.min(255, Math.round((c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055) * 255)))));
}

/* ---------- WCAG ---------- */
export function wcagVerdicts(r){
  return {
    aa_normal: r >= 4.5, aaa_normal: r >= 7,
    aa_large: r >= 3, aaa_large: r >= 4.5, ui_components: r >= 3,
  };
}
/** 对比度求解：固定色相与色度，二分搜索 OKLCH 明度命中目标 */
export function solveContrastStep(bgHex, target, H, C){
  const bgRgb = hexToRgb(bgHex);
  if (!bgRgb) return null;
  const bgLum = lum(...bgRgb);
  let lo = 0, hi = 1, best = null;
  const test = L => contrast(oklchToHex(L, C, H), bgHex);
  if (bgLum > 0.18){
    for (let i = 0; i < 34; i++){
      const mid = (lo + hi) / 2;
      if (test(mid) >= target){ best = mid; lo = mid; } else hi = mid;
    }
  } else {
    for (let i = 0; i < 34; i++){
      const mid = (lo + hi) / 2;
      if (test(mid) >= target){ best = mid; hi = mid; } else lo = mid;
    }
  }
  if (best === null) return null;
  const hex = oklchToHex(best, C, H);
  return { L: best, hex, reached: contrast(hex, bgHex) };
}

/* ---------- 色阶生成 ---------- */
export const SCALE_ROLES = ['页面背景', '浅背景', '悬停底色', '激活底色', '细边框', '边框', '强边框', '强调·悬停', '主色', '主色·按下', '次要文字', '标题文字'];
export function genScale(hex){
  const och = srgbToOklch(hex);
  if (!och) return null;
  const [L0, C0, H0] = och;
  const L9 = Math.min(.70, Math.max(.45, L0));
  const s1 = Math.min(1, Math.max(.2, (0.975 - L9) / 0.39));
  const s2 = Math.min(1, Math.max(.2, (L9 - 0.20) / 0.22));
  const LT = [0.97, 0.93, 0.90, 0.855, 0.80, 0.745, 0.70, 0.655, 0.58, 0.52, 0.45, 0.36];
  const CK = [0.06, 0.10, 0.22, 0.40, 0.58, 0.72, 0.84, 0.93, 1, 1.06, 1, 0.92];
  const steps = LT.map((t, i) => {
    const L = i < 8 ? L9 + (t - 0.58) * s1 : i > 8 ? L9 + (t - 0.58) * s2 : L9;
    return oklchToHex(L, Math.max(0.006, C0 * CK[i]), H0);
  });
  return { steps, L0, C0, H0, clamped: Math.abs(L9 - L0) > 0.01 };
}
export function genContrastScale(hex, bgHex, n, rMin, rMax){
  const och = srgbToOklch(hex);
  if (!och) return null;
  const [, C0, H0] = och;
  const C = Math.max(0.02, Math.min(C0, 0.16));
  const targets = Array.from({ length: n }, (_, i) => rMin * Math.pow(rMax / rMin, i / (n - 1)));
  const out = targets.map(t => {
    const s = solveContrastStep(bgHex, t, H0, C);
    return s ? { target: t, hex: s.hex, reached: s.reached } : { target: t, hex: bgHex, reached: 1 };
  });
  return { steps: out.map(o => o.hex), detail: out, bg: bgHex, clamped: false };
}

/* ---------- 修正建议（与网页版 renderFix 同逻辑） ---------- */
export function recommendScaleColors(palettes, fg, bg, target){
  const och = srgbToOklch(fg);
  if (!och) return [];
  const [, C0, H0] = och;
  const libs = ['tailwind', 'antd', 'opencolor', 'radix'].map(id => palettes.find(p => p.id === id)).filter(Boolean);
  const out = [];
  for (const lib of libs){
    for (const scale of lib.scales){
      scale.steps.forEach((hex, i) => {
        const r = contrast(hex, bg);
        if (r < target) return;
        const o = srgbToOklch(hex);
        if (!o) return;
        const dH = Math.min(Math.abs(o[2] - H0), 360 - Math.abs(o[2] - H0));
        const dC = Math.abs(o[1] - C0);
        out.push({ hex, r, lib: lib.name.replace(/ ·[\s\S]*$/, ''), scaleName: scale.cnName || scale.name, step: i + 1, d: dH * 2 + dC });
      });
    }
  }
  out.sort((a, b) => a.d - b.d);
  const seen = new Set(), res = [];
  for (const o of out){
    if (seen.has(o.lib)) continue;
    seen.add(o.lib); res.push(o);
    if (res.length >= 3) break;
  }
  return res;
}
export function suggestFix(palettes, fg, bg, target){
  const fgN = parseColor(fg), bgN = parseColor(bg);
  if (!fgN || !bgN) return { error: '无法解析颜色，支持 #hex / rgb() / hsl()' };
  fg = fgN; bg = bgN;
  const r = contrast(fg, bg);
  const res = { fg, bg, ratio: +r.toFixed(2), wcag: wcagVerdicts(r), suggestions: [] };
  if (r >= 7){ res.verdict = '已达 AAA，无需调整'; return res; }
  const seen = new Set([fg, bg]);
  const push = (action, hex, ratio) => {
    hex = hex.toUpperCase();
    if (!seen.has(hex) && ratio > r + 0.05){ seen.add(hex); res.suggestions.push({ action, hex, ratio: +ratio.toFixed(2) }); }
  };
  const tgt = target || (r < 4.5 ? 4.5 : 7);
  const fgOch = srgbToOklch(fg), bgOch = srgbToOklch(bg);
  if (fgOch){
    const s7 = solveContrastStep(bg, 7, fgOch[2], Math.min(fgOch[1], .16));
    if (s7) push('调整前景达 AAA（保色相）', s7.hex, contrast(s7.hex, bg));
    const s45 = solveContrastStep(bg, 4.5, fgOch[2], Math.min(fgOch[1], .16));
    if (s45) push('调整前景达 AA（保色相）', s45.hex, contrast(s45.hex, bg));
  }
  const kb = contrast('#000000', bg), wb = contrast('#FFFFFF', bg);
  const mono = kb >= wb ? ['#000000', kb, '黑'] : ['#FFFFFF', wb, '白'];
  push(`改用${mono[2]}色文字`, mono[0], mono[1]);
  if (bgOch){
    const sb = solveContrastStep(fg, 4.5, bgOch[2], Math.min(bgOch[1], .3));
    if (sb) push('调整背景达 AA（保色相）', sb.hex, contrast(fg, sb.hex));
  }
  const recs = recommendScaleColors(palettes, fg, bg, tgt);
  if (recs.length) res.readyMade = recs.map(o => ({ source: `${o.lib} ${o.scaleName} 第${o.step}阶`, hex: o.hex, ratio: +o.r.toFixed(2) }));
  if (r < 4.5 && r >= 3) res.note = '当前对比度仅适合大字号文字（≥3:1）与图形组件，不适合正文。';
  return res;
}

/* ---------- 渐变检查（chroma.js Palette Helper 思路） ---------- */
export function checkGradient(colors){
  if (!Array.isArray(colors) || colors.length < 2 || colors.length > 6)
    return { error: '需要 2-6 个锚点色' };
  const anchors = colors.map(c => parseColor(c)).filter(Boolean);
  if (anchors.length < 2) return { error: '有效锚点不足 2 个' };
  const samples = Array.from({ length: 9 }, (_, i) => oklabGradientHex(anchors, i / 8));
  const Ls = samples.map(h => srgbToOklch(h)[0]);
  const diffs = Ls.slice(1).map((L, i) => L - Ls[i]);
  const warnings = [];
  const signChanges = diffs.filter((d, i) => i && Math.sign(d) !== Math.sign(diffs[i - 1]) && Math.abs(d) > .004 && Math.abs(diffs[i - 1]) > .004).length;
  const issues = [];
  if (signChanges >= 2){
    issues.push({ type: 'band' });
    warnings.push('明度曲线多次转折，渐变可能出现「亮带/暗带」，建议调整中点色明度。');
  }
  for (const [mode, cn] of [['prot', '红色盲'], ['deut', '绿色盲'], ['trit', '蓝黄色盲']]){
    const sim = samples.map(h => simulate(h, mode));
    const des = sim.slice(1).map((h, i) => {
      const A = srgbToOklab(...hexToRgb(sim[i])), B = srgbToOklab(...hexToRgb(h));
      return Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
    });
    const mi = des.indexOf(Math.min(...des));
    if (des[mi] < 0.02){
      issues.push({ type: 'cvdSimilar', mode, seg: [mi + 1, mi + 2], de: +des[mi].toFixed(3) });
      warnings.push(`${cn}视角下第 ${mi + 1}-${mi + 2} 段几乎不可区分（ΔE≈${des[mi].toFixed(3)}），若用于分类请拉开两端色相。`);
    }
    const A = srgbToOklab(...hexToRgb(sim[0])), B = srgbToOklab(...hexToRgb(sim[sim.length - 1]));
    if (Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) < 0.03){
      issues.push({ type: 'cvdEnds', mode });
      warnings.push(`${cn}视角下首尾几乎同色，渐变失去方向感。`);
    }
  }
  return {
    anchors,
    samples: samples.map((h, i) => ({ hex: h, L: +Ls[i].toFixed(3) })),
    issues, warnings,
    ok: warnings.length === 0,
  };
}

/* ---------- 界面角色映射（与网页版 buildPreviewModel 同逻辑，无模拟） ---------- */
export function paletteRoles(p, hueIdx = 0, setIdx = 0){
  let roles, cat = [], ramp = [], note = '';
  let setColors = null, setName = '', isGrad = false;
  if (p.kind === 'set' || p.kind === 'gradset'){
    isGrad = p.kind === 'gradset';
    const idx = Math.max(0, Math.min(setIdx || 0, p.sets.length - 1));
    setColors = p.sets[idx].colors;
    setName = p.sets[idx].name;
  } else if (p.kind === 'palette'){
    setColors = p.colors.map(c => c.hex);
  }
  if (p.kind === 'multiscale'){
    const hue = p.scales[Math.min(hueIdx || 0, p.scales.length - 1)];
    const st = hue.steps, n = st.length;
    roles = { bg: st[0], surface: st[Math.min(1, n - 1)], border: st[Math.min(5, n - 1)], text: st[n - 1], accent: st[Math.round(n * .55)], accentText: inkOn(st[Math.round(n * .55)]) };
    cat = p.scales.filter((s, i) => i !== (hueIdx || 0)).map(s => s.steps[Math.round(s.steps.length * .55)]).slice(0, 8);
    ramp = Array.from({ length: 8 }, (_, i) => st[Math.round(i * (n - 1) / 7)]);
    note = `界面角色取自「${hue.name}」色阶不同明度位置，分类色取自其它色相同一位置。`;
  } else if (setColors){
    const colors = setColors;
    const bg = (!isGrad && p.bg) || colors.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)))[0];
    const text = colors.slice().sort((a, b) => contrast(b, bg) - contrast(a, bg))[0];
    const sat = colors.slice().sort((a, b) => { const [, sa] = rgbToHsl(...hexToRgb(a)), [, sb] = rgbToHsl(...hexToRgb(b)); return sb - sa; });
    roles = { bg, surface: lerpHex(bg, text, .06), border: lerpHex(bg, text, .22), text, accent: sat[0], accentText: inkOn(sat[0]) };
    const picked = [];
    for (const c of sat){
      if (picked.every(x => { const d = hexToRgb(x), e = hexToRgb(c); return Math.abs(d[0] - e[0]) + Math.abs(d[1] - e[1]) + Math.abs(d[2] - e[2]) > 90; })) picked.push(c);
      if (picked.length >= 8) break;
    }
    cat = picked;
    if (isGrad && colors.length >= 2){
      ramp = Array.from({ length: 8 }, (_, i) => oklabGradientHex(colors, i / 7));
      note = `渐变「${setName}」：数值映射建议按锚点 OKLab 插值。`;
    } else {
      const sorted = colors.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)));
      ramp = Array.from({ length: 8 }, (_, i) => sorted[Math.round(i * (sorted.length - 1) / 7)]);
      note = p.kind === 'palette'
        ? '背景取主题底色，文字取对比度最高者，强调色取饱和度最高者。'
        : `策展色板「${setName}」（${colors.length} 色）：背景取最浅色，文字取对比最高者，强调色取饱和度最高者。`;
    }
  } else if (p.kind === 'brewer'){
    const sch = p.schemes[0];
    const nums = Object.keys(sch.classes).map(Number).sort((a, b) => a - b);
    const cols = sch.classes[nums[0]];
    const sorted = cols.slice().sort((a, b) => lum(...hexToRgb(a)) - lum(...hexToRgb(b)));
    roles = { bg: sorted[0], surface: lerpHex(sorted[0], '#888888', -.08), border: lerpHex(sorted[0], sorted[sorted.length - 1], .5), text: sorted[sorted.length - 1], accent: cols[0], accentText: inkOn(cols[0]) };
    cat = cols.slice(0, 8);
    ramp = cols;
    note = `ColorBrewer ${sch.name}（${nums[0]} 类）。`;
  } else if (p.kind === 'map'){
    const st = p.stops;
    roles = { bg: st[1], surface: st[2], border: st[Math.round(st.length * .4)], text: st[st.length - 4] < st[1] ? st[0] : st[st.length - 1], accent: st[Math.round(st.length * .7)], accentText: inkOn(st[Math.round(st.length * .7)]) };
    cat = Array.from({ length: 8 }, (_, i) => st[Math.round(i * (st.length - 1) / 7)]);
    ramp = cat;
    note = '连续色图：数值 → 颜色插值映射。';
  }
  if (!roles) return null;
  return { roles, cat, ramp, note };
}
