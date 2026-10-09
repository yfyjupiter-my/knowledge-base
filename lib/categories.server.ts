import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import yaml from "js-yaml";
import { COLORS, OTHER_ID, type Category, type CategoryColor } from "./categories";

export const CATEGORIES_FILE = path.join(process.cwd(), "content", "categories.yml");

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

/** categories.yml 缺失或无法解析时使用 */
const DEFAULTS: Category[] = [
  {
    id: "network",
    label: { zh: "网络连接", en: "Network" },
    description: { zh: "VPN、Wi-Fi、内网访问、DNS", en: "VPN, Wi-Fi, intranet access, DNS" },
    ...COLORS.sky,
  },
  {
    id: "account",
    label: { zh: "账号权限", en: "Accounts & Access" },
    description: { zh: "登录、密码、MFA、权限申请", en: "Sign-in, passwords, MFA, permissions" },
    ...COLORS.violet,
  },
  {
    id: "software",
    label: { zh: "软件报错", en: "Software Errors" },
    description: { zh: "办公软件、客户端、系统报错", en: "Office apps, clients, system errors" },
    ...COLORS.amber,
  },
  {
    id: "hardware",
    label: { zh: "硬件故障", en: "Hardware" },
    description: { zh: "打印机、显示器、外设、电脑", en: "Printers, monitors, peripherals, PCs" },
    ...COLORS.rose,
  },
];

function warn(message: string) {
  console.warn(`[categories] ${message}`);
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

/** 逐项校验：格式不对的条目跳过并告警，不影响其余分类 */
function parse(raw: unknown): Category[] | null {
  if (!Array.isArray(raw)) {
    warn(`${CATEGORIES_FILE} 应为列表，已使用默认分类`);
    return null;
  }
  const seen = new Set<string>();
  const result: Category[] = [];
  raw.forEach((item: Record<string, unknown> | null, i) => {
    const id = text(item?.id).toLowerCase();
    const label = (item?.label ?? {}) as Record<string, unknown>;
    const description = (item?.description ?? {}) as Record<string, unknown>;
    const zh = text(label.zh);
    if (!ID_RE.test(id)) return warn(`第 ${i + 1} 项的 id "${id}" 无效（只能用小写字母、数字和短横线），已跳过`);
    if (id === OTHER_ID) return warn(`"${OTHER_ID}" 是内置分类，无需配置，已跳过`);
    if (seen.has(id)) return warn(`id "${id}" 重复，已跳过`);
    if (!zh) return warn(`分类 "${id}" 缺少 label.zh，已跳过`);
    const color = text(item?.color);
    if (color && !(color in COLORS)) warn(`分类 "${id}" 的颜色 "${color}" 不在色板中，已改用 slate`);
    seen.add(id);
    result.push({
      id,
      label: { zh, en: text(label.en) || zh },
      description: { zh: text(description.zh), en: text(description.en) || text(description.zh) },
      ...COLORS[color in COLORS ? (color as CategoryColor) : "slate"],
    });
  });
  return result;
}

/** 每次请求读取一次，配合页面的 revalidate，修改 yml 后无需重新构建 */
export const getCategories = cache((): Category[] => {
  if (!fs.existsSync(CATEGORIES_FILE)) {
    warn(`未找到 ${CATEGORIES_FILE}，已使用默认分类`);
    return DEFAULTS;
  }
  try {
    return parse(yaml.load(fs.readFileSync(CATEGORIES_FILE, "utf8"))) ?? DEFAULTS;
  } catch (e) {
    warn(`解析 ${CATEGORIES_FILE} 失败，已使用默认分类：${(e as Error).message}`);
    return DEFAULTS;
  }
});
