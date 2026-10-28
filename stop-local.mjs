import { readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "server-process.json");
try {
  const state = JSON.parse(readFileSync(file, "utf8"));
  if (state.project !== root || state.url !== "http://127.0.0.1:3000")
    throw new Error("启动信息不属于这个项目。");
  const res = await fetch(state.url + "/api/health", {
    signal: AbortSignal.timeout(1800),
  });
  const live = await res.json();
  if (
    live.app !== "soulmate-lab" ||
    live.process_id !== state.pid ||
    live.launch_id !== state.launch_id
  )
    throw new Error("当前服务不是本启动器开启的进程。");
  process.kill(state.pid);
  unlinkSync(file);
  console.log("Soulmate Lab 本地服务已停止。保存的问卷与档案仍保留。");
} catch (e) {
  console.log("未找到本启动器运行的网站，或服务已经停止。");
  console.log(e.message);
}
