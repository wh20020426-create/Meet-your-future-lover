"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  LockKeyhole,
  Check,
} from "lucide-react";
import type { Character } from "@/lib/schema";
import { palettes, renderPoster, type Palette } from "@/lib/poster";
import { api } from "@/lib/client";
import { useCharacter } from "./use-character";
import { Header, Loading, ErrorPanel } from "./ui";
export default function Poster({
  id,
  example,
}: {
  id: string;
  example?: Character;
}) {
  const { p, error, retry } = useCharacter(id, example);
  const [nickname, setNickname] = useState(""),
    [palette, setPalette] = useState<Palette>("cream"),
    [url, setUrl] = useState(""),
    [blob, setBlob] = useState<Blob | null>(null),
    [image, setImage] = useState(""),
    [failure, setFailure] = useState(""),
    [count, setCount] = useState(0),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    if (!p) return;
    if (id === "demo") setUrl(location.origin + "/result/demo");
    else
      api<{ path: string }>(`/api/results/${id}/share`, { method: "POST" })
        .then((r) => {
          if (active) setUrl(location.origin + r.path);
        })
        .catch((e) => {
          if (active) setFailure(e.message);
        });
    return () => {
      active = false;
    };
  }, [p, id, count]);
  useEffect(() => {
    if (!p || !url) return;
    let active = true;
    let objectUrl = "";
    setFailure("");
    setBlob(null);
    setSaved(false);
    const timer = setTimeout(() => {
      void renderPoster(p, nickname, palette, url)
        .then((b) => {
          if (!active) return;
          objectUrl = URL.createObjectURL(b);
          setBlob(b);
          setImage(objectUrl);
        })
        .catch((e) => {
          if (active) setFailure(e.message);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [p, url, nickname, palette, count]);
  function download() {
    if (!blob || !p) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `SoulmateLab-${p.name}-心动海报.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setSaved(true);
  }
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
  return (
    <>
      <Header />
      <main className="poster-page page-width">
        <Link className="back-link" href={`/result/${id}`}>
          <ArrowLeft size={16} />
          返回心动档案
        </Link>
        <div className="poster-layout">
          <div className="poster-preview" aria-busy={!blob}>
            {image ? (
              <img
                src={image}
                alt={`${p.name}的可保存心动海报，标有虚构人物、M1规则模拟和预制合成肖像`}
              />
            ) : (
              <Loading text="正在本机绘制海报…" />
            )}
          </div>
          <section className="poster-copy">
            <div className="eyebrow">A LITTLE KEEPSAKE</div>
            <h1>
              这一种心动，
              <br />
              值得好好收藏。
            </h1>
            <p>
              把照片、三个关键词和一句心动描述，
              <br />
              留在一张只属于这次想象的海报里。
            </p>
            <label className="poster-input-label" htmlFor="nickname">
              给海报留一个称呼<small>可选 · 不会保存到服务器</small>
            </label>
            <input
              className="poster-name"
              id="nickname"
              maxLength={10}
              placeholder="默认匿名，也可以写个昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="off"
            />
            <div className="poster-colors">
              <span>选择纸张色调</span>
              {(Object.keys(palettes) as Palette[]).map((key, i) => (
                <button
                  key={key}
                  aria-label={["奶油白", "雾粉", "浅丁香"][i]}
                  aria-pressed={palette === key}
                  className={palette === key ? "selected" : ""}
                  style={{ background: palettes[key].bg }}
                  onClick={() => setPalette(key)}
                />
              ))}
            </div>
            <button
              className="button primary"
              disabled={!blob}
              onClick={download}
            >
              {saved ? <Check size={17} /> : <Download size={17} />}{" "}
              {saved ? "再次下载海报" : "保存高清海报 · PNG"}
            </button>
            <button
              className="button secondary"
              onClick={() => setCount((v) => v + 1)}
            >
              <RefreshCw size={15} />
              重新绘制海报
            </button>
            {failure && (
              <p role="alert" className="poster-status">
                {failure}
              </p>
            )}
            {saved && (
              <p role="status" className="poster-status">
                下载已发起。若浏览器未保存，可长按或右键左侧海报保存图片。
              </p>
            )}
            <p className="poster-local-note">
              <LockKeyhole
                size={12}
                style={{ verticalAlign: "middle", marginRight: 4 }}
              />
              海报不包含你的问卷答案。
              <br />
              M1
              为本地样机：二维码与匿名链接只在这台电脑有效，下载的图片可自行分享。
            </p>
            <p className="poster-local-note">
              海报尺寸 1080 × 1680 · 肖像为预制合成图片
              <br />
              本地规则生成档案，肖像来自固定图库。
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
