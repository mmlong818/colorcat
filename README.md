# ColorCat · 全能配色工作台

> OmniPalette — one workbench for every good color.
> 125 组开源色板（4,800+ 色块 / 2,764 套现成配色）· 色彩工程引擎 · MCP 服务 · 五语言界面（中/英/法/俄/日）· 纯前端离线可用

[![License: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](LICENSE)

## 目录结构

```
color-hub/      网站主体（色板库 / 色阶工坊 / 生成器 / 无障碍实验室 / 应用预览）
colorcat-mcp/   MCP 服务器（把全部能力接入 AI 客户端）
color-tool/     独立小工具：11 种经典配色方案学习器
scratch/        数据管线（从各开源官方源抓取 → 生成站点与 MCP 数据）
```

## 快速开始

### 1. 网页（零依赖）

双击 `color-hub/index.html` 即可使用，完全离线。
或起一个静态服务器（推荐，避免个别浏览器限制）：

```bash
cd color-hub && python -m http.server 8080
# 打开 http://127.0.0.1:8080
```

也可以直接部署到任何静态托管（GitHub Pages / Vercel / Netlify）——本仓库 Pages 演示即来自 `color-hub/`。

### 2. MCP 服务器（接入 AI 客户端）

```bash
cd colorcat-mcp
npm install
node test/client-test.mjs   # 可选：40 项端到端自测
```

在客户端配置（ZCode：`~/.zcode/cli/config.json`；Claude Desktop：`claude_desktop_config.json`）：

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

10 个工具：`search_palettes` · `get_palette` · `get_brewer_classes` · `convert_color` · `contrast_check` · `suggest_fix` · `generate_scale` · `check_gradient` · `simulate_vision` · `preview_roles`。

### 3. 重新生成数据

色板数据来自各开源官方源，一条命令同步网页与 MCP 两侧：

```bash
node scratch/transform.js    # 产出 color-hub/palettes.js + colorcat-mcp/data.json
node scratch/gen-m3.js       # 重新生成 Material 3 音调色板（需 scratch/dl/mcu-pkg）
```

## 数据来源与许可

- **代码**：MIT（见 LICENSE）。工具与引擎为原创实现；OKLab 数学基于 Björn Ottosson 的公有领域成果。
- **色板数据**：均来自各开源项目公开发布的数据（Open Color / Tailwind / Ant Design / Radix / Material / IBM Carbon：MIT 或 Apache-2.0；Nord / Catppuccin / Dracula / Solarized / 中日传统色：MIT；策展合集经 EmilHvitfeldt/paletteer GPL-3 聚合）。每组色板在界面内标注许可类型。
- **例外（保留致谢）**：Scientific Colour Maps（© Fabio Crameri，学术出版需按要求引用）；ColorBrewer（© Cynthia A. Brewer）。
- **色觉模拟**：Viénot (1999) 近似算法。

## 目录 / 语言

界面右上角切换 中文 · English · Français · Русский · 日本語。法/俄/日的色板描述暂回退英文。
