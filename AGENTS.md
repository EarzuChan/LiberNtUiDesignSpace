# LiberNT UI Design Space

操作系统视觉 Demo 草稿：桌面外壳 + 独立设计规范页 + 桌面之外的系统场景页（每个场景一个 HTML）。Vite + React + TypeScript，包管理器为 pnpm。

## 命令

- `pnpm dev` —— 开发服务器，http://localhost:5173/（桌面）与 /spec.html（规范页）；系统场景页：/loginui.html（锁屏、登录、关机）、/boot.html（启动画面）、/bootmenu.html（启动菜单）、/bugcheck.html（蓝屏）、/recovery.html（恢复环境）
- `pnpm typecheck` —— `tsc --noEmit`
- `pnpm build` —— 类型检查 + 生产构建到 `dist/`
- `node scripts/shot.mjs <url> [w=1920] [h=1080] <步骤...>` —— 无头截图与交互测试（步骤：`click=` `dbl=` `hover=` `move=x,y` `down` `up` `key=` `type=` `eval=` `wait=` `theme=` `shot=路径`）。
  浏览器路径默认为 Helium，可用环境变量 `LNT_BROWSER` 覆盖。页面上的 `window.__lnt`（`sys` / `wm` / `fs` / `session` 几个 store）用于驱动状态。
- `node scripts/gen-tokens.mjs` —— 重新生成 `src/styles/palette.css`（原子色板、弹簧曲线）
- `node scripts/gen-lite.mjs` —— 重新生成 T0 场景的预烘焙背景 `public/lite/backdrop.webp`
- `node scripts/gen-icons.mjs` —— 重新生成 `src/ui/icons.ts`；`node scripts/find-icon.mjs <关键字>` 查 Fluent 图标组名

改动后请跑 `pnpm typecheck`，涉及视觉的改动用 `scripts/shot.mjs` 在亮/暗两种主题下截图确认。

## 结构

- `src/styles/` —— 设计 token（`tokens.css`）、材质（`materials.css`）、控件样式（`controls.css`）
- `src/ui/` —— 基础控件、`Glass`（自适应玻璃）、`ProgressiveBlur`、菜单/提示/对话框
- `src/lib/` —— 状态与数据：`system`（主题等系统设置）、`session`（会话阶段：锁屏、登录、睡眠、注销 / 重启 / 关机）、`wm`（窗口管理）、`luma`（背景亮度采样）、`palette`（壁纸取色）、`wallpaperSync`（取色/压暗/采样联动）、`customWallpapers`（上传的壁纸，存 IndexedDB）、`fs`（虚拟文件系统）、`apps`
- `src/shell/` —— 桌面、窗口、任务栏、开始菜单、控制中心、通知日历
- `src/loginui/` —— T2（安全桌面）：`LoginUI.tsx` 既是 /loginui.html 的整页界面，也以 `embedded` 嵌入桌面作为锁屏
- `src/apps/` —— 文件、设置、记事本、照片、计算器、终端
- `src/lite/` —— T0（帧缓冲层）场景：`lite.css`（token 子集与样式）、`parts.tsx`（共享部件）、每个场景一个入口（`boot` / `bootmenu` / `bugcheck` / `recovery`）
- `src/spec/` —— 设计规范页

## 约定

