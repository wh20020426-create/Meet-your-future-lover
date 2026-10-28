import { NextRequest, NextResponse } from "next/server";
import { randomToken } from "./store";
import { z } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const session = (req: NextRequest) =>
  req.cookies.get("sl_session")?.value?.match(/^[A-Za-z0-9_-]{32}$/)?.[0];
export function requireOwner(req: NextRequest) {
  const id = session(req);
  if (!id) throw new HttpError(401, "此结果仅能在创建它的浏览器中管理。");
  return id;
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  // Internal URLs can use localhost while the browser uses 127.0.0.1.
  // Compare against the actual Host, retaining strict origin and port matching.
  if (origin) {
    let source: URL;
    try {
      source = new URL(origin);
    } catch {
      throw new HttpError(403, "来源无效。");
    }
    if (
      source.host !== req.headers.get("host") ||
      !["http:", "https:"].includes(source.protocol)
    )
      throw new HttpError(403, "请从本地网站页面发起操作。");
  }
  if (req.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "拒绝跨站请求。");
}
export async function jsonBody(req: NextRequest) {
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 16_384)
    throw new HttpError(413, "提交内容太大，请重新加载问卷。");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "提交格式无效，请返回问卷重试。");
  }
}
export function respond(data: unknown, status = 200, owner?: string) {
  const response = NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
  if (owner)
    response.cookies.set("sl_session", owner, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 30 * 86400,
      path: "/",
    });
  return response;
}
export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return respond({ error: e.message }, e.status);
  if (e instanceof z.ZodError)
    return respond(
      {
        error:
          "问卷内容无效：请确认已满 18 岁，并完成年龄段和伴侣呈现两道必要题。",
      },
      400,
    );
  console.error("[Soulmate Lab] local storage operation failed");
  return respond(
    { error: "本地保存暂时失败。你的问卷进度仍保留在浏览器，请稍后重试。" },
    503,
  );
}
type Bucket = { count: number; until: number };
const g = globalThis as typeof globalThis & { slLimits?: Map<string, Bucket> };
export function limit(req: NextRequest, owner: string) {
  const map = (g.slLimits ??= new Map());
  const time = Date.now();
  for (const [key, bucket] of map) if (bucket.until < time) map.delete(key);
  // The server binds only to loopback; proxy-provided client IPs are not trusted.
  for (const key of [`session:${owner}`, "local-server"]) {
    const bucket = map.get(key) ?? { count: 0, until: time + 3600000 };
    if (bucket.count >= (key === "local-server" ? 100 : 10))
      throw new HttpError(
        429,
        "本小时的模拟次数已用完，请稍后再来。已有结果仍可查看。",
      );
    bucket.count++;
    map.set(key, bucket);
  }
}
export { randomToken };
