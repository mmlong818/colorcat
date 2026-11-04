import { execSync } from 'node:child_process';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
import fs from 'node:fs';
const content = fs.readFileSync('color-hub/index.html').toString('base64');
const meta = JSON.parse(execSync(`curl -sS -H "Authorization: Bearer ${token}" -H "User-Agent: cc" https://api.github.com/repos/mmlong818/colorcat/contents/color-hub/index.html`, { encoding: 'utf8', maxBuffer: 1e8 }));
const res = await fetch('https://api.github.com/repos/mmlong818/colorcat/contents/color-hub/index.html', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'cc',
  },
  body: JSON.stringify({ message: 'fix: static title count', content, sha: meta.sha }),
});
const data = await res.json();
console.log('status:', res.status, '| commit:', data.commit?.sha?.slice(0, 10));
