# 全能配色工作台 ColorCat · 总体规划

> 目标：做成"世界上最全能"的中文配色网站——一个站点覆盖 **UI 色板、数据可视化配色、无障碍、传统色、生成器、导出** 全链路。
> 原则：**所有配色数据来自开源官方仓库（逐条署名），工具引擎为原创实现，纯前端零依赖、可离线。**

---

## 一、信息架构（四大功能区）

### 1. 色板库（已实现 ✅）
- 36 组色板 / 3340 个色块，四类：UI 设计系统 · 数据可视化 · 编辑器主题 · 传统色
- 搜索 + 分类筛选；色块单击复制、双击送入生成器
- 多阶色板支持色相切换 + **亮/暗模式对照**（Ant、Radix 均有官方暗色）
- 每个色块可显示 **与纯白/纯黑的 WCAG 对比度**，设计文字/背景时直接选可用色阶
- ColorBrewer：35 个官方方案 × 各档色块数，带**官方色盲安全/打印安全标注**
- 连续色图：渐变条 + 采样色标，含"彩虹色图慎用"与学术引用提醒
- 每组色板附协议、来源链接、署名（页面页脚亦有总署名）

### 2. 配色生成器（已实现 ✅）
- 11 种经典色环几何方案（单色/近似/互补/拆分互补/三元/四方/四元/五元/六元/扩展近似/彩虹）
- conic-gradient 色环 + SVG 几何连线演示方案结构
- 基础色信息：HEX / RGB / HSL / HSV / CMYK / **L\*a\*b\*** / 最近色名

### 3. 无障碍实验室（已实现 ✅）
- WCAG 2.1 对比度检查器：正文 AA/AAA、大字 AA/AAA、UI 组件五项判定 + 实时排版样张
- 颜色格式转换（含 CIE L\*a\*b\*）
- 色盲模拟对照条（Viénot 1999 近似）：红色盲 / 绿色盲 / 蓝黄色盲 / 灰度

### 4. 应用预览（已实现 ✅）
- 把任意色板套进 **界面样式模拟**（侧栏/正文/按钮/强调色的角色映射）与 **数据可视化模拟**（柱状图/环形图/图例）
- 分类色板用离散颜色、连续色图按数值插值上色——直观演示两类配色的正确用法
- 全局色觉模拟开关，模拟结果实时作用于整个预览

---

## 二、数据源整合表

| 来源 | 类别 | 协议 | 接入方式 | 状态 |
|---|---|---|---|---|
| Open Color | UI | MIT | 官方 open-color.json | ✅ 全量 |
| Tailwind CSS v3 | UI | MIT | 官方 colors 模块解析 | ✅ 全量 |
| Ant Design 色板 | UI | MIT | @ant-design/colors 官方包（含暗色） | ✅ 全量 |
| Radix Colors | UI | MIT | 官方 CSS 解析，**31 色相全量**（12 阶亮 + 12 阶暗） | ✅ 全量 |
| Material Design 2 | UI | Apache-2.0 | material-colors 官方色板数据 | ✅ 全量 |
| Material Design 3 | UI | Apache-2.0 | 官方 material-color-utilities 从基线主色经 HCT 生成 6 组音调色板 | ✅ 全量 |
| IBM Carbon | UI | Apache-2.0 | @carbon/colors 官方 tokens v11（14 色系 × 10 阶） | ✅ 全量 |
| ColorBrewer 2.0 | 可视化 | Apache-2.0 | axismaps/colorbrewer（35 官方方案含色盲标注） | ✅ 全量 |
| Matplotlib 色图 | 可视化 | matplotlib 许可 | 10 条：Viridis 系 6 + 循环 4（Twilight/Managua/Berlin/Vanimo） | ✅ 全量 |
| Scientific Colour Maps | 可视化 | 免费使用需引用 | **22 张**（Batlow/Roma/Vik/Bam + La Jolla/La Paz/Oslo/Broc/Tofino/Tokyo 等） | ✅ 全量 |
| Nord / Catppuccin / Dracula / Solarized | 编辑器主题 | MIT | 官方仓库/README 校验 | ✅ 全量 |
| 中国传统色 | 传统色 | MIT | zerosoul/chinese-colors 官方数据（9 系 161 条，经核对即该库全量） | ✅ 全量 |
| 日本の伝統色 | 传统色 | MIT | nipponcolors 开源镜像数据（250 条全量） | ✅ 全量 |
| Adobe Leonardo（工具） | 生成 | 思路重写 | 色阶工坊「对比度目标模式」：二分求解明度命中目标 WCAG 对比度 | ✅ 已实现 |
| Chroma.js Palette Helper（工具） | 生成 | 思路重写 | 色阶工坊「④ 渐变色阶检查器」：OKLab 插值 + 明度曲线 + CVD 可区分性警告 | ✅ 已实现 |
| Paletteer 聚合 | 策展 | GPL-3 聚合 | **65 个主题包共 2382 套**：宝可梦 389 / 深海鱼 175 / 碧昂丝 130 / NBA 129 / 名画 128 / Met 博物馆 56 / 影视动画 58 / 吉卜力 27 / 沙丘 15 / 梵高 15 / 蒸汽波… | ✅ 全量 |
| uiGradients | 策展 | MIT | **382 条网页渐变**（锚点色，CSS 一行复用） | ✅ 全量 |

