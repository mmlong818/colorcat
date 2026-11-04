/* 更新测试：工具数 11 + audit_contrast 断言 */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/test/client-test.mjs';
let t = fs.readFileSync(p, 'utf8');
let miss = 0, hit = 0;
const R = (o, n) => {
  if (!t.includes(o)) { console.log('MISS:', o.slice(0, 84).replace(/\n/g, '\\n')); miss++; return; }
  t = t.split(o).join(n); hit++;
};

R("check('工具数量 = 10', tools.tools.length === 10, `实际 ${tools.tools.length}`);",
  "check('工具数量 = 11', tools.tools.length === 11, `实际 ${tools.tools.length}`);");
R("['search_palettes','get_palette','convert_color','contrast_check','suggest_fix','generate_scale','check_gradient','simulate_vision','preview_roles','get_brewer_classes'].every",
  "['search_palettes','get_palette','convert_color','contrast_check','suggest_fix','generate_scale','check_gradient','simulate_vision','preview_roles','get_brewer_classes','audit_contrast'].every");

const audit = [
  "/* 9b. audit_contrast */",
  "{",
  "  const r = await call('audit_contrast', { bg: '#FFFFFF', colors: ['#000000', '#888888', 'zzz'] });",
  "  check('audit 3 行（含 1 解析失败）', r.rows?.length === 3 && r.rows[2].error === 'unparsed', JSON.stringify(r.rows?.[2]));",
  "  check('#000000 正文AA 过 (21:1)', r.rows?.[0].bodyAA === true && r.rows?.[0].ratio === 21, JSON.stringify(r.rows?.[0]));",
  "  check('#888888 仅大字/UI 过', r.rows?.[1].bodyAA === false && r.rows?.[1].largeAA === true && r.rows?.[1].uiComponent === true, JSON.stringify(r.rows?.[1]));",
  "  check('passBodyAA 计数 = 1', r.passBodyAA === 1);",
  "}",
  "",
  "/* 10. simulate_vision */",
].join('\n');
R('/* 10. simulate_vision */', audit);

fs.writeFileSync(p, t);
console.log(`done: ${hit} replaced, ${miss} missed`);
