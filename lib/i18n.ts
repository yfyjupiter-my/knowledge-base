export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
/** 记住用户上次选择的语言 */
export const LOCALE_COOKIE = "kb-lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** 英文为默认语言、不带前缀；中文使用 /zh 前缀 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** 去掉路径中的语言前缀，得到与语言无关的路径 */
export function stripLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

/** 求助渠道：按公司实际情况修改 */
const SUPPORT_CONTACT = "it-helpdesk@example.com";
const SUPPORT_EXT = "8000";

export const HTML_LANG: Record<Locale, string> = { zh: "zh-CN", en: "en" };

const zh = {
  site: {
    name: "IT 知识库",
    fullName: "IT 知识库与故障排查",
    description: "公司内部常见问题检索与分步排查指南",
    supportPrefix: "需要人工帮助？",
    supportLabel: "IT 服务台",
    supportContact: `分机 ${SUPPORT_EXT} · ${SUPPORT_CONTACT}`,
    /** 用于句中引用 */
    support: `IT 服务台（分机 ${SUPPORT_EXT} · ${SUPPORT_CONTACT}）`,
    footer: "文档维护于",
  },
  switcher: { label: "English", aria: "切换到英文" },
  search: {
    heading: "遇到问题？先搜一搜",
    subheading: "输入现象、错误码或关键词，按步骤自助排查常见 IT 问题",
    placeholder: "例如：VPN 连不上、809、打印机脱机…",
    aria: "搜索知识库",
    clear: "清空搜索",
    filterAria: "按分类筛选",
    all: "全部",
    allArticles: "全部文章",
    recent: "最近更新",
    clearCategory: "清除分类筛选",
    found: (n: number) => `找到 ${n} 篇相关文章`,
    inCategory: (label: string, n: number) => `${label} · ${n} 篇`,
    emptyTitle: "没有找到相关文章",
    emptyHint: (support: string) => `试试更换关键词或清除分类筛选；仍无法解决请联系${support}`,
  },
  meta: {
    steps: (n: number) => `${n} 个排查步骤`,
    minutes: (n: number) => `约 ${n} 分钟`,
    untranslated: "仅英文",
  },
  nav: {
    title: "目录",
    aria: "知识库目录",
    open: "打开目录",
    close: "关闭目录",
    filter: "筛选文章…",
    filterAria: "筛选目录中的文章",
    empty: "没有匹配的文章，按回车进行全文搜索",
    toggle: (label: string) => `展开或收起「${label}」`,
    summary: (n: number, date: string) => `共 ${n} 篇 · 最近更新 ${date}`,
    edit: (title: string) => `编辑「${title}」`,
  },
  article: {
    breadcrumb: "当前位置",
    toc: "本文目录",
    fallbackNotice: "本文暂无中文版，以下显示英文原文。",
  },
  code: { copy: "复制", copied: "已复制", failed: "复制失败，请手动选择", aria: "复制代码" },
  callout: { note: "说明", tip: "提示", important: "重要", warning: "警告", caution: "危险操作" },
  notFound: {
    title: "文章不存在或已被移除",
    hint: "链接可能已失效，试试在首页重新搜索。",
    home: "返回首页",
  },
  editor: {
    navButton: "新建文章",
    title: "新建文章",
    intro: "填写后点击“创建”，将在 content/articles/ 下生成英文文章。此页面仅在 npm run dev 下可用，创建后请自行用 Git 提交。",
    fields: { title: "标题", slug: "文件名", summary: "摘要", category: "分类", tags: "标签", updated: "更新日期", body: "正文" },
    placeholders: {
      title: "e.g. Monitor Shows No Signal",
      summary: "One sentence describing when this article applies",
      category: "选择分类",
      tags: "输入后按回车或逗号添加",
    },
    hints: {
      slug: (slug: string) => `保存为 content/articles/${slug || "…"}.md`,
      slugManual: "标题中没有英文字母或数字，请手动填写文件名",
      summary: (n: number) => `${n} 个字符`,
    },
    toolbar: {
      heading: "章节",
      step: "步骤",
      callout: "提示框",
      code: "代码块",
      plain: "纯文本",
      image: "图片",
      imageHint: "也可以直接粘贴或拖入正文；图片保存到 content/images/",
      import: "导入 Markdown",
      importHint: "读取 .md 文件，用其中的 front matter 与正文替换当前表单内容",
    },
    importConfirm: "导入会替换表单中的全部内容，确定继续吗？",
    importErrors: {
      notUtf8: (name: string) => `${name}：不是 UTF-8 编码的文本文件`,
      readFailed: (name: string) => `${name}：无法读取文件`,
    },
    uploading: "上传中…",
    uploadErrors: {
      disabled: "只有在开发模式或开启 KB_AUTHORING 时才能上传图片",
      forbiddenHost: "只能在本机通过 localhost 访问时上传图片",
      unsupportedType: (name: string) => `${name}：只支持 PNG、JPG、GIF、WebP 图片`,
      tooLarge: (name: string) => `${name}：图片不能超过 5 MB`,
      requestFailed: "无法连接服务器，图片未上传",
      writeFailed: (detail: string) => `保存图片失败：${detail}`,
    },
    tabs: { edit: "编辑", preview: "预览" },
    previewEmpty: "正文为空",
    removeTag: (tag: string) => `删除标签 ${tag}`,
    submit: "创建",
    submitting: "正在创建…",
    editTitle: "编辑文章",
    editIntro: (file: string) => `修改后点击“保存”，将覆盖 content/articles/${file}。保存后请自行用 Git 提交。`,
    editSlugHint: "编辑时不能修改文件名",
    save: "保存",
    saving: "正在保存…",
    leaveConfirm: "有尚未保存的内容，确定离开吗？",
    errors: {
      required: "此项必填",
      invalidSlug: "只能使用小写英文字母、数字和短横线，且必须以字母或数字开头",
      unknownCategory: "分类不存在，请重新选择",
      invalidDate: "日期格式应为 YYYY-MM-DD",
      exists: "同名文章已存在",
      disabled: "只有在开发模式（npm run dev）下才能创建文章",
      forbiddenHost: "只能在本机通过 localhost 访问时创建文章",
      requestFailed: "无法连接开发服务器，请确认 npm run dev 仍在运行后重试（已填写的内容仍保留）",
      writeFailed: (detail: string) => `写入文件失败：${detail}`,
      conflict: "文件在你打开编辑页后已被修改。请先复制你的改动，刷新页面后再保存",
      notFound: "文章不存在或已被删除",
    },
    suggestion: (slug: string) => `可以使用 ${slug}`,
    useSuggestion: "使用",
  },
};

