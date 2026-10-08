import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成独立的最小化服务端产物（.next/standalone），用于精简 Docker 镜像
  output: "standalone",
  // 固定追踪根目录为项目目录，避免上层目录存在 lockfile 时产物路径嵌套
  outputFileTracingRoot: path.join(__dirname),
  // 将 Markdown 内容目录纳入产物追踪，保证 standalone 产物中可读取文章
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

export default nextConfig;
