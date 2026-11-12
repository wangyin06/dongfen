# 动分 · MOVE / SCORE

一个手机优先、可离线安装的自重训练计分 PWA。

不是训练计划打卡器，也不是社交健身 App。它只做一件事：把你今天实际完成的动作，折算成一个可累计、可回看的训练分。

![今日页](docs/screenshots/desktop-today.png)

## 为什么是「分」

传统打卡容易变成「今天练没练」的二元判断，但训练量、动作难度和完成质量其实一直在变化。动分用统一公式把这些差异折成分数：

```text
得分 =（实际次数或秒数 ÷ 基础单位）× 单位得分 × 质量系数
```

- 次数动作：基础单位 10 次
- 时间动作：基础单位 30 秒
- 左右侧动作：先分别计算左右，再相加
- 质量系数：标准 1.0 / 轻微变形 0.8 / 明显变形 0.5

旧版的一条循环（10 个跪姿俯卧撑 + 10 个坐姿屈膝 + 10 个标准深蹲 + 10 个靠墙天使 + 10 次提踵 + 左右手各 10 次握力器）约等于 **1.00 分**。

默认周目标 13 分，高强度日上限 4 分，轻松日上限 2 分，都可以在设置里调整。每周统计会同时检查推、拉、腿、核心、握力五类是否都有覆盖。

## 功能

- **今日**：今日总分、周目标进度、连续天数、7 日节奏、五类覆盖、今日记录
- **记录**：按日期分组、搜索、类别筛选、编辑、删除、再记一次
- **统计**：本周 / 本月 / 近 30 天，总分、日均、组数、单日最高、每日柱状图、类别分布、动作排行
- **动作库**：72 个内置动作，按模式与进退阶分组，支持搜索、类别/难度筛选；可添加自定义动作
- **快速记录**：两步完成，支持次数/秒数、左右侧分别记录、同步两侧、计时器、质量系数、备注、实时得分预览
- **设置**：周目标、日上限、周起始日、默认质量；JSON 完整备份、CSV 导出、JSON 合并/覆盖导入；清空数据
- **PWA**：manifest、service worker、离线缓存、主屏幕安装图标
- **本地优先**：没有账号、没有云端、没有追踪；数据只存在当前浏览器的 IndexedDB

## 开发

要求：Node.js 20+、pnpm 11+。

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm check      # TypeScript 类型检查
pnpm build      # 生产构建，输出 dist/
pnpm preview    # 预览生产构建
```

技术栈：React 19、TypeScript、Vite 7、`vite-plugin-pwa`、`idb`、`lucide-react`。样式为手写 CSS，不依赖 Tailwind 或外部字体 CDN，保证离线可用。

## 数据与备份

数据库名：`dongfen-db`（IndexedDB）。

- **导出 JSON**：保留全部记录、设置和自定义动作，适合迁移或长期备份
- **导出 CSV**：适合用 Excel 查看；带 UTF-8 BOM，中文不会乱码
- **导入 JSON**：
  - 合并：保留现有数据，同 ID 记录由备份覆盖
  - 覆盖：先清空当前数据，再导入备份
- 清理浏览器站点数据会删除本地记录，建议定期导出 JSON

## 项目结构

```text
src/
  components/       # AppShell、LogSheet、RecordRow、Toast、通用 UI
  data/             # 72 个内置动作与分类元数据
  hooks/            # PWA 安装提示
  lib/              # 日期、计分、IndexedDB、备份校验
  pages/            # 今日、记录、统计、动作库、设置
  state/            # AppContext，统一数据读写
  App.tsx           # hash 路由与页面组合
  main.tsx          # React 入口
  styles.css        # 完整视觉系统与响应式布局
scripts/
  generate_icons.py # PWA 图标生成脚本
public/
  icons/            # 192/512/maskable 图标
  favicon.svg
  favicon.ico
  apple-touch-icon.png
docs/
  screenshots/      # 验收截图
```

动作分值和进退阶集中在 `src/data/exercises.ts`，可以按自己的训练水平调整。自定义动作会在运行时合并进动作库。

## 部署与安装

`pnpm build` 后，把 `dist/` 部署到任意 HTTPS 静态站点即可；没有后端依赖。

- **Android / Chrome / Edge**：用 HTTPS 打开页面，浏览器菜单选择「安装应用」或「添加到主屏幕」
- **iPhone / Safari**：用 HTTPS 打开页面，分享按钮 → 「添加到主屏幕」

PWA 的 service worker 需要安全上下文：`localhost` 或 HTTPS。用手机通过局域网 IP 的普通 HTTP 访问时，页面能打开，但不能安装/离线缓存；正式使用请先部署到 HTTPS。首次打开后，页面、动作库和已加载资源会被缓存，之后可以离线记录。数据仍然只保存在本机。

## 截图

| 今日（桌面） | 统计（桌面） |
| --- | --- |
| ![今日](docs/screenshots/desktop-today.png) | ![统计](docs/screenshots/desktop-stats.png) |

| 今日（390px 手机） |
| --- |
| ![手机今日](docs/screenshots/mobile-today.png) |

## 验收记录

- `pnpm check`：TypeScript 无错误
- `pnpm build`：生产构建成功，PWA service worker 预缓存 14 个资源（约 452 KiB）
- 桌面 1280px：今日、记录、统计、动作库、设置五页及记录/编辑/删除/导出流程已走通
- 手机 390px / 360px：今日页、记录页、底部导航、浮动记录按钮无横向溢出
- 离线：关闭 preview 服务器后重新打开页面，应用仍可从 service worker 正常加载
- 验收测试产生的记录和自定义动作已清空，默认周目标恢复为 13 分

## 版本

v1.0.0 · 本地优先 · 无账号 · 无云端
