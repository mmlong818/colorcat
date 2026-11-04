const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
let fixed = 0;
lines.forEach((l, i) => {
  if (/^const \$ = s => \[\.\.\.document\.querySelectorAll/.test(l)) {
    lines[i] = 'const $$ = s => [...document.querySelectorAll(s)];';
    fixed++;
  }
});
fs.writeFileSync(p, lines.join('\n'));
console.log('fixed', fixed);
