const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/i18n.js';
let t = fs.readFileSync(p, 'utf8');
const anchor = "  'desc.nippon': 'About 250 Japanese traditional color names (romaji + kanji) with values — refined and restrained.',";
if (!t.includes(anchor)) { console.log('anchor missing'); process.exit(1); }
const ins = [
  "  'desc.mpl-viridis': 'Perceptually uniform, colorblind-friendly default sequential map — deep purple to bright yellow; superb on dark backgrounds.',",
  "  'desc.mpl-plasma': 'Viridis’ warmer sibling: deep purple → magenta → orange → bright yellow.',",
  "  'desc.mpl-inferno': 'Black → purple → red → orange → bright yellow, blackbody-like — great for heat data.',",
  "  'desc.mpl-magma': 'Softer than Inferno: black → purple-pink → orange → pale yellow.',",
  "  'desc.mpl-cividis': 'Blue-yellow sequential map optimized for red-green colorblindness — nearly no distortion for either type.',",
  "  'desc.mpl-turbo': 'Google’s improved rainbow — more even than jet, but prefer the Viridis family in publications.',",
  "  'desc.mpl-twilight': 'Cyclic: white → blue → black → blue → white; ideal for angles and phases.',",
  "  'desc.mpl-managua': 'Cyclic (Crameri managua in matplotlib): green-white-purple closed loop.',",
  "  'desc.mpl-berlin': 'Cyclic: black → blue → green → white → black — great for phase wheels.',",
  "  'desc.mpl-vanimo': 'Cyclic (Crameri vanimo): red-grey-blue closed loop, colorblind-friendly.',",
  "  'desc.sci': 'Perceptually uniform {type} colour map by Fabio Crameri — publication-grade; academic use requires citation.',",
  "  'mapType.顺序': 'sequential', 'mapType.发散': 'diverging', 'mapType.循环': 'cyclic',",
].join('\n');
t = t.replace(anchor, anchor + '\n' + ins);
fs.writeFileSync(p, t);
console.log('inserted');
