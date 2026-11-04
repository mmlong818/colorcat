/* 从 JSON 读翻译插入 i18n.js（JSON.parse 校验转义，绕开手写转义问题） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/i18n.js';
let t = fs.readFileSync(p, 'utf8');
const tr = JSON.parse(fs.readFileSync('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/pipeline/desc-translations.json', 'utf8'));

for (const [loc, dict] of Object.entries(tr)) {
  const start = t.indexOf(`\n${loc}: {`);
  if (start < 0) { console.log(loc, 'LOCALE MISSING'); continue; }
  // 锚点：该语言块内的 desc.curated 行
  const gi = t.indexOf("'desc.curated':", start);
  if (gi < 0) { console.log(loc, 'anchor missing'); continue; }
  const le = t.indexOf('\n', gi);
  const lines = Object.entries(dict).map(([k, v]) => {
    // 值中如有单引号需转义（法语 d'apps 等）
    const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `  '${k}': '${escaped}',`;
  }).join('\n');
  t = t.slice(0, le) + '\n' + lines + t.slice(le);
  console.log(loc, 'inserted', Object.keys(dict).length, 'keys');
}
fs.writeFileSync(p, t);
