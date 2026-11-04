/* i18n 新键：批量审计 + tooltip + 收藏导入（5 语言） */
const fs = require('fs');
const p = 'C:/Users/Admin/.zcode/workspace/draft-c802907b-f954-4ab6-b927-7f88599cef05/color-hub/i18n.js';
let t = fs.readFileSync(p, 'utf8');

const KEYS = {
  zh: `  'a11y.auditTitle': '批量对比度审计',
  'a11y.auditHint': '选一个背景色和一批颜色（来自色板或自定义），逐个判定正文 / 大字 / UI 三档是否达标——快速找出整套色阶里哪些能当文字色。',
  'a11y.auditPalette': '从色板',
  'a11y.auditCustom': '自定义颜色（每行一个 HEX，可选）',
  'a11y.auditCap': '颜色超过 {n} 个，仅显示前 {n} 行。',
  'lib.copyHint': '点击复制',
  'a11y.titleW': '与白色的对比度',
  'a11y.titleK': '与黑色的对比度',
  'lib.importFav': '导入收藏',
  'toast.favImported': '已导入 {n} 条收藏（未知 id 已忽略）',
  'toast.importFail': '导入失败：文件格式不正确',
  'a11y.auditNone': '没有可审计的颜色。`,
  en: `  'a11y.auditTitle': 'Batch contrast audit',
  'a11y.auditHint': 'Pick a background and a batch of colors (from a palette or custom); each is judged against body / large / UI thresholds — quickly find which steps work as text colors.',
  'a11y.auditPalette': 'From palette',
  'a11y.auditCustom': 'Custom colors (one HEX per line, optional)',
  'a11y.auditCap': 'More than {n} colors — showing the first {n}.',
  'lib.copyHint': 'Click to copy',
  'a11y.titleW': 'Contrast vs white',
  'a11y.titleK': 'Contrast vs black',
  'lib.importFav': 'Import favorites',
  'toast.favImported': 'Imported {n} favorites (unknown ids skipped)',
  'toast.importFail': 'Import failed: invalid file format',
  'a11y.auditNone': 'No colors to audit.`,
  fr: `  'a11y.auditTitle': 'Audit de contraste par lot',
  'a11y.auditHint': 'Choisissez un fond et un lot de couleurs (palette ou personnalisées) ; chaque couleur est jugée sur texte / grand / UI — repérez vite les niveaux utilisables en texte.',
  'a11y.auditPalette': 'Depuis une palette',
  'a11y.auditCustom': 'Couleurs personnalisées (un HEX par ligne, optionnel)',
  'a11y.auditCap': 'Plus de {n} couleurs — {n} premières affichées.',
  'lib.copyHint': 'Cliquez pour copier',
  'a11y.titleW': 'Contraste vs blanc',
  'a11y.titleK': 'Contraste vs noir',
  'lib.importFav': 'Importer les favoris',
  'toast.favImported': '{n} favoris importés (ids inconnus ignorés)',
  'toast.importFail': 'Import échoué : format invalide',
  'a11y.auditNone': 'Aucune couleur à auditer.`,
  ru: `  'a11y.auditTitle': 'Пакетная проверка контраста',
  'a11y.auditHint': 'Выберите фон и набор цветов (из палитры или свои); каждая проверяется по порогам текст / крупный / UI — быстро найдите ступени, пригодные для текста.',
  'a11y.auditPalette': 'Из палитры',
  'a11y.auditCustom': 'Свои цвета (один HEX в строке, необязательно)',
  'a11y.auditCap': 'Более {n} цветов — показаны первые {n}.',
  'lib.copyHint': 'Клик — копировать',
  'a11y.titleW': 'Контраст к белому',
  'a11y.titleK': 'Контраст к чёрному',
  'lib.importFav': 'Импорт избранного',
  'toast.favImported': 'Импортировано {n} (неизвестные id пропущены)',
  'toast.importFail': 'Импорт не удался: неверный формат',
  'a11y.auditNone': 'Нет цветов для проверки.`,
  ja: `  'a11y.auditTitle': '一括コントラスト監査',
  'a11y.auditHint': '背景色と色の集合（パレットまたはカスタム）を選び、本文 / 大きめ / UI の各基準を一括判定 — テキスト色に使える段階を素早く見つけます。',
  'a11y.auditPalette': 'パレットから',
  'a11y.auditCustom': 'カスタム色（1 行に 1 つの HEX、任意）',
  'a11y.auditCap': '{n} 色を超えたため先頭 {n} 件のみ表示。',
  'lib.copyHint': 'クリックでコピー',
  'a11y.titleW': '白とのコントラスト',
  'a11y.titleK': '黒とのコントラスト',
  'lib.importFav': 'お気に入りをインポート',
  'toast.favImported': '{n} 件をインポート（未知の id は無視）',
  'toast.importFail': 'インポート失敗：形式が不正です',
  'a11y.auditNone': '監査する色がありません.`,
};

for (const [loc, block] of Object.entries(KEYS)) {
  const start = t.indexOf(`\n${loc}: {`);
  if (start < 0) { console.log(loc, 'LOCALE MISSING'); continue; }
  const end = start + 1;
  // 在该语言块内找 'a11y.copyHint' 行
  const gi = t.indexOf("'a11y.copyHint':", start);
  if (gi < 0 || gi > (loc === 'ja' ? t.length : t.indexOf(`\n${['en','fr','ru','ja'][['zh','en','fr','ru','ja'].indexOf(loc)+1]}: {`) > 0 ? t.indexOf(`\n${['en','fr','ru','ja'][['zh','en','fr','ru','ja'].indexOf(loc)+1]}: {`) : t.length)) {
    console.log(loc, 'copyHint anchor missing in block'); continue;
  }
  const le = t.indexOf('\n', gi);
  t = t.slice(0, le) + '\n' + block + t.slice(le);
  console.log(loc, 'inserted');
}
fs.writeFileSync(p, t);