export type Dictionary = typeof zh;

const en: Dictionary = {
  site: {
    name: "IT Knowledge Base",
    fullName: "IT Knowledge Base & Troubleshooting",
    description: "Search common IT issues and follow step-by-step troubleshooting guides",
    supportPrefix: "Need a human?",
    supportLabel: "IT Service Desk",
    supportContact: `ext. ${SUPPORT_EXT} · ${SUPPORT_CONTACT}`,
    support: `the IT Service Desk (ext. ${SUPPORT_EXT} · ${SUPPORT_CONTACT})`,
    footer: "Docs maintained in",
  },
  switcher: { label: "中文", aria: "Switch to Chinese" },
  search: {
    heading: "Having an issue? Search first",
    subheading: "Type a symptom, error code or keyword and troubleshoot common IT issues step by step",
    placeholder: "e.g. VPN won't connect, 809, printer offline…",
    aria: "Search the knowledge base",
    clear: "Clear search",
    filterAria: "Filter by category",
    all: "All",
    allArticles: "All articles",
    recent: "Recently updated",
    clearCategory: "Clear category filter",
    found: (n: number) => `${n} matching article${n === 1 ? "" : "s"}`,
    inCategory: (label: string, n: number) => `${label} · ${n} article${n === 1 ? "" : "s"}`,
    emptyTitle: "No matching articles",
    emptyHint: (support: string) => `Try different keywords or clear the category filter. Still stuck? Contact ${support}`,
  },
  meta: {
    steps: (n: number) => `${n} step${n === 1 ? "" : "s"}`,
    minutes: (n: number) => `${n} min read`,
    untranslated: "Chinese only",
  },
  nav: {
    title: "Contents",
    aria: "Knowledge base contents",
    open: "Open contents",
    close: "Close contents",
    filter: "Filter articles…",
    filterAria: "Filter articles in the contents",
    empty: "No matches. Press Enter for a full-text search.",
    toggle: (label: string) => `Expand or collapse "${label}"`,
    summary: (n: number, date: string) => `${n} article${n === 1 ? "" : "s"} · updated ${date}`,
    edit: (title: string) => `Edit "${title}"`,
  },
  article: {
    breadcrumb: "Breadcrumb",
    toc: "On this page",
    fallbackNotice: "This article has not been translated into English yet. The Chinese version is shown below.",
  },
  code: { copy: "Copy", copied: "Copied", failed: "Copy failed, select manually", aria: "Copy code" },
  callout: { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" },
  notFound: {
    title: "Article not found",
    hint: "The link may be outdated. Try searching from the home page.",
    home: "Back to home",
  },
  editor: {
    navButton: "New article",
    title: "New article",
    intro: "Fill in the form and click Create to generate an English article in content/articles/. This page is only available under npm run dev; commit the file with Git afterwards.",
    fields: { title: "Title", slug: "File name", summary: "Summary", category: "Category", tags: "Tags", updated: "Updated", body: "Body" },
    placeholders: {
      title: "e.g. Monitor Shows No Signal",
      summary: "One sentence describing when this article applies",
      category: "Choose a category",
      tags: "Type and press Enter or comma",
    },
    hints: {
      slug: (slug: string) => `Saved as content/articles/${slug || "…"}.md`,
      slugManual: "The title has no English letters or digits. Enter a file name manually.",
      summary: (n: number) => `${n} character${n === 1 ? "" : "s"}`,
    },
    toolbar: {
      heading: "Section",
      step: "Step",
      callout: "Callout",
      code: "Code",
      plain: "Plain text",
      image: "Image",
      imageHint: "You can also paste or drop images into the body. Images are saved to content/images/",
      import: "Import Markdown",
      importHint: "Read a .md file and replace the form contents with its front matter and body",
    },
    importConfirm: "Importing replaces everything in the form. Continue?",
    importErrors: {
      notUtf8: (name: string) => `${name}: not a UTF-8 text file`,
      readFailed: (name: string) => `${name}: could not read the file`,
    },
    uploading: "Uploading…",
    uploadErrors: {
      disabled: "Images can only be uploaded in development mode or with KB_AUTHORING enabled",
      forbiddenHost: "Images can only be uploaded when this page is opened via localhost on this machine",
      unsupportedType: (name: string) => `${name}: only PNG, JPG, GIF and WebP images are supported`,
      tooLarge: (name: string) => `${name}: images must be 5 MB or smaller`,
      requestFailed: "Could not reach the server. The image was not uploaded.",
      writeFailed: (detail: string) => `Could not save the image: ${detail}`,
    },
    tabs: { edit: "Edit", preview: "Preview" },
    previewEmpty: "Nothing to preview",
    removeTag: (tag: string) => `Remove tag ${tag}`,
    submit: "Create",
    submitting: "Creating…",
    editTitle: "Edit article",
    editIntro: (file: string) => `Click Save to overwrite content/articles/${file}. Commit the change with Git afterwards.`,
    editSlugHint: "The file name cannot be changed while editing",
    save: "Save",
    saving: "Saving…",
    leaveConfirm: "You have unsaved changes. Leave this page?",
    errors: {
      required: "Required",
      invalidSlug: "Use lowercase letters, digits and hyphens only, starting with a letter or digit",
      unknownCategory: "This category no longer exists. Choose another one.",
      invalidDate: "Use the format YYYY-MM-DD",
      exists: "An article with this file name already exists",
      disabled: "Articles can only be created in development mode (npm run dev)",
      forbiddenHost: "Articles can only be created when this page is opened via localhost on this machine",
      requestFailed: "Could not reach the dev server. Make sure npm run dev is still running and try again (your input is kept).",
      writeFailed: (detail: string) => `Could not write the file: ${detail}`,
      conflict: "The file was changed after you opened this page. Copy your edits, reload the page, then save again.",
      notFound: "This article does not exist or has been removed",
    },
    suggestion: (slug: string) => `Try ${slug}`,
    useSuggestion: "Use",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

