# ColorCat · 全能配色工作台

> OmniPalette — one workbench for every good color.
> 127 组开源色板（4,824 个色块 / 2,823 套现成配色）· 色彩工程引擎 · MCP 服务 · 五语言界面（中/英/法/俄/日）· 纯前端离线可用

**在线演示**：https://mmlong818.github.io/colorcat/ （GitHub Pages，来自 `color-hub/`）

[![License: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](LICENSE)

## 目录结构

```
color-hub/      网站主体（色板库 / 色阶工坊 / 配色生成器 / 无障碍实验室 / 应用预览）
colorcat-mcp/   MCP 服务器（stdio + Streamable HTTP 双传输，10 个工具）
color-tool/     独立小工具：11 种经典配色方案学习器（单文件）
scratch/        数据管线（从各开源官方源抓取 → 生成站点与 MCP 数据）
```

环境要求：网页零依赖；MCP 需要 Node.js ≥ 18。

## 快速开始

### 1. 网页（零依赖）

双击 `color-hub/index.html` 即可使用，完全离线。
或起一个静态服务器（推荐，避免个别浏览器限制）：

```bash
cd color-hub && python -m http.server 8080
# 打开 http://127.0.0.1:8080
```

也可部署到任何静态托管（GitHub Pages / Vercel / Netlify）——本仓库的 Pages 由 `.github/workflows/deploy.yml` 自动部署 `color-hub/` 目录。

### 2. MCP 服务器（接入 AI 客户端）

```bash
cd colorcat-mcp
npm install
npm test                    # 可选：stdio 40 项端到端自测
node test/http-test.mjs     # 可选：HTTP 模式 7 项自测
```

**stdio 模式**（客户端在本机拉起，最常用）——ZCode（`~/.zcode/cli/config.json`）：

```json
{
  "mcp": {
    "servers": {
      "colorcat": {
        "command": "node",
        "args": ["<本仓库绝对路径>/colorcat-mcp/server.js"]
      }
    }
  }
}
```

Claude Desktop（`claude_desktop_config.json`）结构略有不同，注意键名是 `mcpServers`：

```json
{
  "mcpServers": {
    "colorcat": {
      "command": "node",
      "args": ["<本仓库绝对路径>/colorcat-mcp/server.js"]
    }
  }
}
```

10 个工具 + 双传输模式（stdio / Streamable HTTP）：`search_palettes` · `get_palette` · `get_brewer_classes` · `convert_color` · `contrast_check` · `suggest_fix` · `generate_scale` · `check_gradient` · `simulate_vision` · `preview_roles`。

### 3. 重新生成数据

色板数据来自各开源官方源，一条命令同步网页与 MCP 两侧：

```bash
node scratch/transform.js    # 产出 color-hub/palettes.js + colorcat-mcp/data.json
node scratch/gen-m3.js       # 重新生成 Material 3 音调色板（需 scratch/dl/mcu-pkg）
```

## MCP 三种部署方式

### A. 本地分发（最简单）

别人 clone 本仓库，进入 `colorcat-mcp` 执行 `npm install`，然后在客户端配置指向 `server.js` 的绝对路径。每人本地跑，数据离线，无需任何服务器。

### B. npm 分发（生态标准）

维护者执行 `npm publish --access public` 发布后，别人无需 clone，客户端配置直接写：

```json
{ "command": "npx", "args": ["-y", "colorcat-mcp"] }
```

### C. 远程 HTTP（我架设，别人连我）

```bash
# Linux / macOS
COLORCAT_TOKEN=你的秘密 node server.js --http 3010

# Windows PowerShell
$env:COLORCAT_TOKEN="你的秘密"; node server.js --http 3010
```

- `/mcp` 为 Streamable HTTP 端点；设置了 `COLORCAT_TOKEN` 后，请求需带 `Authorization: Bearer <token>`（未设置则不鉴权，仅建议本机/内网使用）
- 客户端配置（支持远程 MCP 的客户端；不同客户端的字段名以各自文档为准）：

```json
{
  "mcp": {
    "servers": {
      "colorcat": {
        "type": "http",
        "url": "http://你的主机:3010/mcp",
        "headers": { "Authorization": "Bearer 你的秘密" }
      }
    }
  }
}
```

- 部署去处：云服务器（pm2 / systemd）、Render / Railway / Fly 免费层、或家庭机器 + 内网穿透（cloudflare tunnel / frp / tailscale）
- **公网暴露务必设置 `COLORCAT_TOKEN`**

测试：`npm test`（stdio 40 项）+ `node test/http-test.mjs`（HTTP 模式 7 项，含 401 鉴权验证）。

## 数据来源与许可

- **代码**：MIT（见 LICENSE）。工具与引擎为原创实现；OKLab 数学基于 Björn Ottosson 的公有领域成果。
- **色板数据**：均来自各开源项目公开发布的数据（Open Color / Tailwind / Ant Design / Radix / Material / IBM Carbon：MIT 或 Apache-2.0；Nord / Catppuccin / Dracula / Solarized / 中日传统色：MIT；策展合集经 EmilHvitfeldt/paletteer GPL-3 聚合）。每组色板在界面内标注许可类型。
- **例外（保留致谢）**：Scientific Colour Maps（© Fabio Crameri，学术出版需按要求引用）；ColorBrewer（© Cynthia A. Brewer）。
- **色觉模拟**：Viénot (1999) 近似算法。

## 多语言

界面右上角切换 中文 · English · Français · Русский · 日本語（自动记忆）。法/俄/日的色板描述暂回退英文，界面文字五语全量。
