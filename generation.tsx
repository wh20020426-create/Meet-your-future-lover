"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Check,
  LoaderCircle,
  MoveRight,
  ArrowLeft,
} from "lucide-react";
import type { Character } from "@/lib/schema";
import { api, loadDraft, saveDraft } from "@/lib/client";
import { Header } from "./ui";
export default function Generation() {
  const router = useRouter();
  const [p, setP] = useState<Character | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [loaded, setLoaded] = useState(false),
    [portraitError, setPortraitError] = useState(false),
    [portraitRetry, setPortraitRetry] = useState(0);
  const launched = useRef(false);
  useEffect(() => {
    if (launched.current) return;
    launched.current = true;
    const d = loadDraft();
    if (!d?.adult_confirmed) {
      router.replace("/questionnaire");
      return;
    }
    const generate = async () => {
      try {
        setError("");
        const response = d.result_id
          ? await api<{ result: Character }>(`/api/results/${d.result_id}`)
          : await api<{ result: Character }>("/api/results", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": d.key,
              },
              body: JSON.stringify({
                adult_confirmed: d.adult_confirmed,
                answers: d.answers,
                extras: d.extras,
              }),
            });
        setP(response.result);
        saveDraft({ ...d, result_id: response.result.id });
        try {
          localStorage.setItem("sl_last_result", response.result.id);
        } catch {}
      } catch (e) {
        setError((e as Error).message);
      }
    };
    void generate();
  }, [router, attempt]);
  return (
    <>
      <Header compact />
      <main className="generation">
        <Link href="/refine" className="back-link">
          <ArrowLeft size={16} />
          返回补充细节
        </Link>
        <div className={`generation-orbit ${p ? "done" : ""}`}>
          <i />
          <i />
          <Sparkles size={38} strokeWidth={1} />
        </div>
        <div className="eyebrow">A CONNECTION IS TAKING SHAPE</div>
        <h1>{p ? "心动的轮廓，有了名字。" : "把你的期待，拼成一个人。"}</h1>
        <p className="muted">规则档案 + 本地图库 · 无实时 AI 调用</p>
        <div className="generation-steps">
          <span>
            <Check size={15} />
            问卷与成年校验
          </span>
          <span>
            {p ? (
              <Check size={15} />
            ) : (
              <LoaderCircle className="spin" size={15} />
            )}
            构建结构化人物档案
          </span>
          <span>
            {loaded ? <Check size={15} /> : <span className="mini-dot" />}
            载入本地预制合成肖像
          </span>
        </div>
        {error ? (
          <div className="generation-error">
            <p role="alert">{error}</p>
            <button
              className="button primary"
              onClick={() => {
                launched.current = false;
                setAttempt((v) => v + 1);
              }}
            >
              重试这次生成
            </button>
            <small>沿用同一个请求标识，成功的结果会被复用。</small>
          </div>
        ) : p ? (
          <div className="generation-result">
            <div className="generation-portrait">
              <img
                src={`${p.image_url}${portraitRetry ? `?retry=${portraitRetry}` : ""}`}
                alt={`${p.name}的虚构人物预制合成肖像`}
                onLoad={() => {
                  setLoaded(true);
                  setPortraitError(false);
                }}
                onError={() => {
                  setLoaded(false);
                  setPortraitError(true);
                }}
              />
            </div>
            <div>
              <small>{p.archetype}</small>
              <h2>
                {p.name}
                <span>
                  {p.age} 岁 · {p.city}
                </span>
              </h2>
              <blockquote>“{p.tagline}”</blockquote>
              {portraitError && (
                <p className="inline-warning" role="status">
                  肖像未能加载，文字档案仍可查看。
                  {portraitRetry === 0 && (
                    <button
                      className="text-link"
                      onClick={() => {
                        setPortraitError(false);
                        setPortraitRetry(1);
                      }}
                    >
                      重试载入肖像
                    </button>
                  )}
                </p>
              )}
              <Link className="button primary" href={`/result/${p.id}`}>
                打开完整心动档案
                <MoveRight size={19} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="generation-placeholder">
            <LoaderCircle size={22} className="spin" />
            <span>先生成文字档案，再匹配图库肖像…</span>
          </div>
        )}
        <p className="generation-note">
          所有人物、经历与故事均为虚构，肖像为预制合成内容。
          <br />
          这不是对未来伴侣的预测，也不代表真实的婚恋匹配。
        </p>
      </main>
    </>
  );
}
