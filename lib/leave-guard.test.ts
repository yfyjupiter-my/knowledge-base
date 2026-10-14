import { afterEach, describe, expect, it } from "vitest";
import { confirmLeave, setLeaveGuard } from "./leave-guard";

afterEach(() => setLeaveGuard(null));

describe("leave guard", () => {
  it("没有注册时允许离开", () => {
    expect(confirmLeave()).toBe(true);
  });

  it("按注册的确认函数决定是否离开", () => {
    setLeaveGuard(() => false);
    expect(confirmLeave()).toBe(false);
    setLeaveGuard(() => true);
    expect(confirmLeave()).toBe(true);
  });

  it("注销后恢复允许离开", () => {
    setLeaveGuard(() => false);
    setLeaveGuard(null);
    expect(confirmLeave()).toBe(true);
  });
});
