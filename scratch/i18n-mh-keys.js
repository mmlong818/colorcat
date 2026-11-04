/* i18n: 多色和谐 + 色名库 + 色卡图 键（5 语言） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/i18n.js';
let t = fs.readFileSync(p, 'utf8');
const KEYS = {
  zh: [
    "  'mh.h': '多色和谐配色',",
    "  'mh.hint': '输入 2–3 个基色，选择和谐方案：每个基色的整套关系色合并去重——适合多主体/多品牌界面的统一配色。',",
    "  'mh.gen': '生成联合配色',",
    "  'mh.done': '{n} 色（去重后）· 基色: {bases}',",
    "  'mh.need2': '至少需要 2 个有效基色',",
    "  'names.db': '色名库最近',",
    "  'names.exactSuffix': '（精确）',",
    "  'btn.card': '色卡图',",
    "  'toast.cardSaved': '已下载色卡图 {file}',",
  ],
  en: [
    "  'mh.h': 'Multi-base harmony',",
    "  'mh.hint': 'Enter 2–3 base colors and pick a scheme: each base\\'s full relation colors are merged and deduplicated — ideal for unified multi-brand/multi-subject interfaces.',",
    "  'mh.gen': 'Generate union',",
    "  'mh.done': '{n} colors (deduplicated) · bases: {bases}',",
    "  'mh.need2': 'At least 2 valid base colors required',",
    "  'names.db': 'Nearest in DB',",
    "  'names.exactSuffix': ' (exact)',",
    "  'btn.card': 'Palette card',",
    "  'toast.cardSaved': 'Palette card {file} downloaded',",
  ],
  fr: [
    "  'mh.h': 'Harmonie multi-base',",
    "  'mh.hint': 'Entrez 2–3 couleurs de base et choisissez un schéma : les couleurs relationnelles de chaque base sont fusionnées — idéal pour les interfaces multi-marques.',",
    "  'mh.gen': 'Générer l\\'union',",
    "  'mh.done': '{n} couleurs (dédupliquées) · bases : {bases}',",
    "  'mh.need2': 'Au moins 2 couleurs de base valides requises',",
    "  'names.db': 'Plus proche en base',",
    "  'names.exactSuffix': ' (exact)',",
    "  'btn.card': 'Carte palette',",
    "  'toast.cardSaved': 'Carte {file} téléchargée',",
  ],
  ru: [
    "  'mh.h': 'Многобазная гармония',",
    "  'mh.hint': 'Введите 2–3 базовых цвета и выберите схему: наборы цветов каждой базы объединяются — для единообразия многосоставных интерфейсов.',",
    "  'mh.gen': 'Сгенерировать объединение',",
    "  'mh.done': '{n} цветов (после дедупликации) · базы: {bases}',",
    "  'mh.need2': 'Требуется минимум 2 корректных базовых цвета',",
    "  'names.db': 'Ближайшее в базе',",
    "  'names.exactSuffix': ' (точное)',",
    "  'btn.card': 'Карта палитры',",
    "  'toast.cardSaved': 'Карта {file} скачана',",
  ],
  ja: [
    "  'mh.h': 'マルチベース ハーモニー',",
    "  'mh.hint': 'ベース色を 2–3 色入れてスキームを選ぶと、各ベースの関係色を統合・重複除去 — マルチブランド UI の統一配色に。',",
    "  'mh.gen': '統合配色を生成',",
    "  'mh.done': '{n} 色（重複除去後）· ベース: {bases}',",
    "  'mh.need2': '有効なベース色が 2 色以上必要です',",
    "  'names.db': 'DB 最近接',",
    "  'names.exactSuffix': '（完全一致）',",
    "  'btn.card': 'パレットカード',",
    "  'toast.cardSaved': '{file} をダウンロードしました',",
  ],
};
for (const [loc, blockLines] of Object.entries(KEYS)) {
  const start = t.indexOf(`\n${loc}: {`);
  if (start < 0) { console.log(loc, 'LOCALE MISSING'); continue; }
  const gi = t.indexOf("'scale.modeSemantic':", start);
  if (gi < 0) { console.log(loc, 'anchor missing'); continue; }
  const le = t.indexOf('\n', gi);
  t = t.slice(0, le) + '\n' + blockLines.join('\n') + t.slice(le);
  console.log(loc, 'inserted', blockLines.length);
}
fs.writeFileSync(p, t);