**署名规范**：每组色板内嵌 `license / source / attribution` 三字段；页脚统一署名；Scientific Colour Maps 额外提示学术引用义务。

---

## 三、技术架构

**MVP（当前）**：纯静态三件套
- `palettes.js` —— 由 `scratch/transform.js` 从官方仓库数据自动生成（可随时重跑更新）
- `app.js` —— 原创色彩引擎：HEX/RGB/HSL/HSV/CMYK/XYZ/LAB 转换、WCAG 对比度、RGB 插值、Viénot 色觉模拟矩阵
- `style.css` + `index.html` —— 主题变量（深/浅色）、无框架、无网络请求、双击即用

**v2 已实现的新能力**
- Material 3 音调色板：官方 `material-color-utilities` 从基线主色 #6750A4 经 HCT 空间生成（tone 40 精确命中 #6750A4）
- IBM Carbon：官方 tokens v11 JSON（14 色系，blue60 = #0F62FE 校验通过）
- 预览页 A/B 对比：两套色板在同一组数据、同一色觉模拟下并排呈现
- 收藏夹：★ 标记 + localStorage 持久化 + 分类筛选 + 整夹 JSON 导出
- 导出矩阵：CSS 变量 / JSON / Tailwind v3 配置 / Tailwind v4 @theme / Figma Tokens（Tokens Studio）

## 四、路线图

| 阶段 | 内容 | 状态 |
|---|---|---|
| MVP | 色板库 + 生成器 + 无障碍 + 预览 | ✅ 完成 |
| v1 | OKLCH 色阶工坊、图片取色、hash 分享链接 | ✅ 完成 |
| v2 | Material 2/3 + Carbon 接入、A/B 对比模式、收藏夹 | ✅ 完成 |
| v3 | Figma Tokens / Tailwind v4 @theme 导出 | ✅ 完成 |
| 全量化 | Radix 31 色相全量、科学色图 22 张全量、Berlin/Vanimo 补齐 | ✅ 完成 |
| 工具补齐 | Leonardo 式对比度目标生成器、chroma 式渐变检查器（均按开源工具思路原创实现） | ✅ 完成 |
| 策展层 | paletteer 65 包 2382 套 + uiGradients 382 条渐变（共 **125 组条目 / 2764 套策展配色 / 580KB 单文件**） | ✅ 完成 |
| 后续可选 | 收藏夹分享包导入、配色方案编辑器（手动改色重新校验） | 🞩 |

## 五、差异化定位

- **中文场景最全**：目前没有一个中文站点同时聚合 UI 设计系统色板 + 学术色图 + 传统色文化库
- **带"为什么"**：每个色板附理论说明、每档色阶附对比度与语义（学配色而不只是抄色）
- **即看即用**：预览模拟让色板在"真实界面 + 真实图表 + 色盲视角"下被检验，而不是只看色卡
- **合规干净**：全数据开源可商用、逐条署名，可作为模板直接二次开发
