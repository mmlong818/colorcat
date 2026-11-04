const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/app.js';
let t = fs.readFileSync(p, 'utf8');
const old = "['#mh1', '#mh2', '#mh3'].forEach(id => $('#' + id).addEventListener('input', renderMh));";
if (!t.includes(old)) { console.log('NOT FOUND'); process.exit(1); }
t = t.replace(old, "['mh1', 'mh2', 'mh3'].forEach(id => $('#' + id).addEventListener('input', renderMh));");
fs.writeFileSync(p, t);
console.log('fixed');
