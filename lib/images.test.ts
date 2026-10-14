import { describe, expect, it } from "vitest";
import { IMAGE_FILE_RE, altFromFileName, detectImageType } from "./images";

const bytes = (...b: number[]) => Uint8Array.from(b);

describe("detectImageType", () => {
  it("按文件头识别 png / jpg / gif / webp", () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("png");
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpg");
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBe("gif");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("webp");
  });

  it("SVG、文本、空文件和其他 RIFF（如 wav）都拒绝", () => {
    expect(detectImageType(new TextEncoder().encode("<svg></svg>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("hello.png"))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WAVEfmt "))).toBeNull();
  });
});

describe("IMAGE_FILE_RE", () => {
  it("只接受哈希文件名", () => {
    expect(IMAGE_FILE_RE.test("0123456789abcdef.png")).toBe(true);
    expect(IMAGE_FILE_RE.test("../package.json")).toBe(false);
    expect(IMAGE_FILE_RE.test("0123456789abcdef.svg")).toBe(false);
    expect(IMAGE_FILE_RE.test("logo.png")).toBe(false);
  });
});

describe("altFromFileName", () => {
  it("去掉扩展名与 Markdown 特殊字符", () => {
    expect(altFromFileName("VPN 设置.png")).toBe("VPN 设置");
    expect(altFromFileName("a[1].jpg")).toBe("a 1");
  });
});
