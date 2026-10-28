import test from "node:test";
import assert from "node:assert/strict";
import { api, loadDraft } from "../lib/client";
test("连接失败提供保留进度与重试指引", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("synthetic offline fixture");
  });
  await assert.rejects(() => api("/api/results"), /本地网站已启动.*进度已保留/);
});
test("服务端失败保留可理解的错误信息", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({ error: "合成测试：本地保存失败，请重试。" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
  );
  await assert.rejects(() => api("/api/results"), /本地保存失败，请重试/);
});
test("损坏与越界的本地草稿可恢复为新会话", () => {
  const values = [
    "{broken",
    JSON.stringify({
      version: 1,
      index: 999,
      answers: {},
      key: "1234567890123456",
    }),
    "null",
  ];
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  try {
    for (const value of values) {
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: () => value },
        configurable: true,
      });
      assert.equal(loadDraft(), null);
    }
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
