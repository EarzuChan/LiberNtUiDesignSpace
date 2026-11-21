# LiberNT UI Design Space

操作系统视觉 Demo 草稿：桌面外壳 + 独立设计规范页。Vite + React + TypeScript，包管理器为 pnpm。

## 命令

- `pnpm dev` —— 开发服务器，http://localhost:5173/（桌面）与 /spec.html（规范页）
- `pnpm typecheck` —— `tsc --noEmit`
- `pnpm build` —— 类型检查 + 生产构建到 `dist/`
- `node scripts/shot.mjs <url> [w=1920] [h=1080] <步骤...>` —— 无头截图与交互测试（步骤：`click=` `dbl=` `hover=` `move=x,y` `down` `up` `key=` `type=` `eval=` `wait=` `theme=` `shot=路径`）。
  浏览器路径默认为 Helium，可用环境变量 `LNT_BROWSER` 覆盖。页面上的 `window.__lnt`（`sys` / `wm` / `fs` 三个 store）用于驱动状态。
- `node scripts/gen-tokens.mjs` —— 重新生成 `src/styles/palette.css`（原子色板、弹簧曲线）
- `node scripts/gen-icons.mjs` —— 重新生成 `src/ui/icons.ts`；`node scripts/find-icon.mjs <关键字>` 查 Fluent 图标组名

改动后请跑 `pnpm typecheck`，涉及视觉的改动用 `scripts/shot.mjs` 在亮/暗两种主题下截图确认。

## 结构

- `src/styles/` —— 设计 token（`tokens.css`）、材质（`materials.css`）、控件样式（`controls.css`）
- `src/ui/` —— 基础控件、`Glass`（自适应玻璃）、`ProgressiveBlur`、菜单/提示/对话框
- `src/lib/` —— 状态与数据：`system`（主题等系统设置）、`wm`（窗口管理）、`luma`（背景亮度采样）、`palette`（壁纸取色）、`wallpaperSync`（取色/压暗/采样联动）、`customWallpapers`（上传的壁纸，存 IndexedDB）、`fs`（虚拟文件系统）、`apps`
- `src/shell/` —— 桌面、窗口、任务栏、开始菜单、控制中心、通知日历、锁屏
- `src/apps/` —— 文件、设置、记事本、照片、计算器、终端
- `src/spec/` —— 设计规范页

## 约定

- 组件只引用语义 token，不直接写色值；主题通过任意节点上的 `data-theme="light|dark"` 切换。
- 圆角按角色分两极：结构性表面（窗口、卡片、列表行、表单控件）4–8；悬浮表面（浮层、小组件）16–20；可拨弄的小物件（搜索框、开关、分段、圆形按钮、Dock）全圆。不要用 10–14 的中间档。胶囊按钮（`<Button pill>`）只用于独立主操作、媒体控制和筛选，表单与对话框按钮保持小圆角。
- 任务栏有两种样式（`sys.taskbarStyle`：`dock` 悬浮 / `classic` 贴底通栏）。工作区高度用 `workArea()` / `taskbarHeight()` 或 CSS 的 `--taskbar-h`，不要写死 76。
- 成组的设置行用 `.group`（外角大、内角小、行间隙 2px）；不要用于长列表、侧栏和菜单。
- 强调色与表面着色由 `applySystemToDocument` 写入 `--accent-h/c/l`、`--tint-h`、`--tint`；需要当前强调色时用 `activeAccent()`，不要直接读 `sys.accent`。
- 透明度动画必须加在 `.mat` 元素自身而不是其祖先上，否则祖先会成为 backdrop root，玻璃在动画期间失效。
- 图标从 `@/ui/icons` 引入（Fluent System Icons，headless 版本），命名为 `名称 + 尺寸 + Regular|Filled`。
- 界面语言默认英文，可切换中文（托盘的输入法指示器，或「设置 → 时间和语言」）。源码里的界面文案一律写简体中文，英文译文加到 `src/i18n/en.ts`（以中文原文为键）；翻译由自定义 JSX 运行时在渲染原生元素时完成（`src/i18n/`）。由变量拼出来的句子在 `src/i18n/index.ts` 的 `RULES` 里加规则；渲染之外要用译文（搜索、排序、写入输入框）时调用 `tr()` / `matchText()` / `cmpText()`。新增文案后请在英文界面下检查有没有漏译（会原样显示中文）。
- 素材来源见 `CREDITS.md`。
