# 用域名发布知识库（公司内部 + 本机编辑 + Git 同步）

## 背景
后续要通过域名发布本项目。已确认：仅公司内部访问；文章仍在本机用 `/admin` 编辑，Git 同步到服务器。
代码中没有写死域名（相对链接，middleware 基于 `request.url`），`/admin` 的 localhost 限制正好让线上只读——**应用代码无需改动**，只需新增生产部署配置和文档。

## 改动

1. **新增 `docker-compose.prod.yml`**（服务器用，保留现有 `docker-compose.yml` 供本机编辑）
   - 不设 `KB_AUTHORING`（build args 与 environment 都去掉）
   - `./content:/app/content:ro` 只读挂载
   - 增加 `caddy` 服务（`caddy:2-alpine`）对外暴露 80/443，knowledge-base 不映射宿主机端口，只在 compose 内网被 Caddy 访问
   - 挂载 `./Caddyfile` 与 `caddy_data` / `caddy_config` 卷（保存证书）

2. **新增 `Caddyfile`**
   - `{$KB_DOMAIN} { reverse_proxy knowledge-base:3000 }`（Caddy 默认透传 Host，自动申请 HTTPS 证书）
   - 内部访问限制二选一（注释说明）：`basic_auth`，或用 `@internal remote_ip <公司网段>` 只允许内网 IP
   - 纯内网域名无法申请公网证书时，注释提示改用 `tls internal` 或公司证书

3. **README 增加「域名部署」小节**（第 3 节 Docker 部署下）
   - DNS 解析 → 服务器；`KB_DOMAIN=kb.example.com docker compose -f docker-compose.prod.yml up -d --build`
   - 更新流程：本机 `/admin` 编辑 → `git commit && git push` → 服务器 `git pull`（约 60 秒生效，无需重建）
   - 说明线上 `/admin` 返回 404 属于预期
   - 可选：服务器 cron 定时 `git pull` 实现自动同步

4. `public/robots.txt` 保持不变（内部系统禁止收录）。

## 不需要改的
`middleware.ts`、`lib/new-article.ts` 的 `isLocalHost`、`next.config.ts`、`Dockerfile`。

## 验证
- 本机：`KB_DOMAIN=localhost docker compose -f docker-compose.prod.yml up -d --build`，访问 `https://localhost`
  - 首页、文章、`/zh` 切换、`/en/...` 跳转后地址仍是该域名（确认 Host 透传正确）
  - `/admin` 返回 404；`/media/<图片>` 正常显示
  - 开启 basic_auth 时未登录返回 401
- `npm run typecheck && npm test` 保持通过（应用代码未改动）
