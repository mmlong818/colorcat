/* transform.js: Lospec 集成块（修正版，避免 shell 反引号问题） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/pipeline/transform.js';
let t = fs.readFileSync(p, 'utf8');
// 先移除被 shell 污染的旧块（若有）
const badStart = t.indexOf("/* ---------- 19. Lospec");
if (badStart >= 0) {
  const badEnd = t.indexOf("/* ---------- 输出 ---------- */", badStart);
  if (badEnd > badStart) { t = t.slice(0, badStart) + t.slice(badEnd); console.log('removed polluted block'); }
}
if (t.includes("lospec-palettes")) { console.log('already added'); process.exit(0); }

const anchor = "/* ---------- 输出 ---------- */";
if (!t.includes(anchor)) { console.log('anchor missing'); process.exit(1); }

const L = [
  "/* ---------- 19. Lospec 像素色板（打包数据 CC0-1.0） ---------- */",
  "{",
  "  const dir = path.join(__dirname, 'dl', 'lospec-palettes');",
  "  if (fs.existsSync(dir)) {",
  "    const sets = [];",
  "    for (const f of fs.readdirSync(dir)) {",
  "      if (!f.endsWith('.json')) continue;",
  "      try {",
  "        const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));",
  "        if (!Array.isArray(j.colors) || j.colors.length < 3) continue;",
  "        const colors = j.colors.map(c => assertHex(c));",
  "        sets.push({ name: j.title || j.hashtag || f, colors, likes: parseInt(j.likes, 10) || 0 });",
  "      } catch (e) { /* 跳过坏文件 */ }",
  "    }",
  "    sets.sort((a, b) => b.likes - a.likes);",
  "    if (sets.length) {",
  "      PALETTES.push({",
  "        id: 'lospec', name: 'Lospec', cn: '像素色板 · Lospec ' + sets.length + ' 套', category: 'pixel', kind: 'set',",
  "        license: 'CC0-1.0', source: 'https://lospec.com/palette-list',",
  "        attribution: '© Lospec 社区投稿 · 数据打包 gagath/lospec-palette-scrapper (CC0-1.0)',",
  "        desc: '像素游戏/复古风格的限量色板（3–32 色），按点赞排序——低色数约束下的高效配色训练场。',",
  "        sets: sets.map(s => ({ name: s.name, colors: s.colors, likes: s.likes })),",
  "      });",
  "      console.log('lospec: ' + sets.length + ' 套');",
  "    }",
  "  }",
  "}",
  "",
].join('\n');
t = t.replace(anchor, L + anchor);
fs.writeFileSync(p, t);
console.log('lospec block added (clean)');
