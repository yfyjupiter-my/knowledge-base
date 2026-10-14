/**
 * 页面内有未保存内容时（如 /admin 的编辑器）注册一个确认函数。
 * 客户端路由跳转（router.push、站内链接）不会触发 beforeunload，主动跳转前须先调用 confirmLeave()。
 */
let guard: (() => boolean) | null = null;

export function setLeaveGuard(fn: (() => boolean) | null): void {
  guard = fn;
}

/** 返回 true 表示可以离开 */
export function confirmLeave(): boolean {
  return guard ? guard() : true;
}
