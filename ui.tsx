"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Flower2,
  MoveRight,
  X,
  LoaderCircle,
} from "lucide-react";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Soulmate Lab 首页">
      <span className="logo-mark">
        <Flower2 size={24} strokeWidth={1.4} />
      </span>
      <span>
        Soulmate<span className="logo-light"> Lab</span>
        <small>灵 犀 实 验 室</small>
      </span>
    </Link>
  );
}
export function Header({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`header ${compact ? "header-compact" : ""}`}>
      <Logo />
      <nav aria-label="主导航">
        <Link href="/" className="nav-home">
          实验室首页
        </Link>
        <Link href="/about">
          关于这场实验
          <ArrowUpRight size={13} />
        </Link>
      </nav>
      <span className="local-pill">
        <i />
        M1 · 本地体验
      </span>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <Logo />
      <p>每一种真实，都值得被温柔理解。</p>
      <div>
        <Link href="/about#privacy">隐私说明</Link>
        <Link href="/about">
          使用与数据管理
          <ArrowUpRight size={12} />
        </Link>
      </div>
      <small>© 2026 Soulmate Lab · 仅供 18 岁及以上用户体验</small>
    </footer>
  );
}
export function ArrowButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="button primary" {...props}>
      {children}
      <MoveRight size={19} />
    </button>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const nodes = Array.from(
              ref.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled),a[href],input:not(:disabled)",
              ) ?? [],
            );
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <button
          autoFocus
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
export function Loading({ text = "正在读取这份心动档案…" }: { text?: string }) {
  return (
    <main className="loading-page">
      <LoaderCircle size={30} className="spin" />
      <p>{text}</p>
    </main>
  );
}
export function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <main className="empty-state">
      <Flower2 size={42} strokeWidth={1} />
      <h1>这次相遇，暂时停了一下</h1>
      <p role="alert">{message}</p>
      <div>
        {retry && (
          <button className="button primary" onClick={retry}>
            重新读取
          </button>
        )}
        <Link className="button secondary" href="/">
          回到实验室
        </Link>
      </div>
    </main>
  );
}
