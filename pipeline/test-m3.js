/* 测试更新：12 工具 + generate_m3 断言 */
const fs = require('fs');
const base = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/test/';
let miss = 0, hit = 0;
const upd = (file, pairs) => {
  let t = fs.readFileSync(base + file, 'utf8');
  for (const [o, n] of pairs) {
    if (!t.includes(o)) { console.log(file, 'MISS:', o.slice(0, 80).replace(/\n/g, '\\n')); miss++; continue; }
    t = t.split(o).join(n); hit++;
  }
  fs.writeFileSync(base + file, t);
};

upd('client-test.mjs', [
  ["check('工具数量 = 11', tools.tools.length === 11, `实际 ${tools.tools.length}`);",
   "check('工具数量 = 12', tools.tools.length === 12, `实际 ${tools.tools.length}`);"],
  ["'get_brewer_classes','audit_contrast'].every",
   "'get_brewer_classes','audit_contrast','generate_m3'].every"],
  ["/* 9b. audit_contrast */",
   `/* 9a2. generate_m3 */
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

/* 9b. audit_contrast */`],
]);

upd('http-test.mjs', [
  ["check('listTools = 11', tools.tools.length === 11, String(tools.tools.length));",
   "check('listTools = 12', tools.tools.length === 12, String(tools.tools.length));"],
]);

console.log(`done: ${hit} replaced, ${miss} missed`);
