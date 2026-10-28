"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoveRight,
  ArrowDown,
  Sparkles,
  LockKeyhole,
  Clock3,
  Check,
  Heart,
  Fingerprint,
  Leaf,
  ArrowUpRight,
} from "lucide-react";
import { Header, Footer, Modal } from "./ui";
export default function Home() {
  const router = useRouter();
  const [gate, setGate] = useState(false),
    [adult, setAdult] = useState(false),
    [draft, setDraft] = useState(false),
    [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    try {
      setDraft(!!localStorage.getItem("sl_draft"));
      setLast(localStorage.getItem("sl_last_result"));
    } catch {}
  }, []);
  function start() {
    setGate(true);
  }
  function begin() {
    try {
      sessionStorage.setItem("sl_adult", "true");
    } catch {}
    router.push("/questionnaire");
  }
  return (
    <>
      <Header />
      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-star">✳</span> A LITTLE ABOUT YOU. A LITTLE
              ABOUT LOVE.
            </div>
            <h1>
              遇见，与你
              <br />
              同频的 <em>TA。</em>
              <svg
                className="title-underline"
                viewBox="0 0 190 22"
                aria-hidden="true"
              >
                <path
                  d="M3 15Q91-7 184 12M12 20Q95 5 158 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </h1>
            <p className="hero-description">
              从真实的你出发，
              <br className="mobile-only" />
              描绘一位理想中的同行者。
              <br />
              让关于爱的想象，有一点具体的模样。
            </p>
            <div className="hero-actions">
              <button className="button primary hero-cta" onClick={start}>
                {draft ? "继续我的心动实验" : "开启我的心动实验"}
                <MoveRight size={21} />
              </button>
              <Link className="text-link" href="/result/demo">
                先看一份示例
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <Clock3 size={14} />
                3–5 分钟
              </span>
              <span>
                <Check size={15} />
                25 道小问题
              </span>
              <span>
                <LockKeyhole size={14} />
                免登录
              </span>
            </div>
            {last && (
              <Link className="last-result" href={`/result/${last}`}>
                查看上一次的心动档案
                <MoveRight size={14} />
              </Link>
            )}
            <Link className="library-home-link" href="/library">
              浏览心动肖像集
              <ArrowUpRight size={13} />
              <small>60 张预制人物写真</small>
            </Link>
            <p className="hero-disclaimer">
              仅供 18+ 娱乐与自我探索 · 生成的是虚构人物
            </p>
          </div>
          <div className="hero-art" aria-label="虚构人物档案预制肖像示例">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-spark spark-one">✳</span>
            <span className="art-spark spark-two">+</span>
            <span className="art-micro">
              THE ART OF
              <br />
              BEING UNDERSTOOD.
            </span>
            <div className="portrait-back">
              <img
                src="/library/male-23-27-natural.webp"
                alt="男性虚构人物预制合成肖像"
              />
              <span>ANOTHER POSSIBILITY ↗</span>
            </div>
            <div className="portrait-main">
              <div className="photo-wrap">
                <img
                  src="/library/female-23-27-soft.webp"
                  alt="林知夏，虚构人物预制合成肖像"
                />
                <span className="photo-label">
                  <span />
                  AI 合成 · 虚构人物
                </span>
                <div className="photo-cross">+</div>
              </div>
              <div className="portrait-caption">
                <span>
                  <small>YOUR SOULMATE, IMAGINED</small>
                  <strong>
                    林知夏<span>25 岁 · 杭州</span>
                  </strong>
                </span>
                <Heart size={22} strokeWidth={1.1} />
              </div>
            </div>
            <div className="floating-tag tag-one">
              <span className="tag-icon">
                <Leaf size={19} strokeWidth={1.2} />
              </span>
              <span>
                <small>你们的心动关键词</small>温柔有回应 · 尊重边界
              </span>
            </div>
            <div className="floating-note">
              <span>“</span>原来，被理解的感觉
              <br />
              可以这样具体。<i>an imagined connection</i>
            </div>
            <div className="art-index">
              FIG. 01 <span>一段关系的可能性</span>
            </div>
          </div>
        </section>
        <div className="marquee-strip">
          <span>BE YOURSELF</span>
          <i>✳</i>
          <span>找到相处的默契</span>
          <i>✳</i>
          <span>IMAGINE THE CONNECTION</span>
          <i>✳</i>
          <span>从真实的你开始</span>
          <i>✳</i>
          <span>BE YOURSELF</span>
        </div>
        <section className="how-section page-width" id="how">
          <div className="section-intro">
            <div>
              <div className="eyebrow">THE EXPERIMENT</div>
              <h2>一场关于「被理解」的小实验</h2>
            </div>
            <p>
              不需要完美的回答。
              <br />
              只要诚实一点点，就离自己更近一点。
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="step-number">
                01<small>ABOUT YOU</small>
              </span>
              <Fingerprint size={32} strokeWidth={1} />
              <h3>先认识真实的自己</h3>
              <p>从日常习惯到亲密期待，25 道问题，慢慢拼出你的关系偏好。</p>
            </article>
            <article>
              <span className="step-number">
                02<small>THE CONNECTION</small>
              </span>
              <Sparkles size={32} strokeWidth={1} />
              <h3>让心动有具体的模样</h3>
              <p>
                用可解释的偏好规则，构建一位有生活细节、也有小缺点的虚构人物。
              </p>
            </article>
            <article>
              <span className="step-number">
                03<small>A LITTLE KEEPSAKE</small>
              </span>
              <Heart size={32} strokeWidth={1} />
              <h3>收藏这一种可能</h3>
              <p>读懂契合与不同，保存专属海报，把这份关于爱的想象留给自己。</p>
            </article>
          </div>
        </section>
        <section className="manifesto page-width">
          <span className="manifesto-star">✳</span>
          <div>
            <span className="eyebrow">A NOTE FROM THE LAB</span>
            <h2>
              我们不预言爱情，
              <br />
              只让你的期待被认真看见。
            </h2>
            <p>
              这里没有注定的另一半，也没有标准的理想型。
              <br />
              每一份档案，都是基于问卷偏好的虚构创作，
              <br />
              也许能帮你更清楚地说出：我想要怎样的关系。
            </p>
            <Link className="text-link" href="/about">
              了解实验原理
              <MoveRight size={16} />
            </Link>
          </div>
          <span className="manifesto-stamp">
            IMAGINED
            <br />
            WITH CARE.
            <Heart size={22} strokeWidth={1} />
          </span>
        </section>
      </main>
      <Footer />
      {gate && (
        <Modal title="开启心动实验" onClose={() => setGate(false)}>
          <div className="gate-symbol">
            <Sparkles size={29} strokeWidth={1.2} />
          </div>
          <div className="eyebrow">BEFORE WE BEGIN</div>
          <h2>把一点时间，留给自己。</h2>
          <p>
            这是一场基于偏好的虚构伴侣模拟，
            <br />
            不是现实配对、心理诊断或未来预测。
          </p>
          <label className="adult-check">
            <input
              type="checkbox"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
            />
            <span>我已年满 18 周岁，并理解结果为虚构创作。</span>
          </label>
          <button
            className="button primary full"
            disabled={!adult}
            onClick={begin}
          >
            {draft ? "继续上次的问卷" : "好的，开始认识我"}
            <MoveRight size={19} />
          </button>
          <small className="gate-privacy">
            <LockKeyhole size={12} />
            问卷进度保留在本机，可随时删除
          </small>
          <Link className="gate-link" href="/about#privacy">
            查看隐私与使用说明
          </Link>
        </Modal>
      )}
    </>
  );
}
