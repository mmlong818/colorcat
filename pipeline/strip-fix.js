const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
const old = "  if (p.kind === 'palette') return `<div class=\"strip\">${stripOf(p.colors)}</div>`;";
if (!t.includes(old)) { console.log('NOT FOUND'); process.exit(1); }
t = t.replace(old, "  if (p.kind === 'palette') return `<div class=\"strip\">${stripOf(p.colors.map(c => c.hex))}</div>`;");
fs.writeFileSync(p, t);
console.log('fixed');
