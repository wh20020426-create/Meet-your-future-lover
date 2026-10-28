import type { Answers } from "./questions";
export type Draft = {
  version: 1;
  adult_confirmed: boolean;
  answers: Answers;
  extras: Record<string, string>;
  index: number;
  key: string;
  result_id?: string;
};
export function newDraft(): Draft {
  return {
    version: 1,
    adult_confirmed: false,
    answers: {},
    extras: {},
    index: 0,
    key: crypto.randomUUID(),
  };
}
export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem("sl_draft");
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.version === 1 &&
      d.answers &&
      typeof d.answers === "object" &&
      !Array.isArray(d.answers) &&
      Number.isInteger(d.index) &&
      d.index >= 0 &&
      d.index <= 24 &&
      typeof d.key === "string" &&
      /^[a-zA-Z0-9-]{16,80}$/.test(d.key)
      ? {
          ...d,
          extras: d.extras && typeof d.extras === "object" ? d.extras : {},
          adult_confirmed: d.adult_confirmed === true,
        }
      : null;
  } catch {
    return null;
  }
}
export function saveDraft(d: Draft) {
  try {
    localStorage.setItem("sl_draft", JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      cache: "no-store",
      signal: options?.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "暂时连接不到本地服务，或请求等待过久。请确认本地网站已启动，再重试；你的答题进度已保留。",
    );
  }
  const data = await res
    .json()
    .catch(() => ({ error: "服务暂时没有返回有效内容，请重试。" }));
  if (!res.ok) throw new Error(data.error ?? "这次操作没有完成，请重试。");
  return data;
}
