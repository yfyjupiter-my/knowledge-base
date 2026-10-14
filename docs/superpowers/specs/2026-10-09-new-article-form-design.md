# 新建文章图形界面（/admin）设计

日期：2026-10-09 · 状态：待评审

## 1. 目标

维护者在本机运行 `npm run dev` 或本机 Docker（`localhost:3200`）时，通过网页表单填写文章信息并点击 "Create"，自动生成符合站点规范的英文文章 `content/articles/<slug>.md`，不再手写 frontmatter、文件名和固定结构。

**成功标准**

- 不打开编辑器即可新建一篇能被站点正确识别（分类、标签、日期、步骤数、目录）的文章
- 预览效果与正式文章页一致
- 生产环境（`next start` / Docker）中默认完全不可用；仅在本机 Docker 显式设置 `KB_AUTHORING=1` 时开放（2026-10-14 起）

**不在范围内**：编辑或删除已有文章、生成中文版（`.zh.md`）、自动 Git 提交、草稿持久化、多用户与鉴权。

## 2. 方案

在现有 Next.js 应用中新增页面 `app/[lang]/admin/page.tsx`，由 Server Action 写文件。预览直接复用 `components/markdown.tsx`，分类读取复用 `lib/categories.server.ts`。

不采用独立编辑器脚本（预览渲染需另起一套，难以与站点保持一致）或桌面程序（依赖重、需打包）。

## 3. 入口与开关

- 判断条件：`process.env.NODE_ENV === "development" || process.env.KB_AUTHORING === "1"`，集中定义为 `lib/new-article.ts` 中的 `isAuthoringEnabled()`
- 开启时：顶栏显示 "New article" 按钮（文案走字典），链接到当前语言的 `/admin`。layout 为静态生成，按钮在构建时决定，因此 Docker 需以构建参数传入 `KB_AUTHORING`
- 未开启：不渲染按钮；`/admin` 页面调用 `notFound()`；Server Action 直接返回错误，不触碰文件系统
- 路由：`/admin`（英文界面）与 `/zh/admin`（中文界面），沿用现有中间件；界面文案加入 `lib/i18n.ts` 字典的 `editor` 段
- 无论界面语言为何，生成的文章固定为英文版 `<slug>.md`

## 4. 页面布局

- 上方：元数据表单（见第 5 节）
- 下方：桌面端左右分栏，左为正文编辑区（工具栏 + 文本框），右为实时预览；`lg` 以下改为"编辑 / 预览"两个标签页
- 底部：Create 按钮；提交中禁用并显示状态

## 5. 字段与规则

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| Title | 是 | 去除首尾空白后非空 |
| File name (slug) | 是 | 默认由标题自动生成；用户手动修改后不再跟随标题。必须匹配 `^[a-z0-9][a-z0-9-]*$` |
| Summary | 是 | 单行（换行替换为空格），显示字符数 |
| Category | 是 | 下拉框，选项来自 `categories.yml`，显示当前界面语言的名称，提交值为 `id` |
| Tags | 否 | 回车或逗号生成标签块，可删除；去重、去空白 |
| Updated | 是 | 默认当天本地日期，合法的 `YYYY-MM-DD` |
| Body | 否 | 预填模板骨架（见 5.2） |

### 5.1 slug 生成规则（`slugify`）

转小写 → 将非 `[a-z0-9]` 字符序列替换为单个 `-` → 去除首尾 `-`。结果为空（例如纯中文标题）时保持空值，由校验提示"请手动填写文件名"。

### 5.2 正文骨架与工具栏

预填内容：

```markdown
## 1. First steps

- [ ] 
- [ ] 
```

工具栏按钮在光标处插入：章节标题（`## `）、排查步骤（`- [ ] `）、提示框（NOTE / TIP / IMPORTANT / WARNING / CAUTION 选择其一，插入 `> [!TYPE]\n> `）、代码块（语言可选 powershell / bash / cmd / json / yaml / 无）。插入后光标定位到可输入处。

## 6. 文件生成（`buildArticleMarkdown`）

纯函数，输入已校验的字段，输出文件全文：

```markdown
---
title: <title>
summary: <summary>
category: <category id>
tags: [<tag>, <tag>]
updated: <YYYY-MM-DD>
---

<body>
```