- 组件只引用语义 token，不直接写色值；主题通过任意节点上的 `data-theme="light|dark"` 切换。
- 圆角按角色分两极：结构性表面（卡片、列表行、表单控件）4–8，窗口与对话框 12；悬浮表面 16–28（浮层 `--radius-flyout` 28、小组件 20）；可拨弄的小物件（搜索框、开关、分段、圆形按钮、Dock）全圆。不要用 10–14 的中间档，除非是同心推导的结果。
- 嵌套圆角保持同心（内 = 外 − 间距）。浮层内的磁贴用 `--radius-tile`（= 浮层圆角 − `--flyout-pad`），磁贴内的可点击行用 `--radius-tile-item`（= 磁贴圆角 − `--tile-pad`）；不要给它们写死数值，要调就调 `--radius-flyout`。胶囊按钮（`<Button pill>`）只用于独立主操作、媒体控制和筛选，表单与对话框按钮保持小圆角。
- 任务栏有两种样式（`sys.taskbarStyle`：`dock` 悬浮 / `classic` 贴底通栏）。工作区高度用 `workArea()` / `taskbarHeight()` 或 CSS 的 `--taskbar-h`，不要写死 76。悬浮 Dock 只有主岛是玻璃岛，托盘没有底板，靠任务栏里的底部遮罩（`.taskbar-scrim`，由黑到透明、由很模糊到清晰）保证可读，悬浮时按暗色处理；有窗口碰到任务栏（最大化、贴靠到底边、伸进任务栏区域，同 KDE 的取消悬浮；`data-solid`）时遮罩换成通栏底板，主岛的底色、模糊与边缘过渡消融，上下留白收掉，任务栏从 76 降到与 Dock 同高的 60（`touchesTaskbar()` 驱动 `setTaskbarSolid()`，`workArea()` 与 `--taskbar-h` 随之更新）。
- 玻璃上的可选中项（任务栏图标、托盘按钮、窗口预览里的各列）用提亮表达层级：悬停 `--fill-plate-hover`，选中 `--fill-plate` + `--plate-bevel`。`--fill-subtle-*` 是压暗，只用在实色表面上。
- 任务栏窗口预览在 `src/shell/DockPeek.tsx`：缩略图是打开预览那一刻对窗口 DOM 的克隆（静态快照），不要为它再渲染一份应用。
- 设置的次级页在 `src/apps/settings/subpages.tsx` 注册：路由是一条路径（一级页 id + 各级段），页面里用 `open(段)` 进入、`go(页)` 切换一级页；次级页的标题是标题字号的面包屑（上级可点返回），没有副标题。外部打开用 `launch('settings', { page, sub: [...] })`；新增次级页后把路径加进 `scripts/check-i18n.mjs`。
- 滚动边缘：浮在内容上的标题区用 `ProgressiveBlur`；与列表同层的顶部控件（侧栏搜索框、开始菜单标题）下用 `useScrollEdge()`，滚过后出现 1px 切线与浅阴影（`--scroll-edge-shadow`）。列表自带内边距而切线要贯通整块表面时传 `{ full: true }`。
- 成组的设置行用 `.group`（外角大、内角小、行间隙 2px）；不要用于长列表、侧栏和菜单。
- 强调色与表面着色由 `applySystemToDocument` 写入 `--accent-h/c/l`、`--tint-h`、`--tint`；需要当前强调色时用 `activeAccent()`，不要直接读 `sys.accent`。
- 透明度动画必须加在 `.mat` 元素自身而不是其祖先上，否则祖先会成为 backdrop root，玻璃在动画期间失效。
- 图标从 `@/ui/icons` 引入（Fluent System Icons，headless 版本），命名为 `名称 + 尺寸 + Regular|Filled`。
- 界面语言默认英文，可切换中文（托盘的输入法指示器，或「设置 → 时间和语言」）。源码里的界面文案一律写简体中文，英文译文加到 `src/i18n/en.ts`（以中文原文为键）；翻译由自定义 JSX 运行时在渲染原生元素时完成（`src/i18n/`）。由变量拼出来的句子在 `src/i18n/index.ts` 的 `RULES` 里加规则；渲染之外要用译文（搜索、排序、写入输入框）时调用 `tr()` / `matchText()` / `cmpText()`。新增文案后请在英文界面下检查有没有漏译（会原样显示中文）。
- 系统界面按渲染能力分层（规范页「系统场景」）：T0 帧缓冲 / T1 基础合成 / T2 安全桌面 / T3 会话。桌面之外的场景各占一个 HTML 入口（新增时同步加到 `vite.config.ts` 的 `input`）；`index.html` 是桌面，T2 在 `loginui.html`。
- T0 场景（`data-tier="lite"`）只用 `src/lite/lite.css` 里的子集：只有暗色、固定品牌蓝；表面是实色或静态半透明；不引入 `materials.css`、不写 `backdrop-filter`、阴影、高光边、噪点和弹簧；字号只用 14 / 16 / 28 / 40，字重只用 400 / 600；选中即悬停，唯一的强调是实色强调填充。「模糊」只来自预烘焙背景。
- T2（`src/loginui/`）由 `useSession` 的 `phase` 驱动：锁定、睡眠用 `session.go()`，注销 / 重启 / 关机用 `session.end()`（有窗口带 `dirty` 标记时先进入 `blocked`）。锁定和睡眠不离开桌面页，窗口保留；结束会话的操作播完后跳转到下一个场景页。/loginui.html 用 `?phase=` 直接打开某个阶段（停在原地，加 `?flow` 才继续）。
- T2 始终按暗色处理（根节点 `data-theme="dark"`）。直接叠在壁纸上的文字、压暗和投影用 `--wp-*` 那组 token；整屏模糊后的控件用 `--fill-plate*`。`.lu` 和其中带玻璃的容器不做透明度动画，各层各自过渡。
- 菜单和提示默认跟随页面主题；触发元素位于 `data-overlay-theme="light|dark"` 区域内时使用该主题（锁屏用它让弹出的菜单保持暗色）。
- T0 场景页的网址参数：`?lang=zh|en` 临时指定语言（截图用，`shot.mjs` 的 `theme=` 对这些页面无效）；`?flow` 播完后自动衔接下一个场景，不带时停在原地便于审阅。
- 素材来源见 `CREDITS.md`。
