/* 测试更新：13 工具 + sample_colormap 断言；server.js 修 check_gradient 描述 */
const fs = require('fs');
let miss = 0, hit = 0;
const U = (p, pairs) => {
  let t = fs.readFileSync(p, 'utf8');
  for (const [o, n] of pairs) {
    if (!t.includes(o)) { console.log(p, 'MISS:', o.slice(0, 90).replace(/\n/g, '\\n')); miss++; continue; }
    t = t.split(o).join(n); hit++;
  }
  fs.writeFileSync(p, t);
};

U('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/server.js', [
  ["description: '检查 2-6 个锚点色构成的渐变（OKLab 感知均匀插值）：明度曲线是否出现亮带、相邻段在色盲视角下能否区分。返回采样色标与警告。',",
   "description: 'Check a 2-6 anchor gradient (OKLab perceptual interpolation) for lightness banding and colorblind distinguishability per segment; returns sampled stops and warnings. 检查 2-6 锚点渐变的亮带与色盲可区分性，返回采样色标与警告。',"],
]);

U('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/test/client-test.mjs', [
  ["check('工具数量 = 12', tools.tools.length === 12, `实际 ${tools.tools.length}`);",
   "check('工具数量 = 13', tools.tools.length === 13, `实际 ${tools.tools.length}`);"],
  ["'get_brewer_classes','audit_contrast','generate_m3'].every",
   "'get_brewer_classes','audit_contrast','generate_m3','sample_colormap'].every"],
  ["/* 10. simulate_vision */",
   `/* 9c. sample_colormap */
{
  const r = await call('sample_colormap', { paletteId: 'mpl-viridis', count: 5 });
  check('采样 5 档', r.colors?.length === 5, JSON.stringify(r.colors));
  check('首档=深紫 尾档=亮黄', r.colors?.[0] === '#440154' && r.colors?.[4] === '#FDE725', JSON.stringify(r.colors));
  check('附 CSS gradient', typeof r.gradientCss === 'string' && r.gradientCss.startsWith('linear-gradient'));
  const bad = await call('sample_colormap', { paletteId: 'tailwind' });
  check('非色图报错', bad.isError === true);
}

/* 10. simulate_vision */`],
]);

U('C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/colorcat-mcp/test/http-test.mjs', [
  ["check('listTools = 12', tools.tools.length === 12, String(tools.tools.length));",
   "check('listTools = 13', tools.tools.length === 13, String(tools.tools.length));"],
]);

console.log(`done: ${hit} replaced, ${miss} missed`);
