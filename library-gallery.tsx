"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoveRight, Images, ShieldCheck } from "lucide-react";
import { portraitLibrary } from "@/lib/library";
import { Header, Footer } from "./ui";
export default function LibraryGallery() {
  const [gender, setGender] = useState("全部"),
    [age, setAge] = useState("全部年龄"),
    [vibe, setVibe] = useState("全部气质");
  const items = useMemo(
    () =>
      portraitLibrary.filter(
        (p) =>
          (gender === "全部" || p.gender === gender) &&
          (age === "全部年龄" || `${p.age_min}–${p.age_max}` === age) &&
          (vibe === "全部气质" || p.temperament === vibe),
      ),
    [gender, age, vibe],
  );
  return (
    <>
      <Header />
      <main className="library-page page-width">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} />
          返回实验室
        </Link>
        <div className="library-intro">
          <div className="eyebrow">THE PORTRAIT COLLECTION</div>
          <h1>心动，有很多种模样。</h1>
          <p>
            60 张预先制作的虚构成年人物肖像。
            <br />
            不实时生成图片，从你的偏好出发，在本地图库里寻找一个具体的轮廓。
          </p>
          <div className="library-facts">
            <span>
              <Images size={15} />
              60 张独立肖像
            </span>
            <span>
              <ShieldCheck size={15} />
              仅限成年虚构人物
            </span>
            <span>无实时 AI 调用</span>
          </div>
        </div>
        <section className="library-filter" aria-label="图库筛选">
          <div>
            <span>性别呈现</span>
            {["全部", "男性", "女性", "中性"].map((x) => (
              <button
                className={`chip ${gender === x ? "selected" : ""}`}
                key={x}
                onClick={() => setGender(x)}
                aria-pressed={gender === x}
              >
                {x}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="library-age">年龄段</label>
            <select
              id="library-age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            >
              {["全部年龄", "18–22", "23–27", "28–34", "35–44", "45–60"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <label htmlFor="library-vibe">气质</label>
            <select
              id="library-vibe"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
            >
              {["全部气质", "清爽自然", "干练知性", "阳光活力", "文艺温柔"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </div>
        </section>
        <div className="library-count">
          正在展示 {items.length} / 60 张 · 预制 AI 合成内容，非真人照片
        </div>
        <div className="library-grid">
          {items.map((p) => (
            <article key={p.id}>
              <div>
                <img
                  src={p.path}
                  alt={`${p.gender}呈现、${p.age_min}至${p.age_max}岁、${p.temperament}的虚构成年人物合成肖像`}
                  loading="lazy"
                />
                <span>AI 合成 · 虚构</span>
              </div>
              <h2>
                {p.temperament}
                <small>
                  {p.gender} · {p.age_min}–{p.age_max} 岁
                </small>
              </h2>
              <p>{p.style}</p>
              <small className="library-id">{p.id}</small>
            </article>
          ))}
        </div>
        <section className="library-note">
          <h2>同一张照片，也不是同一个答案。</h2>
          <p>
            图片只提供外在轮廓。人物的职业、生活细节、相处方式和解释，仍由问卷规则构建。图库有固定数量，因此不同用户可能匹配到同一张肖像；它们均不对应真人身份。
          </p>
          <Link className="button primary" href="/questionnaire">
            从我的偏好开始
            <MoveRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
