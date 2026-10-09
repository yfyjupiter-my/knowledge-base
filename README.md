# IT 知识库与故障排查系统

轻量级的公司内部知识库，帮助员工快速检索常见 IT 问题，并按步骤自助排查。

- **零数据库**：所有文章都是 `content/articles/` 下的 Markdown 文件，用 Git 维护即可
- **毫秒级搜索**：基于 Fuse.js 在浏览器端检索，支持模糊匹配、多关键词、错误码，命中处高亮显示
- **目录树导航**：左侧按分类展示全部文章，可折叠、可即时筛选（`Ctrl K`）；当前文章自动展开章节，并随滚动高亮
- **分类可自定义**：在 `content/categories.yml` 中增删分类，无需改代码或重建镜像
- **Markdown 增强**：代码高亮与一键复制（HTTP 内网环境也能复制）、GitHub 风格警告框、表格、自动目录
- **中英双语**：英文为默认语言，界面与文章均支持 English / 中文一键切换，记住用户的语言偏好；未翻译的文章自动回退显示英文原文
- **响应式布局**：PC 端为左侧目录树 + 右侧正文，移动端目录收进顶栏 ☰ 抽屉
- **Docker 部署**：`standalone` 模式 + 多阶段构建，以非 root 用户运行

技术栈：Next.js 15（App Router）· TypeScript · Tailwind CSS v4 · Fuse.js · react-markdown

---

## 1. 本地开发

环境要求：Node.js ≥ 20.9

```bash
npm install
npm run dev          # 启动开发服务器 http://localhost:3000
```

其他命令：

```bash
npm run build        # 生产构建
npm run start        # 运行生产构建
npm run typecheck    # TypeScript 类型检查
```

## 2. 新建或修改文章

所有文章都位于 `content/articles/`，**一个 `.md` 文件就是一篇文章**，文件名即 URL：

```
content/articles/vpn-connection.md  →  /articles/vpn-connection
```

### 新建文章

1. 复制 `content/articles/_template.md`（英文模板），重命名为英文短横线格式，例如 `monitor-no-signal.md`
   （以 `_` 开头的文件不会出现在知识库中，可用作模板或草稿）
2. 填写文件头部的 frontmatter：

```yaml
---
title: Monitor Shows No Signal   # 标题（必填）
summary: One-line scenario        # 显示在首页列表和文章标题下，并参与搜索
category: hardware               # categories.yml 中分类的 id、中文名或英文名，找不到时归入"其他"
tags: [monitor, dock, HDMI]      # 关键词，搜索权重较高
updated: 2026-10-08              # 更新日期，用于排序
---
```

3. 编写正文，然后提交到 Git

### 支持的写法

**排查步骤**：每个 `- [ ]` 显示为带复选框的步骤列表（仅作展示，不可勾选），文章信息中会显示总步数。

```markdown
- [ ] 确认电源指示灯亮起
- [ ] 重新插拔视频线
```

**警告框（Callout）**：支持 `NOTE`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION` 五种类型，类型后面可以写自定义标题。

```markdown
> [!WARNING] 操作前请备份
> 该操作会清除本地缓存。
```

**代码块**：标注语言后会自动高亮，并显示复制按钮。支持 `powershell`、`bat`/`cmd`、`bash`、`json`、`yaml` 等常见语言。

````markdown
```powershell
ipconfig /flushdns
```
````

另外还支持表格、链接、图片等标准 GFM 语法。二级标题（`##`）会自动出现在左侧目录树中（打开该文章时展开）。

### 中文版本（双语）

英文是默认语言。在同一目录下新建同名、带 `.zh` 后缀的文件即为中文版（中文模板见 `_template.zh.md`）：

```
content/articles/vpn-connection.md      →  /articles/vpn-connection      （英文，默认）
content/articles/vpn-connection.zh.md   →  /zh/articles/vpn-connection   （中文）
```

- 中文版的 frontmatter 格式相同，`category` 可写分类的 id 或中文名
- 没有中文版的文章，在中文站点中会显示英文内容，并带有"暂无中文版"提示和"仅英文"列表标记
- 建议中英文版本保持相同的排查步骤结构

### 修改何时生效

| 运行方式 | 生效方式 |
| --- | --- |
| `npm run dev` | 保存后刷新页面即可 |
| Docker（默认挂载了 `content/`） | 约 **60 秒**内自动生效，无需重启或重建镜像 |
| Docker（未挂载目录） | 需要重新构建镜像 |

### 新建或删除分类

左侧栏的分类定义在 `content/categories.yml`，与文章一样修改后提交到 Git 即可，生效方式同上表：

