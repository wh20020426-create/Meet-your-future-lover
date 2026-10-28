"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  MoveRight,
  Heart,
  Download,
  Link as LinkIcon,
  MapPin,
  ChevronDown,
  Leaf,
  MessageCircle,
  Compass,
  BookOpen,
  Sparkles,
  Trash2,
  Check,
} from "lucide-react";
import type { Character, PublicCharacter } from "@/lib/schema";
import { useCharacter } from "./use-character";
import { Header, Footer, Loading, ErrorPanel, Modal } from "./ui";
import { api } from "@/lib/client";
export function Result({ id, example }: { id: string; example?: Character }) {
  const { p, error, retry } = useCharacter(id, example);
  const router = useRouter();
  const [tab, setTab] = useState("connection"),
    [formula, setFormula] = useState(false),
    [share, setShare] = useState(""),
    [message, setMessage] = useState(""),
    [deleting, setDeleting] = useState(false),
    [busy, setBusy] = useState(false);
  if (error)
    return (
      <>
        <Header />
        <ErrorPanel message={error} retry={retry} />
      </>
    );
  if (!p)
    return (
      <>
        <Header />
        <Loading />
      </>
    );
  async function copyShare() {
    if (!p) return;
    setBusy(true);
    setMessage("");
    try {
      const path =
        id === "demo"
          ? "/result/demo"
          : (
              await api<{ path: string }>(`/api/results/${id}/share`, {
                method: "POST",
              })
            ).path;
      const url = window.location.origin + path;
      setShare(url);
      try {
        await navigator.clipboard.writeText(url);
        setMessage("链接已复制，仅可在这台电脑上打开。");
      } catch {
        setMessage("请长按或选中下方链接手动复制。");
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/api/results/${id}`, { method: "DELETE" });
      try {
        if (localStorage.getItem("sl_last_result") === id)
          localStorage.removeItem("sl_last_result");
        const draft = JSON.parse(localStorage.getItem("sl_draft") ?? "null");
        if (draft?.result_id === id) localStorage.removeItem("sl_draft");
      } catch {}
      router.replace("/");
    } catch (e) {
      setMessage((e as Error).message);
      setDeleting(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="result-page page-width">
        <div className="result-breadcrumb">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            实验室首页
          </Link>
          <span>
            {id === "demo"
              ? "示例档案 · 体验展示"
              : `专属档案 · ${p.id.slice(0, 8).toUpperCase()}`}
          </span>
        </div>
        {id === "demo" && (
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              这是一份示例档案。完成问卷后，你会获得基于自己偏好的模拟人物。
            </span>
            <Link href="/questionnaire">
              开始我的测试
              <MoveRight size={14} />
            </Link>
          </div>
        )}
        <section className="result-hero">
          <div className="result-portrait">
            <img src={p.image_url} alt={`${p.name}，虚构人物预制合成肖像`} />
            <span className="image-badge">
              <i />
              预制 AI 合成 · 虚构人物
            </span>
            <span className="portrait-vertical">
              A FICTIONAL SOUL. A REAL FEELING.
            </span>
            <div className="portrait-signature">
              {p.name}
              <small>imagined for you</small>
            </div>
          </div>
          <div className="result-intro">
            <div className="eyebrow">YOUR SOULMATE, IMAGINED</div>
            <span className="archetype">
              <span /> {p.archetype}
            </span>
            <h1>
              {p.name}
              <span>
                {p.pronouns === "TA" ? "TA" : p.pronouns}的世界，向你打开。
              </span>
            </h1>
            <div className="person-meta">
              <span>{p.age} 岁</span>
              <span>
                <MapPin size={14} />
                {p.city}
              </span>
              <span>{p.career.role}</span>
            </div>
            <blockquote>“{p.tagline}”</blockquote>
            <div className="tag-list">
              {p.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="compatibility-summary">
              <div
                className="score-ring"
                style={
                  {
                    "--score": `${p.compatibility.total}%`,
                  } as React.CSSProperties
                }
              >
                <span>
                  {p.compatibility.total}
                  <small>/ 100</small>
                </span>
              </div>
              <div>
                <h3>问卷偏好契合指数</h3>
                <p>基于产品规则的内部模拟指数</p>
                <button
                  className="text-link"
                  onClick={() => setFormula((v) => !v)}
                >
                  这个数字从哪里来？
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>
            <div className="result-hero-actions">
              <Link className="button primary" href={`/poster/${id}`}>
                <Download size={17} />
                收藏心动海报
              </Link>
              <Link className="button secondary" href={`/profile/${id}`}>
                完整人物档案
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <p className="result-note">
              姓名、职业、经历均为虚构。人物资料由本地规则构建，肖像从预制图库匹配。
            </p>
            {p.compatibility.coverage < 25 && (
              <p className="result-note">
                本次回答 {p.compatibility.coverage} / 25
                题；跳过项采用默认设定，个性化程度有限。
              </p>
            )}
          </div>
        </section>
        {formula && (
          <section className="formula-panel">
            <h3>一份透明的模拟分数</h3>
            <p>
              基准权重：关系价值观 30%、沟通与冲突 25%、生活方式 20%、现实条件
              15%、审美偏好 10%。第 6 题会微调审美权重（约
              7.3%–12.7%），其余维度按比例调整；跳过则使用中间值。
            </p>
            <code>总分 = 四舍五入（Σ 每个维度分数 × 对应权重）</code>
            <p>
              你回答了 {p.compatibility.coverage} / 25
              题。跳过项采用中性默认设定，不是关于你的判断。这套规则是产品设计假设，未经心理学量表验证，不代表现实匹配概率。
            </p>
            <Link className="text-link" href="/about#scoring">
              查看评分原理
              <MoveRight size={14} />
            </Link>
          </section>
        )}
        <div className="result-tabs" role="tablist" aria-label="心动档案内容">
          {[
            { id: "connection", name: "为什么是 TA", icon: Heart },
            { id: "life", name: "日常与相处", icon: Leaf },
            { id: "story", name: "一段相遇", icon: BookOpen },
          ].map((t) => (
            <button
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              className={tab === t.id ? "active" : ""}
              key={t.id}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={17} />
              {t.name}
            </button>
          ))}
        </div>
        <section
          className="tab-content"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === "connection" && (
            <>
              <div className="section-title">
                <div className="eyebrow">THE CHEMISTRY</div>
                <h2>你们的默契，有迹可循。</h2>
                <p>看看你的期待，如何成为 TA 的一部分。</p>
              </div>
              <div className="chemistry-grid">
                <div className="dimension-card">
                  <h3>五种维度，一份相处的可能</h3>
                  {p.compatibility.score_by_dimension.map((dim) => (
                    <div className="dimension" key={dim.key}>
                      <div>
                        <span>
                          {dim.label}
                          <small>权重 {dim.weight.toFixed(1)}%</small>
                        </span>
                        <strong>{dim.score}</strong>
                      </div>
                      <div className="dim-track">
                        <span style={{ width: `${dim.score}%` }} />
                      </div>
                      <p>{dim.explanation}</p>
                    </div>
                  ))}
                  <small className="muted">内部模拟分项 · 非临床量表</small>
                </div>
                <div className="reasons">
                  <h3>
                    <Sparkles size={19} strokeWidth={1.2} />
                    你的答案，留下的回声
                  </h3>
                  {p.compatibility.reasons.length ? (
                    p.compatibility.reasons.map((r) => (
                      <article key={r.question}>
                        <small>
                          {r.question} · 你选择了「{r.answer}」
                        </small>
                        <p>{r.detail}</p>
                      </article>
                    ))
                  ) : (
                    <article>
                      <p>
                        你跳过了关系与生活的选填项。本次使用温和、中性的模板，暂不推断你的具体偏好。
                      </p>
                    </article>
                  )}
                  <p className="coverage-note">
                    仅解释你实际回答的题目。未作答项使用默认设定。
                  </p>
                </div>
              </div>
              <div className="tensions-section">
                <div>
                  <MessageCircle size={24} strokeWidth={1.1} />
                  <span className="eyebrow">ROOM TO GROW</span>
                  <h2>合适，也需要磨合。</h2>
                  <p>
                    一份值得相信的想象，
                    <br />
                    不应该只有完美的部分。
                  </p>
                </div>
                <div>
                  {p.compatibility.tensions.map((t, i) => (
                    <article key={t}>
                      <span>0{i + 1}</span>
                      <p>{t}</p>
                    </article>
                  ))}
                  <div className="advice-box">
                    <strong>给这段想象的相处建议</strong>
                    {p.compatibility.advice.map((a) => (
                      <p key={a}>
                        <Check size={14} />
                        {a}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {tab === "life" && (
            <>
              <div className="section-title">
                <div className="eyebrow">THE LITTLE EVERYDAY</div>
                <h2>在平凡里，慢慢靠近。</h2>
                <p>喜欢不是抽象的形容词，而是具体的生活细节。</p>
              </div>
              <div className="life-grid">
                {[
                  {
                    label: "一个普通的周末",
                    text: p.lifestyle.weekend,
                    icon: Compass,
                  },
                  {
                    label: "一天的生活节奏",
                    text: p.lifestyle.routine,
                    icon: Leaf,
                  },
                  {
                    label: "表达在乎的方式",
                    text: p.relationship.love_language,
                    icon: Heart,
                  },
                  {
                    label: "留给彼此的空间",
                    text: p.relationship.boundaries,
                    icon: MessageCircle,
                  },
                ].map((x) => (
                  <article key={x.label}>
                    <x.icon size={24} strokeWidth={1.2} />
                    <h3>{x.label}</h3>
                    <p>{x.text}</p>
                  </article>
                ))}
              </div>
              <div className="everyday-list">
                <div>
                  <small>兴趣清单</small>
                  <p>{p.lifestyle.hobbies.join(" / ")}</p>
                </div>
                <div>
                  <small>餐桌上的偏爱</small>
                  <p>{p.lifestyle.food}</p>
                </div>
                <div>
                  <small>耳机里的世界</small>
                  <p>{p.lifestyle.music}</p>
                </div>
                <div>
                  <small>关于远方</small>
                  <p>{p.lifestyle.travel}</p>
                </div>
                <div>
                  <small>运动习惯</small>
                  <p>{p.lifestyle.exercise}</p>
                </div>
                <div>
                  <small>计划与即兴</small>
                  <p>{p.lifestyle.planning}</p>
                </div>
                <div>
                  <small>居住氛围</small>
                  <p>{p.lifestyle.living_environment}</p>
                </div>
                <div>
                  <small>联系频率</small>
                  <p>{p.relationship.contact_frequency}</p>
                </div>
                <div>
                  <small>相处底线</small>
                  <p>{p.relationship.bottom_line}</p>
                </div>
                <div>
                  <small>与小动物相处</small>
                  <p>{p.lifestyle.pet}</p>
                </div>
                <div>
                  <small>发生分歧的时候</small>
                  <p>{p.relationship.conflict_style}</p>
                </div>
              </div>
              <Link href={`/profile/${id}`} className="button secondary">
                继续阅读 TA 的成长与完整档案
                <ArrowUpRight size={16} />
              </Link>
            </>
          )}
          {tab === "story" && (
            <>
              <div className="story-panel">
                <div className="eyebrow">IF YOUR PATHS CROSSED</div>
                <span className="story-quote">“</span>
                <h2>假如，在某个周日下午。</h2>
                <p>{p.meet_cute}</p>
                <div className="story-divider">✳</div>
                <h3>后来，一个平凡的约会</h3>
                <p>{p.date_story}</p>
                <small>
                  以上为虚构故事片段，不暗示真实相遇的时间、地点或对象。
                </small>
              </div>
            </>
          )}
        </section>
        <section className="result-end">
          <Heart size={27} strokeWidth={1} />
          <h2>把这一种心动，留给自己。</h2>
          <p>你值得的，是具体、平等、被认真对待的关系。</p>
          <div>
            <Link href={`/poster/${id}`} className="button primary">
              <Download size={17} />
              保存分享海报
            </Link>
            <button
              className="button secondary"
              disabled={busy}
              onClick={copyShare}
            >
              <LinkIcon size={16} />
              复制匿名链接
            </button>
          </div>
          {message && (
            <p role="status" className="share-message">
              {message}
            </p>
          )}
          {share && (
            <input
              className="share-input"
              aria-label="匿名本地分享链接"
              value={share}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          )}
          <small>本地链接只在当前电脑有效；海报图片可保存后自行分享。</small>
        </section>
        <div className="result-management">
          <Link href="/questionnaire">
            <ArrowLeft size={14} />
            重新测试或修改答案
          </Link>
          {id !== "demo" && (
            <button onClick={() => setDeleting(true)}>
              <Trash2 size={14} />
              删除这份结果
            </button>
          )}
          <span>结果在本机保留 30 天</span>
        </div>
      </main>
      <Footer />
      {deleting && (
        <Modal title="删除结果" onClose={() => setDeleting(false)}>
          <h2>删除这份心动档案？</h2>
          <p>
            人物结果与匿名分享链接会一起失效。
            <br />
            已下载的海报不会从你的设备中移除。
          </p>
          <button
            className="button danger full"
            disabled={busy}
            onClick={remove}
          >
            {busy ? "正在删除…" : "确认删除这份结果"}
          </button>
          <button
            className="button secondary full"
            onClick={() => setDeleting(false)}
          >
            再留一会儿
          </button>
        </Modal>
      )}
    </>
  );
}
export function Profile({ id, example }: { id: string; example?: Character }) {
  const { p, error, retry } = useCharacter(id, example);
  if (error)
    return (
      <>
        <Header />
        <ErrorPanel message={error} retry={retry} />
      </>
    );
  if (!p)
    return (
      <>
        <Header />
        <Loading />
      </>
    );
  const info = [
    ["年龄", `${p.age} 岁（成年虚构人物）`],
    ["性别呈现", p.gender_presentation],
    ["生活城市", p.city],
    ["身高", `${p.height_cm} cm（虚构设定）`],
    ["出生月份与娱乐标签", `${p.birth_month} 月 · ${p.zodiac_entertainment}`],
    ["学历 / 专业", `${p.education.level} · ${p.education.field}`],
    ["行业 / 职业", `${p.career.industry} · ${p.career.role}`],
    [
      "工作年限",
      p.career.tenure === 0
        ? "尚无全职工作年限"
        : `${p.career.tenure} 年（模拟）`,
    ],
    ["收入示意", p.career.income_band_illustrative],
    ["外在气质", p.appearance.temperament],
    ["发型 / 穿搭", `${p.appearance.hair} · ${p.appearance.style}`],
    ["当前关系目标", p.relationship.goals],
  ];
  return (
    <>
      <Header />
      <main className="profile-page page-width">
        <Link className="back-link" href={`/result/${id}`}>
          <ArrowLeft size={16} />
          返回心动档案
        </Link>
        <div className="profile-head">
          <img src={p.image_url} alt={`${p.name}预制合成肖像`} />
          <div>
            <div className="eyebrow">THE PERSON, IN DETAIL</div>
            <h1>{p.name}的生活切片</h1>
            <p>{p.tagline}</p>
            <small>预制 AI 合成肖像 · 所有人物资料均为虚构创作</small>
          </div>
        </div>
        <section className="profile-section">
          <h2>身份与生活坐标</h2>
          <dl className="profile-data">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="profile-section narrative">
          <span className="eyebrow">BECOMING WHO THEY ARE</span>
          <h2>TA 是怎样长成现在的样子</h2>
          <p>{p.family_story}</p>
          <h3>做决定的方式</h3>
          <p>{p.personality.decision_style}</p>
          <h3>面对压力时</h3>
          <p>{p.personality.stress_support}</p>
          <h3>值得珍惜的地方</h3>
          <div className="tag-list">
            {p.personality.strengths.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <h3>不那么完美的地方</h3>
          {p.personality.flaws.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </section>
        <section className="profile-section narrative">
          <span className="eyebrow">LOVE, WITH INTENTION</span>
          <h2>关于爱，TA 想认真做的事</h2>
          <h3>表达方式</h3>
          <p>{p.relationship.love_language}</p>
          <h3>冲突与修复</h3>
          <p>{p.relationship.conflict_style}</p>
          <h3>个人边界</h3>
          <p>{p.relationship.boundaries}</p>
        </section>
        <div className="profile-foot">
          <span>
            生成于 {new Date(p.generated_at).toLocaleDateString("zh-CN")} ·
            保留至 {new Date(p.expiry_at).toLocaleDateString("zh-CN")}
          </span>
          <Link href={`/poster/${id}`} className="button primary">
            为 TA 制作海报
            <MoveRight size={17} />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
export function Shared({ token }: { token: string }) {
  const [p, setP] = useState<PublicCharacter | null>(null),
    [error, setError] = useState("");
  // Loaded with an effect in the separate fetch component below.
  return (
    <>
      <Header />
      <PublicLoader token={token} setP={setP} setError={setError} />
      {error ? (
        <ErrorPanel message={error} />
      ) : !p ? (
        <Loading />
      ) : (
        <main className="shared-page">
          <div className="eyebrow">A FRIEND'S IMAGINED CONNECTION</div>
          <h1>一种心动，被分享给你。</h1>
          <p>这是一份匿名的虚构人物卡片。</p>
          <div className="shared-card">
            <img src={p.image_url} alt="虚构人物预制合成肖像" />
            <span className="image-badge">预制 AI 合成 · 虚构人物</span>
            <div>
              <span className="archetype">{p.archetype}</span>
              <h2>
                {p.name}
                <small>
                  {p.age} 岁 · {p.city}
                </small>
              </h2>
              <p>“{p.tagline}”</p>
              <div className="tag-list">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <small>虚构人物 · 本地规则档案 · 预制 AI 合成肖像</small>
            </div>
          </div>
          <p className="share-privacy">
            此页面仅展示人物卡片，不包含答题者的答案、评分或个人资料。
          </p>
          <Link href="/questionnaire" className="button primary">
            也描绘我的理想同行者
            <MoveRight size={18} />
          </Link>
        </main>
      )}
      <Footer />
    </>
  );
}
import { useEffect } from "react";
function PublicLoader({
  token,
  setP,
  setError,
}: {
  token: string;
  setP: (p: PublicCharacter) => void;
  setError: (e: string) => void;
}) {
  useEffect(() => {
    let live = true;
    api<{ result: PublicCharacter }>(`/api/share/${token}`)
      .then((d) => {
        if (live) setP(d.result);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [token, setP, setError]);
  return null;
}
