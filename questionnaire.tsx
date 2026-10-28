"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MoveRight,
  Check,
  LockKeyhole,
  Save as CloudCheck,
  Sparkles,
  RotateCcw,
  Leaf,
} from "lucide-react";
import { questions, extraQuestions, type Answers } from "@/lib/questions";
import { loadDraft, newDraft, saveDraft, type Draft } from "@/lib/client";
import { Header, Loading, Modal } from "./ui";
export function Questionnaire() {
  const router = useRouter();
  const [d, setD] = useState<Draft | null>(null),
    [storage, setStorage] = useState(true),
    [gate, setGate] = useState(false),
    [adult, setAdult] = useState(false),
    [restart, setRestart] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let draft = loadDraft() ?? newDraft();
    try {
      if (sessionStorage.getItem("sl_adult") === "true")
        draft = { ...draft, adult_confirmed: true };
    } catch {}
    setD(draft);
    setGate(!draft.adult_confirmed);
  }, []);
  useEffect(() => {
    if (d) setStorage(saveDraft(d));
  }, [d]);
  if (!d)
    return (
      <>
        <Header compact />
        <Loading text="正在找回你的答题进度…" />
      </>
    );
  const q = questions[Math.min(24, Math.max(0, d.index))];
  const answer = d.answers[q.id];
  const answered = questions.filter((q) => d.answers[q.id] != null).length;
  const moduleIndex = ["A", "B", "C", "D", "E", "F", "G"].indexOf(q.module[0]);
  function update(answers: Answers) {
    setD((prev) =>
      prev
        ? { ...prev, answers, key: crypto.randomUUID(), result_id: undefined }
        : prev,
    );
  }
  function next(skip = false) {
    if (!d) return;
    const nextD = {
      ...d,
      answers: skip ? { ...d.answers, [q.id]: null } : d.answers,
      index: Math.min(24, d.index + 1),
      ...(skip ? { key: crypto.randomUUID(), result_id: undefined } : {}),
    };
    setD(nextD);
    const saved = saveDraft(nextD);
    if (d.index === 24) {
      if (saved) router.push("/refine");
      else setStorage(false);
    } else requestAnimationFrame(() => title.current?.focus());
  }
  return (
    <>
      <Header compact />
      <main className="quiz-layout page-width">
        <aside className="quiz-aside">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} />
            回到实验室
          </Link>
          <div className="eyebrow">YOUR INNER UNIVERSE</div>
          <h1>
            先认识你，
            <br />
            再描绘心动。
          </h1>
          <p>
            每个答案，都是你的小小轮廓。
            <br />
            不需要完美，只需要真实。
          </p>
          <div className="quiz-illustration">
            <div />
            <Leaf size={64} strokeWidth={0.8} />
            <span>
              be you,
              <br />
              <i>beautifully.</i>
            </span>
            <small>✳</small>
          </div>
          <div className="aside-trust">
            <LockKeyhole size={15} />
            <p>
              不收集姓名或联系方式
              <br />
              你的进度只保留在这台设备
            </p>
          </div>
        </aside>
        <section className="quiz-panel">
          <div className="quiz-top">
            <span>{q.module}</span>
            <button
              className="text-link"
              onClick={() => setRestart(true)}
              aria-label="重新填写问卷"
            >
              <RotateCcw size={14} />
              <span>重填</span>
            </button>
          </div>
          <div className="progress-label">
            <span>
              已回答 <strong>{answered}</strong> / 25
            </span>
            <span>{Math.round((answered / 25) * 100)}%</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="问卷已回答题目进度"
            aria-valuenow={answered}
            aria-valuemin={0}
            aria-valuemax={25}
          >
            <span style={{ width: `${(answered / 25) * 100}%` }} />
          </div>
          <div className="module-dots" aria-label="问卷模块">
            {[
              "初次认识",
              "心动轮廓",
              "真实的你",
              "相处方式",
              "日子质地",
              "生活现实",
              "未来期待",
            ].map((m, i) => (
              <span
                key={m}
                className={
                  i === moduleIndex
                    ? "active"
                    : i < moduleIndex
                      ? "visited"
                      : ""
                }
              >
                <i />
                {m}
              </span>
            ))}
          </div>
          <div className="question-content" key={q.id}>
            <div className="question-number">
              QUESTION {String(d.index + 1).padStart(2, "0")}
              <span>{q.required ? "必要项" : "可跳过"}</span>
            </div>
            <h2 ref={title} tabIndex={-1}>
              {q.title}
            </h2>
            <p className="question-hint">{q.hint}</p>
            {q.options ? (
              <div className="options" role="group" aria-label={q.title}>
                {q.options.map((o, i) => (
                  <button
                    key={o}
                    className={`option ${answer === o ? "selected" : ""}`}
                    aria-pressed={answer === o}
                    onClick={() => update({ ...d.answers, [q.id]: o })}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{o}</span>
                    <span className="option-check">
                      {answer === o && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="scale-options">
                <div className="scale-preview">
                  <span>{answer == null ? "?" : answer}</span>
                  <small>
                    {answer == null
                      ? "选一个最接近你的刻度"
                      : Number(answer) <= 2
                        ? q.scale?.[0]
                        : Number(answer) >= 4
                          ? q.scale?.[1]
                          : "两者之间，刚刚好"}
                  </small>
                </div>
                <div
                  className="scale-buttons"
                  role="group"
                  aria-label={q.title}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      aria-label={`${v} 分`}
                      aria-pressed={answer === v}
                      className={answer === v ? "selected" : ""}
                      onClick={() => update({ ...d.answers, [q.id]: v })}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="scale-labels">
                  <span>{q.scale?.[0]}</span>
                  <span>{q.scale?.[1]}</span>
                </div>
              </div>
            )}
          </div>
          <div className="quiz-bottom">
            <div className="quiz-navigation">
              <button
                className="button quiz-prev"
                disabled={d.index === 0}
                onClick={() => setD({ ...d, index: d.index - 1 })}
              >
                <ArrowLeft size={17} />
                上一题
              </button>
              <button
                className="button primary quiz-next"
                disabled={answer == null}
                onClick={() => next()}
              >
                {d.index === 24 ? "完成核心问卷" : "下一题"}
                <MoveRight size={19} />
              </button>
            </div>
            <div className="quiz-status">
              <span className={storage ? "" : "storage-warning"}>
                <CloudCheck size={14} />
                {storage
                  ? "进度已自动保存在本机"
                  : "浏览器无法保存，请保持此页面打开"}
              </span>
              {!q.required && (
                <button className="skip" onClick={() => next(true)}>
                  跳过这题
                  <MoveRight size={13} />
                </button>
              )}
            </div>
            {!storage && (
              <p className="inline-warning">
                建议允许本地存储后重新进入；当前页面仍可答题，生成前需要保存进度。
              </p>
            )}
          </div>
        </section>
      </main>
      {gate && (
        <Modal title="成年人体验确认" onClose={() => router.push("/")}>
          <div className="gate-symbol">
            <Sparkles size={28} />
          </div>
          <h2>开始前，确认一件小事。</h2>
          <p>
            本实验仅面向 18 岁及以上用户，
            <br />
            所有人物与故事均为虚构创作。
          </p>
          <label className="adult-check">
            <input
              type="checkbox"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
            />
            <span>我已满 18 周岁，理解娱乐性模拟的含义。</span>
          </label>
          <button
            className="button primary full"
            disabled={!adult}
            onClick={() => {
              setD({ ...d, adult_confirmed: true });
              setGate(false);
            }}
          >
            开启实验
            <MoveRight size={18} />
          </button>
        </Modal>
      )}
      {restart && (
        <Modal title="重新填写" onClose={() => setRestart(false)}>
          <h2>重新描绘一次自己？</h2>
          <p>这会清空当前问卷草稿；已经生成的档案仍会保留。</p>
          <button
            className="button primary full"
            onClick={() => {
              setD({ ...newDraft(), adult_confirmed: d.adult_confirmed });
              setRestart(false);
            }}
          >
            清空草稿并重填
          </button>
          <button
            className="button secondary full"
            onClick={() => setRestart(false)}
          >
            保留草稿
          </button>
        </Modal>
      )}
    </>
  );
}
export function Refine() {
  const router = useRouter();
  const [d, setD] = useState<Draft | null>(null),
    [storage, setStorage] = useState(true);
  useEffect(() => {
    const draft = loadDraft();
    if (!draft?.adult_confirmed || !draft.answers.q01 || !draft.answers.q03) {
      router.replace("/questionnaire");
      return;
    }
    setD(draft);
  }, [router]);
  if (!d)
    return (
      <>
        <Header compact />
        <Loading />
      </>
    );
  function toggle(id: string, v: string) {
    if (!d) return;
    const extras = { ...d.extras };
    if (extras[id] === v) delete extras[id];
    else extras[id] = v;
    const next = {
      ...d,
      extras,
      key: crypto.randomUUID(),
      result_id: undefined,
    };
    setD(next);
    setStorage(saveDraft(next));
  }
  function go() {
    if (!saveDraft(d!)) {
      setStorage(false);
      return;
    }
    router.push("/generate");
  }
  return (
    <>
      <Header compact />
      <main className="refine page-width">
        <Link className="back-link" href="/questionnaire">
          <ArrowLeft size={16} />
          返回核心问卷
        </Link>
        <div className="refine-intro">
          <span className="gate-symbol">
            <Check size={28} />
          </span>
          <div className="eyebrow">A FEW LITTLE DETAILS</div>
          <h1>你的轮廓，已经很清晰。</h1>
          <p>
            已回答 {Object.values(d.answers).filter((v) => v != null).length} /
            25 道核心题。
            <br />
            想让日常细节更鲜活？可以再添几笔，也可以直接见面。
          </p>
          <button className="button primary" onClick={go}>
            直接生成我的档案
            <MoveRight size={19} />
          </button>
        </div>
        <div className="refine-heading">
          <h2>再添一点生活的细节</h2>
          <span>10 题 · 全部可选</span>
        </div>
        <div className="extras-grid">
          {extraQuestions.map((q, i) => (
            <fieldset key={q.id}>
              <legend>
                <small>{String(i + 1).padStart(2, "0")}</small>
                {q.title}
              </legend>
              <div>
                {q.options.map((o) => (
                  <button
                    key={o}
                    aria-pressed={d.extras[q.id] === o}
                    className={`chip ${d.extras[q.id] === o ? "selected" : ""}`}
                    onClick={() => toggle(q.id, o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="refine-final">
          <span>已补充 {Object.keys(d.extras).length} 项 · 选择后自动保存</span>
          <button className="button primary" onClick={go}>
            准备好了，遇见 TA
            <MoveRight size={19} />
          </button>
        </div>
        {!storage && (
          <p role="alert" className="inline-warning">
            本地存储不可用，暂时无法进入生成页。请允许浏览器保存网站数据后再试。
          </p>
        )}
      </main>
    </>
  );
}
