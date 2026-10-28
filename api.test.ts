import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { defaults } from "../lib/questions";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
let cookie = "";
async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(base + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return res;
}
test("M1 API 端到端：创建、缓存、隐私分享、会话隔离和删除", async (t) => {
  const health = await (await request("/api/health")).json();
  assert.equal(health.status, "ok");
  assert.equal(health.paid_ai_enabled, false);
  let id = "";
  let share = "";
  const key = randomUUID();
  const body = { adult_confirmed: true, answers: defaults, extras: {} };
  await t.test("成年人和输入校验", async () => {
    const res = await request("/api/results", {
      method: "POST",
      headers: { "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ ...body, adult_confirmed: false }),
    });
    assert.equal(res.status, 400);
  });
  await t.test("跨站请求阻断", async () => {
    const res = await request("/api/results", {
      method: "POST",
      headers: {
        Origin: "https://not-this-site.invalid",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 403);
  });
  await t.test("首次创建与刷新不重算", async () => {
    const res = await request("/api/results", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 201);
    const p = (await res.json()).result;
    id = p.id;
    const cached = await request("/api/results", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    assert.equal((await cached.json()).result.id, id);
    const get = await request("/api/results/" + id);
    assert.deepEqual((await get.json()).result, p);
  });
  await t.test("相同幂等标识不能用于不同答案", async () => {
    const res = await request("/api/results", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ ...body, answers: { ...defaults, q03: "女性" } }),
    });
    assert.equal(res.status, 409);
  });
  await t.test("未授权浏览器不能读写私人结果", async () => {
    const res = await fetch(base + "/api/results/" + id);
    assert.equal(res.status, 401);
    const del = await fetch(base + "/api/results/" + id, { method: "DELETE" });
    assert.equal(del.status, 401);
  });
  await t.test("匿名分享投影不泄露问卷数据且 token 稳定", async () => {
    const res = await request(`/api/results/${id}/share`, { method: "POST" });
    assert.equal(res.status, 200);
    share = (await res.json()).path;
    const again = await request(`/api/results/${id}/share`, { method: "POST" });
    assert.equal((await again.json()).path, share);
    const pub = await fetch(base + "/api" + share);
    assert.equal(pub.status, 200);
    const data = await pub.json();
    assert.equal("modeling" in data.result, false);
    assert.equal("compatibility" in data.result, false);
    assert.equal("answers" in data.result, false);
  });
  await t.test("所有页面与图像可访问", async () => {
    for (const url of [
      "/",
      "/questionnaire",
      "/refine",
      "/generate",
      "/about",
      "/library",
      "/result/demo",
      "/profile/demo",
      "/poster/demo",
      `/result/${id}`,
      `/profile/${id}`,
      `/poster/${id}`,
      share,
      "/library/female-23-27-soft.webp",
    ]) {
      const r = await request(url);
      assert.equal(r.status, 200, url);
    }
    assert.equal((await request("/not-a-page")).status, 404);
  });
  await t.test("删除后私人结果和原分享链接失效", async () => {
    assert.equal(
      (await request(`/api/results/${id}`, { method: "DELETE" })).status,
      200,
    );
    assert.equal((await request(`/api/results/${id}`)).status, 404);
    assert.equal((await fetch(base + "/api" + share)).status, 404);
  });
  await t.test("本地会话限流，全部删除只清理自己的测试记录", async () => {
    let limited = false;
    for (let i = 0; i < 12; i++) {
      const r = await request("/api/results", {
        method: "POST",
        headers: { "Idempotency-Key": randomUUID() },
        body: JSON.stringify(body),
      });
      if (r.status === 429) {
        limited = true;
        break;
      }
      assert.equal(r.status, 201);
    }
    assert.equal(limited, true);
    assert.equal(
      (await request("/api/results", { method: "DELETE" })).status,
      200,
    );
  });
});
