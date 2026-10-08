# IT 知识库与故障排查系统

轻量级的公司内部知识库，帮助员工快速检索常见 IT 问题，并按步骤自助排查。

- **零数据库**：所有文章都是 `content/articles/` 下的 Markdown 文件，用 Git 维护即可
- **毫秒级搜索**：基于 Fuse.js 在浏览器端检索，支持模糊匹配、多关键词、错误码，命中处高亮显示
- **分类筛选**：网络连接 / 账号权限 / 软件报错 / 硬件故障
- **交互式排查清单**：勾选已完成的步骤，进度自动保存在本机浏览器中
- **Markdown 增强**：代码高亮与一键复制（HTTP 内网环境也能复制）、GitHub 风格警告框、表格、自动目录
- **中英双语**：界面与文章均支持中文 / English 一键切换，记住用户的语言偏好；未翻译的文章自动回退显示中文
- **响应式布局**：PC 端显示侧栏进度与目录，移动端底部显示进度条
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

1. 复制 `content/articles/_template.md`，重命名为英文短横线格式，例如 `monitor-no-signal.md`
   （以 `_` 开头的文件不会出现在知识库中，可用作模板或草稿）
2. 填写文件头部的 frontmatter：

```yaml
---
title: 显示器无信号排查          # 标题（必填）
summary: 一句话说明适用场景        # 显示在卡片上，并参与搜索
category: 硬件故障               # 网络连接 / 账号权限 / 软件报错 / 硬件故障（或 network / account / software / hardware）
tags: [显示器, 扩展坞, HDMI]      # 关键词，搜索权重较高
updated: 2026-10-08              # 更新日期，用于排序
---
```

3. 编写正文，然后提交到 Git

### 支持的写法

**排查步骤（交互式清单）**：每个 `- [ ]` 都会变成一个可勾选的步骤，页面会自动统计总步数与进度。

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

另外还支持表格、链接、图片等标准 GFM 语法。二级标题（`##`）会自动生成右侧目录。

### 英文版本（双语）

在同一目录下新建同名、带 `.en` 后缀的文件即为英文版：

```
content/articles/vpn-connection.md      →  /articles/vpn-connection      （中文）
content/articles/vpn-connection.en.md   →  /en/articles/vpn-connection   （英文）
```

- 英文版的 frontmatter 格式相同，`category` 可写英文 id（`network` / `account` / `software` / `hardware`）
- 没有英文版的文章，在英文站点中会显示中文内容，并带有"尚未翻译"提示和卡片标记
- 建议中英文版本保持相同的排查步骤结构；两种语言的排查进度分别保存

> **关于排查进度**：进度按"文章 + 更新日期"保存在每位员工的浏览器中。修改文章并更新 `updated` 日期后，旧进度会自动重置，避免步骤错位。

### 修改何时生效

| 运行方式 | 生效方式 |
| --- | --- |
| `npm run dev` | 保存后刷新页面即可 |
| Docker（默认挂载了 `content/articles`） | 约 **60 秒**内自动生效，无需重启或重建镜像 |
| Docker（未挂载目录） | 需要重新构建镜像 |

### 修改分类、界面文案或站点信息

- 分类（中英文名称）：`lib/categories.ts`
- 站点名称、界面文案、IT 服务台联系方式：`lib/i18n.ts`

### 语言路由

| 地址 | 说明 |
| --- | --- |
| `/`、`/articles/...` | 中文（默认，无前缀） |
| `/en`、`/en/articles/...` | 英文 |

点击右上角的语言按钮会切换到另一种语言的同一页面（保留搜索词），并通过 cookie 记住选择：之后访问无前缀的中文地址会自动跳转到英文版，直到再次切换回中文。

## 3. Docker 部署

### 使用 Docker Compose（推荐）

```bash
docker compose up -d --build   # 构建镜像并在后台启动
```

访问 http://localhost:3000。常用命令：

```bash
docker compose logs -f         # 查看日志
docker compose down            # 停止并移除容器
git pull && docker compose up -d --build   # 更新代码后重新部署
```

如果 3000 端口已被占用，可以指定其他宿主机端口：

```bash
KB_PORT=8080 docker compose up -d
```

`docker-compose.yml` 默认以只读方式将 `./content/articles` 挂载进容器，因此在服务器上 `git pull` 更新文章后，无需重建镜像即可生效。

### 直接使用 Docker

```bash
docker build -t knowledge-base:latest .
docker run -d --name knowledge-base -p 3000:3000 --restart unless-stopped knowledge-base:latest

# 可选：挂载外部文章目录
docker run -d --name knowledge-base -p 3000:3000 \
  -v "$(pwd)/content/articles:/app/content/articles:ro" knowledge-base:latest
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
│   │   ├── layout.tsx                # 根布局（按语言设置 <html lang>）
│   │   ├── page.tsx                  # 首页：搜索与分类筛选
│   │   └── articles/[slug]/page.tsx  # 文章详情页
│   └── globals.css
├── middleware.ts                 # 语言路由：无前缀 → 中文，/en → 英文
├── components/
│   ├── search-experience.tsx     # Fuse.js 实时搜索（客户端）
│   ├── checklist.tsx             # 排查清单与进度（客户端，localStorage）
│   ├── code-block.tsx            # 代码块复制按钮
│   ├── callout.tsx               # 警告框
│   ├── markdown.tsx              # Markdown 渲染
│   ├── language-switcher.tsx     # 中 / 英切换按钮
│   └── article-card.tsx
├── lib/
│   ├── articles.ts               # 读取并解析 Markdown
│   ├── markdown-plugins.ts       # 警告框 / 清单的 remark、rehype 插件
│   ├── categories.ts             # 分类定义
│   └── i18n.ts                   # 语言配置与中英文界面文案
├── content/articles/             # 📝 文章目录（xxx.md 中文 / xxx.en.md 英文）
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```
