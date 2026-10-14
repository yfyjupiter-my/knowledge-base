import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { common } from "lowlight";
import powershell from "highlight.js/lib/languages/powershell";
import dos from "highlight.js/lib/languages/dos";
import { remarkCallout } from "@/lib/markdown-plugins";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";
import { getDictionary, type Locale } from "@/lib/i18n";

type DataProps = Record<string, unknown>;

function buildComponents(lang: Locale): Components {
  return {
    pre({ node, children }) {
      const code = node?.children[0];
      const className = code?.type === "element" ? code.properties.className : undefined;
      const language = Array.isArray(className)
        ? className.map(String).find((c) => c.startsWith("language-"))?.slice("language-".length)
        : undefined;
      return (
        <CodeBlock language={language} labels={getDictionary(lang).code}>
          {children}
        </CodeBlock>
      );
    },
    blockquote({ node: _node, children, ...props }) {
      const type = (props as DataProps)["data-callout"];
      if (typeof type === "string") {
        const title = (props as DataProps)["data-callout-title"];
        return (
          <Callout type={type} lang={lang} title={typeof title === "string" ? title : undefined}>
            {children}
          </Callout>
        );
      }
      return <blockquote {...props}>{children}</blockquote>;
    },
    a({ node: _node, href, children, ...props }) {
      const external = href ? /^https?:\/\//.test(href) : false;
      return (
        <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    img({ node: _node, alt, ...props }) {
      // eslint-disable-next-line @next/next/no-img-element -- 图片来自 /media 路由，尺寸未知
      return <img alt={alt ?? ""} loading="lazy" className="rounded-lg border border-slate-200 dark:border-slate-800" {...props} />;
    },
    table({ node: _node, children, ...props }) {
      return (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table {...props}>{children}</table>
        </div>
      );
    },
  };
}

/** 服务端渲染 Markdown；代码复制为客户端交互组件 */
export function Markdown({ content, lang }: { content: string; lang: Locale }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCallout]}
      rehypePlugins={[rehypeSlug, [rehypeHighlight, { languages: { ...common, powershell, dos } }]]}
      components={buildComponents(lang)}
    >
      {content}
    </ReactMarkdown>
  );
}