- 字段顺序固定为 title、summary、category、tags、updated，与现有文章一致
- 标量值在需要时加双引号（含 `:`、`#`、引号、`[`、`]`、`{`、`}`、`,`、首尾空白、以 YAML 特殊字符开头，或会被解析为非字符串，例如 `true`、`123`、`null`），引号内按 YAML 规则转义
- tags 中的每一项同样按上述规则处理；无标签时输出 `tags: []`
- 正文统一为 `\n` 换行，文件以单个换行结尾

## 7. 保存流程（Server Action `createArticle`）

1. `isAuthoringEnabled()` 为假 → 返回错误；请求的 `Host` 不是 `localhost` / `127.0.0.1` / `[::1]`（可带端口）→ 返回错误（防止局域网调用与 DNS rebinding；Host 头可被伪造，Docker 需同时把端口只绑定到 127.0.0.1）
2. 服务端重新校验第 5 节全部规则；分类 id 必须存在于 `getCategories()`
3. 检查 slug 冲突：`<slug>.md` 或 `<slug>.zh.md` 任一存在即为冲突
4. `buildArticleMarkdown()` 生成内容，以 `fs.writeFile(path, data, { flag: "wx" })` 写入 `ARTICLES_DIR/<slug>.md`；`EEXIST` 视为冲突
5. 成功 → `revalidatePath("/[lang]", "layout")` 刷新首页、侧栏与搜索的 ISR 缓存，返回当前语言的 `/articles/<slug>`，由客户端整页跳转（不用 `redirect()`：dev 模式下写入文件触发的重新编译会打断客户端路由跳转）

slug 必须先通过正则校验才会参与路径拼接，因此不会写出 `_` 开头的文件，也不会跨目录写入。

另提供 Server Action `checkSlug(slug)`，供前端以 300ms 防抖实时提示冲突，同样受开关保护。

## 8. 错误处理

| 情况 | 表现 |
| --- | --- |
| 字段校验失败 | 对应字段下方显示错误，表单内容保留 |
| slug 冲突 | slug 字段下方提示，并给出第一个可用的建议名（`<slug>-2`、`<slug>-3`…） |
| 写入失败（权限、磁盘等） | 页面顶部显示错误信息，内容保留 |
| 请求本身失败（dev server 重启或已停止） | 页面顶部提示重试，内容保留 |
| 存在未保存内容时离开页面 | 关闭、刷新、后退：`beforeunload` 确认（顶栏入口为整页加载）；站内链接与侧栏搜索：经 `lib/leave-guard.ts` 确认；提交成功后解除 |

Server Action 返回结构：`{ fieldErrors?: Record<field, code>, formError?: "disabled" | "forbiddenHost" | "writeFailed", detail?: string, suggestion?: string, href?: string }`，成功时只含 `href`。

## 9. 模块划分

| 文件 | 职责 |
| --- | --- |
| `lib/new-article.ts` | 纯逻辑：`isAuthoringEnabled`、`slugify`、`validateArticleInput`、`buildArticleMarkdown`，不依赖 `fs` |
| `app/[lang]/admin/actions.ts` | `"use server"`：`createArticle`、`checkSlug`（文件系统读写） |
| `app/[lang]/admin/page.tsx` | 服务端组件：开关检查、读取分类、渲染表单 |
| `components/article-editor.tsx` | 客户端组件：表单、标签输入、工具栏、预览、状态与错误展示 |
| `lib/i18n.ts` | 新增 `editor` 文案（中英） |
| `app/[lang]/layout.tsx` | 开启时显示 "New article" 按钮 |

## 10. 测试

新增开发依赖 Vitest，脚本 `npm test`，只测试 `lib/new-article.ts` 中的纯函数：

- `slugify`：大小写、标点、连续空格与符号、首尾符号、数字、纯中文标题 → 空
- `buildArticleMarkdown`：用 `gray-matter` 解析生成结果，各字段与输入完全一致；覆盖 `:`、`#`、引号、方括号、逗号、`true`、纯数字等特殊值；空 tags；正文换行规范化
- `validateArticleInput`：每条规则的通过与失败用例

端到端（手动 / 浏览器自动化）：

- 开发模式：新建文章 → 跳转到文章页，分类、标签、日期、步骤数正确；重复 slug 时提示冲突并给出建议名；必填项为空时提示错误
- 生产构建（未设 `KB_AUTHORING`）：`/admin` 返回 404，顶栏无按钮
- `npm run typecheck`、`npm run build` 通过

## 11. 文档

README 的"新建文章"一节增加图形界面的使用说明（`docker compose up` → `localhost:3200/admin`，或 `npm run dev` → `/admin`），保留手动复制模板的方式作为备选。
