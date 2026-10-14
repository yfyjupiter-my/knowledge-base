"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Code, Heading2, Info, ListChecks, X } from "lucide-react";
import { checkSlug, createArticle, type CreateArticleState } from "@/app/[lang]/admin/actions";
import { Markdown } from "@/components/markdown";
import { CALLOUT_KINDS, CODE_LANGUAGES, HEADING, STEP, calloutSnippet, codeSnippet, insertSnippet, type CalloutKind, type Snippet } from "@/lib/editor-snippets";
import { getDictionary, type Locale } from "@/lib/i18n";
import { confirmLeave, setLeaveGuard } from "@/lib/leave-guard";
import { BODY_TEMPLATE, SLUG_RE, slugify, type ArticleField } from "@/lib/new-article";

type CategoryOption = { id: string; label: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900";
const toolButtonClass =
  "inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
const proseClass =
  "prose prose-slate max-w-none dark:prose-invert prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 dark:prose-h2:border-slate-800 prose-a:text-sky-700 dark:prose-a:text-sky-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-slate-800 prose-table:text-sm";

function splitTags(raw: string): string[] {
  return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}

export function ArticleEditor({ lang, categories, today }: { lang: Locale; categories: CategoryOption[]; today: string }) {
  const d = getDictionary(lang).editor;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [updated, setUpdated] = useState(today);
  const [body, setBody] = useState(BODY_TEMPLATE);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [state, setState] = useState<CreateArticleState>({});
  const [taken, setTaken] = useState<{ suggestion?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  // 用户已确认离开或文章已创建，随后的整页跳转不再弹出 beforeunload
  const leaving = useRef(false);

  const dirty = title !== "" || summary !== "" || tags.length > 0 || tagDraft !== "" || body !== BODY_TEMPLATE;

  // 关闭标签页、刷新、后退：浏览器原生确认（顶栏入口是整页加载，后退会离开文档）；
  // 站内链接与侧栏搜索（客户端路由不触发 beforeunload）：经 leave-guard 确认
  useEffect(() => {
    if (!dirty) return;
    const confirm = () => {
      if (!window.confirm(d.leaveConfirm)) return false;
      leaving.current = true;
      return true;
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leaving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return;
      if (!confirmLeave()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    setLeaveGuard(confirm);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      setLeaveGuard(null);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, d.leaveConfirm]);

  // 文件名实时查重（300ms 防抖）
  useEffect(() => {
    setTaken(null);
    if (!SLUG_RE.test(slug)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const r = await checkSlug(slug);
        if (!cancelled) setTaken(r.exists ? { suggestion: r.suggestion } : null);
      } catch {
        // 查重只是提示，失败时以提交时的服务端检查为准
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  function clearError(field: ArticleField) {
    setState((s) => (s.fieldErrors?.[field] ? { ...s, fieldErrors: { ...s.fieldErrors, [field]: undefined } } : s));
  }

  function errorFor(field: ArticleField): string | undefined {
    const code = state.fieldErrors?.[field];
    return code ? d.errors[code] : undefined;
  }

  function onTitleChange(value: string) {
    setTitle(value);
    clearError("title");
    if (!slugEdited) {
      setSlug(slugify(value));
      clearError("slug");
    }
  }

  function onSlugChange(value: string) {
    setSlug(value);
    setSlugEdited(true);
    clearError("slug");
  }

  function applySuggestion(value: string) {
    onSlugChange(value);
    setState((s) => ({ ...s, suggestion: undefined }));
  }

  function addTags(raw: string) {
    const parts = splitTags(raw);
    if (parts.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) if (!next.includes(p)) next.push(p);
      return next;
    });
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // 中文输入法选词时的回车不是"添加标签"
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addTags(tagDraft);
      setTagDraft("");
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function onTagChange(value: string) {
    // 粘贴 "a, b, c" 时，除最后一段外立即转成标签
    const parts = value.split(/[,，]/);
    if (parts.length > 1) {
      addTags(parts.slice(0, -1).join(","));
      setTagDraft(parts[parts.length - 1]);
    } else {
      setTagDraft(value);
    }
  }

  function insert(snippet: Snippet) {
    const el = bodyRef.current;
    if (!el) return;
    const { text, cursor } = insertSnippet(body, el.selectionStart, el.selectionEnd, snippet);
    setBody(text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function submit() {
    const pendingTags = splitTags(tagDraft);
    const allTags = [...tags, ...pendingTags.filter((t) => !tags.includes(t))];
    if (pendingTags.length > 0) {
      setTags(allTags);
      setTagDraft("");
    }
    startTransition(async () => {
      let result: CreateArticleState;
      try {
        result = await createArticle(lang, { title, slug, summary, category, tags: allTags, updated, body });
      } catch {
        // dev server 重启或已停止时请求会失败：保留表单内容，提示重试
        setState({ formError: "requestFailed" });
        return;
      }
      if (result.href) {
        // 整页跳转：不受 dev 重新编译影响，并让左侧目录包含新文章
        leaving.current = true;
        window.location.assign(result.href);
        return;
      }
      setState(result);
    });
  }

  // 只有正文 textarea 允许回车换行；其他输入框按回车不提交表单
  function onFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
  }

  const slugError = errorFor("slug") ?? (taken ? d.errors.exists : undefined);
  const suggestion = state.suggestion ?? taken?.suggestion;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{d.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{d.intro}</p>

      {state.formError && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
          {state.formError === "writeFailed" ? d.errors.writeFailed(state.detail ?? "") : d.errors[state.formError]}
        </p>
      )}

      <form
        className="mt-6 space-y-6"
        onKeyDown={onFormKeyDown}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={d.fields.title} htmlFor="title" error={errorFor("title")}>
            <input id="title" className={inputClass} value={title} placeholder={d.placeholders.title} onChange={(e) => onTitleChange(e.target.value)} autoFocus />
          </Field>

          <Field
            label={d.fields.slug}
            htmlFor="slug"
            error={slugError}
            hint={title && !slug ? d.hints.slugManual : d.hints.slug(slug)}
            extra={
              slugError && suggestion ? (
                <span className="text-xs text-slate-500">
                  {d.suggestion(suggestion)}{" "}
                  <button type="button" className="font-medium text-sky-700 hover:underline dark:text-sky-400" onClick={() => applySuggestion(suggestion)}>
                    {d.useSuggestion}
                  </button>
                </span>
              ) : null
            }
          >
            <input id="slug" className={`${inputClass} font-mono`} value={slug} onChange={(e) => onSlugChange(e.target.value)} spellCheck={false} autoCapitalize="off" />
          </Field>

          <Field label={d.fields.summary} htmlFor="summary" error={errorFor("summary")} hint={d.hints.summary(summary.length)} className="md:col-span-2">
            <input
              id="summary"
              className={inputClass}
              value={summary}
              placeholder={d.placeholders.summary}
              onChange={(e) => {
                setSummary(e.target.value);
                clearError("summary");
              }}
            />
          </Field>

          <Field label={d.fields.category} htmlFor="category" error={errorFor("category")}>
            <select
              id="category"
              className={inputClass}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                clearError("category");
              }}
            >
              <option value="">{d.placeholders.category}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={d.fields.updated} htmlFor="updated" error={errorFor("updated")}>
            <input
              id="updated"
              type="date"
              className={inputClass}
              value={updated}
              onChange={(e) => {
                setUpdated(e.target.value);
                clearError("updated");
              }}
            />
          </Field>

          <Field label={d.fields.tags} htmlFor="tags" className="md:col-span-2">
            <div className={`${inputClass} flex flex-wrap items-center gap-1.5`}>
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {tag}
                  <button type="button" aria-label={d.removeTag(tag)} onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                id="tags"
                className="min-w-32 flex-1 bg-transparent outline-none"
                value={tagDraft}
                placeholder={tags.length === 0 ? d.placeholders.tags : undefined}
                onKeyDown={onTagKeyDown}
                onChange={(e) => onTagChange(e.target.value)}
                onBlur={() => {
                  addTags(tagDraft);
                  setTagDraft("");
                }}
              />
            </div>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 lg:hidden" role="tablist">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-sm ${tab === t ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400"}`}
              >
                {d.tabs[t]}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={tab === "edit" ? "" : "hidden lg:block"}>
              <label htmlFor="body" className="text-sm font-medium">
                {d.fields.body}
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <button type="button" className={toolButtonClass} onClick={() => insert(HEADING)}>
                  <Heading2 className="size-3.5" aria-hidden />
                  {d.toolbar.heading}
                </button>
                <button type="button" className={toolButtonClass} onClick={() => insert(STEP)}>
                  <ListChecks className="size-3.5" aria-hidden />
                  {d.toolbar.step}
                </button>
                <label className={toolButtonClass}>
                  <Info className="size-3.5" aria-hidden />
                  <select
                    aria-label={d.toolbar.callout}
                    className="bg-transparent outline-none"
                    value=""
                    onChange={(e) => e.target.value && insert(calloutSnippet(e.target.value as CalloutKind))}
                  >
                    <option value="">{d.toolbar.callout}</option>
                    {CALLOUT_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={toolButtonClass}>
                  <Code className="size-3.5" aria-hidden />
                  <select
                    aria-label={d.toolbar.code}
                    className="bg-transparent outline-none"
                    value=""
                    onChange={(e) => e.target.value && insert(codeSnippet(e.target.value === "plain" ? "" : e.target.value))}
                  >
                    <option value="">{d.toolbar.code}</option>
                    {CODE_LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    <option value="plain">{d.toolbar.plain}</option>
                  </select>
                </label>
              </div>
              <textarea
                id="body"
                ref={bodyRef}
                className={`${inputClass} mt-2 h-[60vh] resize-y font-mono leading-relaxed`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className={tab === "preview" ? "" : "hidden lg:block"}>
              <p className="text-sm font-medium">{d.tabs.preview}</p>
              <div className="mt-2 h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 lg:mt-[2.375rem] dark:border-slate-800 dark:bg-slate-950">
                {body.trim() ? (
                  <article lang="en" className={proseClass}>
                    <Markdown content={body} lang={lang} />
                  </article>
                ) : (
                  <p className="text-sm text-slate-400">{d.previewEmpty}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? d.submitting : d.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  extra,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  extra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {error ? (
          <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {error}
          </span>
        ) : (
          hint && <span className="text-xs text-slate-500">{hint}</span>
        )}
        {extra}
      </div>
    </div>
  );
}
