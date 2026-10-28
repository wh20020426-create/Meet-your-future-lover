import QRCode from "qrcode";
import type { Character } from "./schema";
export const palettes = {
  cream: { bg: "#fcf8f1", ink: "#4d3d4b", soft: "#b697a5", line: "#e7d4dc" },
  rose: { bg: "#f2e5e9", ink: "#574051", soft: "#ac829a", line: "#ddbdcb" },
  lilac: { bg: "#ece7f1", ink: "#483d58", soft: "#9a85ad", line: "#d3c5df" },
};
export type Palette = keyof typeof palettes;
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export async function markSyntheticPng(blob: Blob): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const payload = new TextEncoder().encode(
    "Description\0Soulmate Lab: fictional adult; pre-generated AI synthetic portrait from a static library; no live model generation.",
  );
  const type = new TextEncoder().encode("tEXt");
  const chunk = new Uint8Array(12 + payload.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, payload.length);
  chunk.set(type, 4);
  chunk.set(payload, 8);
  view.setUint32(8 + payload.length, crc32(chunk.slice(4, 8 + payload.length)));
  return new Blob([bytes.slice(0, 33), chunk, bytes.slice(33)], {
    type: "image/png",
  });
}
function imageLoad(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () =>
      reject(new Error("预制肖像暂时没能载入，请重试生成海报。"));
    im.src = url;
  });
}
function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  size: number,
  family: string,
) {
  let s = size;
  while (s > 14) {
    ctx.font = `${s}px ${family}`;
    if (ctx.measureText(text).width <= max) break;
    s--;
  }
  ctx.fillText(text, x, y);
}
export async function renderPoster(
  p: Character,
  nickname: string,
  palette: Palette,
  url: string,
): Promise<Blob> {
  await document.fonts.ready;
  const [image, qr] = await Promise.all([
    imageLoad(p.image_url),
    QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      color: { dark: palettes[palette].ink, light: palettes[palette].bg },
      errorCorrectionLevel: "M",
    }).then(imageLoad),
  ]);
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1680;
  const ctx = c.getContext("2d");
  if (!ctx)
    throw new Error("当前浏览器无法生成图片，请换用 Chrome 或 Edge 再试。");
  const color = palettes[palette];
  const serif = '"Songti SC", "STSong", "SimSun", serif',
    sans = '"Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillStyle = color.bg;
  ctx.fillRect(0, 0, 1080, 1680);
  ctx.strokeStyle = color.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 1016, 1616);
  ctx.fillStyle = color.ink;
  ctx.font = "36px Georgia";
  ctx.fillText("✳ Soulmate Lab", 72, 112);
  ctx.textAlign = "right";
  ctx.font = `17px ${sans}`;
  ctx.fillStyle = color.soft;
  ctx.fillText("灵 犀 实 验 室", 1008, 109);
  ctx.textAlign = "left";
  ctx.strokeStyle = color.line;
  ctx.beginPath();
  ctx.moveTo(72, 145);
  ctx.lineTo(1008, 145);
  ctx.stroke();
  const title = nickname.trim()
    ? `${nickname.trim()}的心动想象`
    : "我的心动，有了具体的模样";
  ctx.fillStyle = color.ink;
  fitText(ctx, title, 72, 230, 936, 49, serif);
  ctx.fillStyle = color.soft;
  ctx.font = "16px Arial";
  ctx.fillText("A FICTIONAL SOUL. A REAL FEELING.", 74, 273);
  ctx.save();
  rounded(ctx, 72, 310, 936, 823, 6);
  ctx.clip();
  ctx.drawImage(
    image,
    0,
    40,
    image.width,
    image.height - 70,
    72,
    310,
    936,
    1170,
  );
  ctx.restore();
  ctx.fillStyle = "#fffcf0dc";
  rounded(ctx, 98, 336, 302, 48, 24);
  ctx.fill();
  ctx.fillStyle = color.ink;
  ctx.font = `18px ${sans}`;
  ctx.fillText("AI 合成肖像 · 虚构人物", 119, 367);
  ctx.fillStyle = color.ink;
  ctx.font = `67px ${serif}`;
  ctx.fillText(p.name, 72, 1220);
  ctx.font = `23px ${sans}`;
  ctx.fillStyle = color.soft;
  ctx.fillText(`${p.age} 岁  /  ${p.city}  /  ${p.career.role}`, 74, 1266);
  ctx.fillStyle = color.ink;
  fitText(ctx, `“${p.tagline}”`, 74, 1325, 936, 32, serif);
  let tx = 74;
  for (const tag of p.tags) {
    ctx.font = `19px ${sans}`;
    const w = ctx.measureText(tag).width + 40;
    ctx.strokeStyle = color.line;
    rounded(ctx, tx, 1360, w, 43, 22);
    ctx.stroke();
    ctx.fillStyle = color.soft;
    ctx.fillText(tag, tx + 20, 1388);
    tx += w + 15;
  }
  ctx.strokeStyle = color.line;
  ctx.beginPath();
  ctx.moveTo(74, 1442);
  ctx.lineTo(1006, 1442);
  ctx.stroke();
  ctx.fillStyle = color.ink;
  ctx.font = `23px ${serif}`;
  ctx.fillText("回答关于真实自己的问题，", 74, 1500);
  ctx.fillText("遇见一位为你虚构的理想伴侣。", 74, 1540);
  ctx.fillStyle = color.soft;
  ctx.font = `14px ${sans}`;
  ctx.fillText("预制 AI 合成肖像 · 虚构人物 · 不预测真实伴侣", 74, 1587);
  ctx.fillText("本地体验 · 二维码仅在当前电脑有效", 74, 1614);
  ctx.drawImage(qr, 865, 1467, 140, 140);
  const blob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("图片导出没有成功，请重试。"))),
      "image/png",
    ),
  );
  return markSyntheticPng(blob);
}
