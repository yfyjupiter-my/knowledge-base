import type { CategoryId } from "./categories";

/**
 * 首页搜索状态只保存在 SearchExperience 组件内（URL 用 replaceState 同步），
 * 已在首页时点击侧栏分类或在侧栏按回车，不会触发重新挂载，因此通过窗口事件通知。
 */
export type CategoryFilter = CategoryId | "all";

export interface SearchRequest {
  q?: string;
  c?: CategoryFilter;
}

const REQUEST_EVENT = "kb:search-request";
const CATEGORY_EVENT = "kb:category-change";

/** 侧栏 → 首页：要求切换搜索词或分类 */
export function requestSearch(detail: SearchRequest) {
  window.dispatchEvent(new CustomEvent<SearchRequest>(REQUEST_EVENT, { detail }));
}

export function onSearchRequest(handler: (req: SearchRequest) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<SearchRequest>).detail);
  window.addEventListener(REQUEST_EVENT, listener);
  return () => window.removeEventListener(REQUEST_EVENT, listener);
}

/** 首页 → 侧栏：当前分类筛选，用于高亮目录中的分类 */
export function announceCategory(category: CategoryFilter) {
  window.dispatchEvent(new CustomEvent<CategoryFilter>(CATEGORY_EVENT, { detail: category }));
}

export function onCategoryChange(handler: (category: CategoryFilter) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CategoryFilter>).detail);
  window.addEventListener(CATEGORY_EVENT, listener);
  return () => window.removeEventListener(CATEGORY_EVENT, listener);
}
