import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Soulmate Lab 灵犀实验室｜遇见与你同频的 TA",
  description:
    "回答关于真实自己的问题，遇见一位为你虚构的理想伴侣。25 道题，3–5 分钟，免登录本地体验。",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fcfaf8",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