```yaml
- id: printer                       # 英文小写短横线，用于网址 /?c=printer 和文章的 category
  label: { zh: 打印扫描, en: Printing }
  description: { zh: 打印机、扫描仪、复印机, en: "Printers, scanners, copiers" }   # 可省略
  color: emerald                    # 见下方色板
```

- **新建**：复制一段并修改；列表顺序即侧栏顺序。还没有文章的新分类也会显示在侧栏（计数 0）
- **删除**：删掉对应的一段。原属该分类的文章会自动归入"其他"，不会丢失
- **颜色**：`sky` / `violet` / `amber` / `rose` / `emerald` / `teal` / `cyan` / `indigo` / `pink` / `orange` / `lime` / `slate`（只能从色板中选择）
- "其他"是内置分类，无需配置，只在有未归类文章时显示
- 文件写错或缺失时，站点会使用内置的默认四个分类，并在服务端日志中打印 `[categories]` 警告

### 修改界面文案或站点信息

- 站点名称、界面文案、IT 服务台联系方式：`lib/i18n.ts`

### 语言路由

| 地址 | 说明 |
| --- | --- |
| `/`、`/articles/...` | 英文（默认，无前缀） |
| `/zh`、`/zh/articles/...` | 中文 |

点击右上角的语言按钮会切换到另一种语言的同一页面（保留搜索词），并通过 cookie 记住选择：之后访问无前缀的英文地址会自动跳转到中文版，直到再次切换回英文。旧的 `/en/...` 链接会重定向到无前缀地址。

## 3. Docker 部署

### 使用 Docker Compose（推荐）

```bash
docker compose up -d --build   # 构建镜像并在后台启动
```

访问 http://localhost:3200。常用命令：

```bash
docker compose logs -f         # 查看日志
docker compose down            # 停止并移除容器
git pull && docker compose up -d --build   # 更新代码后重新部署
```

宿主机端口默认为 3200，如需更换可以指定其他端口：

```bash
KB_PORT=8080 docker compose up -d
```

`docker-compose.yml` 默认以只读方式将 `./content` 挂载进容器，因此在服务器上 `git pull` 更新文章或分类后，无需重建镜像即可生效。

### 直接使用 Docker

```bash
docker build -t knowledge-base:latest .
docker run -d --name knowledge-base -p 3000:3000 --restart unless-stopped knowledge-base:latest

# 可选：挂载外部内容目录（文章 + 分类配置）
docker run -d --name knowledge-base -p 3000:3000 \
  -v "$(pwd)/content:/app/content:ro" knowledge-base:latest
```

### 镜像说明

- 三阶段构建：`deps`（安装依赖）→ `builder`（构建）→ `runner`（只包含 `.next/standalone`、静态资源和文章）
- 基于 `node:22-alpine`，以 UID 1001 的非 root 用户 `nextjs` 运行
- 内置 `HEALTHCHECK`，可通过 `docker ps` 查看健康状态
- `.dockerignore` 排除了 `node_modules`、`.next`、`.git` 等目录

## 目录结构

```
├── app/
│   ├── [lang]/
│   │   ├── layout.tsx                # 根布局：顶栏 + 左侧目录树 + 右侧内容（按语言设置 <html lang>）
│   │   ├── page.tsx                  # 首页：搜索与最近更新列表
│   │   └── articles/[slug]/page.tsx  # 文章详情页
│   └── globals.css
├── middleware.ts                 # 语言路由：无前缀 → 英文，/zh → 中文
├── components/
│   ├── search-experience.tsx     # Fuse.js 实时搜索（客户端）
│   ├── sidebar-tree.tsx          # 左侧目录树：分类折叠、筛选、章节滚动高亮（客户端）
│   ├── mobile-nav.tsx            # 小屏 ☰ 按钮与抽屉目录
│   ├── code-block.tsx            # 代码块复制按钮
│   ├── callout.tsx               # 警告框
│   ├── markdown.tsx              # Markdown 渲染
│   ├── language-switcher.tsx     # 中 / 英切换按钮
│   └── article-card.tsx          # 分类标签、元信息与首页列表行
├── lib/
│   ├── articles.ts               # 读取并解析 Markdown，生成目录树数据
│   ├── search-events.ts          # 侧栏与首页搜索之间的窗口事件
│   ├── markdown-plugins.ts       # 警告框的 remark 插件
│   ├── categories.ts             # 分类类型、色板与匹配规则
│   ├── categories.server.ts      # 读取并校验 content/categories.yml
│   └── i18n.ts                   # 语言配置与中英文界面文案
├── content/
│   ├── categories.yml            # 🗂️ 分类配置（增删分类改这里）
│   └── articles/                 # 📝 文章目录（xxx.md 英文 / xxx.zh.md 中文）
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```
