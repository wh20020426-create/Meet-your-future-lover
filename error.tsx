"use client";
import Link from "next/link";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="error-global">
      <h1>页面暂时没有准备好</h1>
      <p>你的问卷草稿仍保留在浏览器，可以重试或返回首页。</p>
      <button className="button primary" onClick={reset}>
        重新加载页面
      </button>
      <Link className="button secondary" href="/">
        回到首页
      </Link>
    </main>
  );
}
