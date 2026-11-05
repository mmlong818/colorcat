#!/usr/bin/env node
/**
 * push-file.mjs — 单文件推送到 GitHub（走 api.github.com，绕过 github.com:443 被墙的环境）
 *
 * 用法：
 *   node pipeline/push-file.mjs <repo> <本地文件路径> <仓库内路径> <commit message>
 * 示例：
 *   node pipeline/push-file.mjs mmlong818/colorcat README.md README.md "docs: update"
 *
 * 依赖：gh CLI 已登录（gh auth token），Node ≥ 18（内置 fetch）。
 * 大文件（>1MB 的 base64）也走 Contents API；整个仓库批量同步请用 upload-v2.mjs。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const [repo, localPath, remotePath, ...msgParts] = process.argv.slice(2);
if (!repo || !localPath || !remotePath || msgParts.length === 0) {
  console.error('用法: node pipeline/push-file.mjs <repo> <本地文件> <仓库内路径> <commit message>');
  process.exit(1);
}
const message = msgParts.join(' ');

const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
const content = fs.readFileSync(localPath).toString('base64');

// 当前文件 sha（不存在则视为新建）
let sha;
const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(remotePath).replace(/%2F/g, '/')}`, {
  headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'cc' },
});
if (metaRes.ok) sha = (await metaRes.json()).sha;
else if (metaRes.status !== 404) {
  console.error('获取 sha 失败:', metaRes.status, await metaRes.text());
  process.exit(1);
}

const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(remotePath).replace(/%2F/g, '/')}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'cc',
  },
  body: JSON.stringify({ message, content, sha }),
});
const d = await res.json();
if (res.status === 200 || res.status === 201) {
  console.log('✓ 已推送', remotePath, '| commit:', d.commit?.sha?.slice(0, 10));
} else {
  console.error('✗ 失败:', res.status, JSON.stringify(d).slice(0, 500));
  process.exit(1);
}
