import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { common } from "lowlight";
import powershell from "highlight.js/lib/languages/powershell";
import dos from "highlight.js/lib/languages/dos";
import { remarkCallout, rehypeChecklist } from "@/lib/markdown-plugins";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";
import { ChecklistItem } from "./checklist";

type DataProps = Record<string, unknown>;

const components: Components = {
  pre({ node, children }) {
    const code = node?.children[0];
    const className = code?.type === "element" ? code.properties.className : undefined;
    const lang = Array.isArray(className)
      ? className.map(String).find((c) => c.startsWith("language-"))?.slice("language-".length)
      : undefined;
    return <CodeBlock language={lang}>{children}</CodeBlock>;
  },
  blockquote({ node: _node, children, ...props }) {
    const type = (props as DataProps)["data-callout"];
    if (typeof type === "string") {
      const title = (props as DataProps)["data-callout-title"];
      return (
        <Callout type={type} title={typeof title === "string" ? title : undefined}>
          {children}
        </Callout>
      );
    }
    return <blockquote {...props}>{children}</blockquote>;
  },
  li({ node: _node, children, ...props }) {
    const index = (props as DataProps)["data-task-index"];
    if (index !== undefined) return <ChecklistItem index={Number(index)}>{children}</ChecklistItem>;
    return <li {...props}>{children}</li>;
  },
  a({ node: _node, href, children, ...props }) {
    const external = href ? /^https?:\/\//.test(href) : false;
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  },
  table({ node: _node, children, ...props }) {
    return (
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table {...props}>{children}</table>
      </div>
    );
  },
};

/** 服务端渲染 Markdown；代码复制与排查清单为客户端交互组件 */
export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCallout]}
      rehypePlugins={[rehypeSlug, [rehypeHighlight, { languages: { ...common, powershell, dos } }], rehypeChecklist]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
