# ColorCat 配色猫 · MCP Server

把 125 组开源色板 + 完整色彩工程引擎接入任意 MCP 客户端（ZCode / Claude Desktop / Cursor 等）。
纯函数 + 离线数据，零网络请求。

## 工具清单（10 个）

| 工具 | 用途 |
|---|---|
| `search_palettes` | 检索 125 组色板（UI 设计系统 / 学术色图 / 65 包策展合集 / 编辑器主题 / 中日传统色） |
| `get_palette` | 取完整色值（多阶 / 渐变 / 26 色 mocha / 389 套宝可梦，带分页） |
| `get_brewer_classes` | ColorBrewer 指定方案色值 + 官方色盲/打印安全标注（三态：是/否/官方未标注） |
| `convert_color` | #hex / rgb() / hsl() → 全格式 + L\*a\*b\* + OKLCH + 最近色名 |
| `contrast_check` | WCAG 2.1 对比度 + 五项判定 |
| `suggest_fix` | 不达标修正方案：保色相 OKLCH 求解 + 黑白替代 + 背景反向 + 四大设计系统现成色推荐 |
| `generate_scale` | 12 阶语义色阶（基色锚定第 9 阶）/ Leonardo 式对比度目标色阶，附 CSS |
| `check_gradient` | 渐变亮带检测 + 三类色盲逐段可区分性 |
| `simulate_vision` | 红盲/绿盲/蓝黄盲/灰度模拟 |
| `preview_roles` | 色板 → 界面角色映射（bg/surface/border/text/accent + 分类色 + ramp） |

## 接入 ZCode

`~/.zcode/cli/config.json`（已配置）：

```json
{
  "mcp": {
    "servers": {
      "colorcat": {
        "command": "node",
        "args": ["<本目录绝对路径>/server.js"]
      }
    }
  }
}
```

重启会话后自动连接；也可以在 **设置 → MCP** 里查看状态。

## 接入 Claude Desktop / Cursor

同样的 JSON 结构，放进各自 MCP 配置（claude_desktop_config.json / mcp.json）。

## 更新色板数据

网页端数据管线一条命令同步两边：

```bash
node ../scratch/transform.js   # 同时产出 ../color-hub/palettes.js 和本目录 data.json
```

## 测试

```bash
npm test   # SDK Client 实连 stdio，40 项断言逐工具验证
```
