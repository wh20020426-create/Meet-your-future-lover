import Link from "next/link";
import { Header, Footer } from "@/components/ui";
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="empty-state not-found">
        <div className="eyebrow">A LITTLE OFF THE PATH</div>
        <h1>这条小路，还没有故事。</h1>
        <p>你打开的页面不存在。回到实验室，重新开启一场相遇吧。</p>
        <Link href="/" className="button primary">
          回到实验室
        </Link>
      </main>
      <Footer />
    </>
  );
}
