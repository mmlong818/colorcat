# ColorCat — All-in-One Color Workbench

> OmniPalette was renamed to **ColorCat**. One workbench for every good color.
> 134 open-source palettes (4,902 swatches / 4,854 ready-made sets) · color engineering engine · MCP server · 5-language UI · fully offline

**Live demo**: https://mmlong818.github.io/colorcat/ (from `color-hub/`)

[![License: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](LICENSE)

## What's inside

```
color-hub/      Web app (palette library / scale studio / generator / a11y lab / preview)
colorcat-mcp/   MCP server (stdio + Streamable HTTP, 13 tools)
pipeline/       Data pipeline (fetch from upstream open-source repos → build site & MCP data)
```

## Quick start

### 1. Web app (zero dependencies)

Open `color-hub/index.html` in a browser — fully offline. Or serve it:

```bash
cd color-hub && python -m http.server 8080
# open http://127.0.0.1:8080
```

Deployable to any static host — this repo's GitHub Pages is auto-deployed from `color-hub/` via Actions.

### 2. MCP server

```bash
cd colorcat-mcp
npm install
npm test                    # 56 e2e assertions (stdio)
node test/http-test.mjs     # 7 HTTP-mode assertions
```

**stdio mode** (client launches the process locally) — Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "colorcat": {
      "command": "node",
      "args": ["<absolute-path>/colorcat-mcp/server.js"]
    }
  }
}
```

ZCode (`~/.zcode/cli/config.json`) uses the same shape but nests under `"mcp": { "servers": { ... } }`.

**13 tools**: `search_palettes` · `get_palette` · `get_brewer_classes` · `convert_color` · `contrast_check` · `suggest_fix` · `generate_scale` · `check_gradient` · `simulate_vision` · `preview_roles` · `audit_contrast` (batch WCAG audit) · `generate_m3` (brand color → M3 dynamic theme via official HCT engine) · `sample_colormap` (sample continuous colormaps).

### 3. Remote HTTP (host it, others connect)

```bash
COLORCAT_TOKEN=your-secret node server.js --http 3010
```

Clients connect via Streamable HTTP with `Authorization: Bearer <token>`. Deploy on a VPS (pm2/systemd), Render/Railway/Fly free tier, or your home machine + tunnel. **Always set a token for public exposure.**

### 4. Rebuild data

```bash
node pipeline/transform.js    # outputs color-hub/palettes.js + colorcat-mcp/data.json + engine.js
node pipeline/gen-m3.js       # regenerate M3 tonal palettes (needs pipeline/dl/mcu-pkg)
```

## Data sources & licensing

- **Code**: MIT (see LICENSE). Tools and engine are original implementations; OKLab math is based on Björn Ottosson's public-domain work.
- **Palette data**: fetched from upstream open-source projects (Open Color / Tailwind / Ant Design / Radix / Material / IBM Carbon: MIT or Apache-2.0; Nord / Catppuccin / Dracula / Solarized / Chinese & Japanese traditional: MIT; curated packs aggregated via EmilHvitfeldt/paletteer GPL-3). Each palette shows its license in the UI.
- **License separation**: `colorcat-mcp/data-open.json` contains permissively-licensed palettes only; `colorcat-mcp/data-gpl.json` contains GPL-3-sourced curated packs separately. The combined `data.json` merges both for convenience — if you redistribute, review the GPL-3 portion per its terms.
- **Attribution required**: Scientific Colour Maps (© Fabio Crameri, academic citation required); ColorBrewer (© Cynthia A. Brewer).
- **Color name database**: xkcd color survey (CC0) + Name That Color (CC BY 2.5, © Chirag Mehta).
- **Pantone Color of the Year**: hex values are publicly reported factual data; Pantone is a registered trademark of Pantone LLC.
- **Color vision simulation**: Viénot (1999) approximation.

## Languages

UI switcher (top-right): 中文 · English · Français · Русский · 日本語 (auto-saved). Palette descriptions fall back to English for fr/ru/ja.
