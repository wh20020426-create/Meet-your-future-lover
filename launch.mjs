import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const url = "http://127.0.0.1:3000";
async function health() {
  try {
    const r = await fetch(url + "/api/health", {
      signal: AbortSignal.timeout(1800),
    });
    const data = await r.json();
    return data.app === "soulmate-lab" ? data : null;
  } catch {
    return null;
  }
}
function open() {
  if (process.argv.includes("--no-open")) return;
  if (process.platform === "win32")
    spawn("cmd.exe", ["/c", "start", "", url], {
      windowsHide: true,
      stdio: "ignore",
    }).unref();
  else console.log("请在浏览器打开：" + url);
}
if (await health()) {
  console.log("Soulmate Lab 已在运行，正在打开网站。");
  open();
  process.exit(0);
}
if (!existsSync("node_modules/next/dist/bin/next")) {
  console.error("还没有安装依赖。请参考 README.md，先运行 npm install。");
  process.exit(1);
}
if (!existsSync(".next/BUILD_ID")) {
  console.log("首次启动：正在准备网站，请稍候…");
  const result = spawnSync(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    { stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } },
  );
  if (result.status !== 0) {
    console.error("构建失败，请将这段错误提供给开发者。");
    process.exit(1);
  }
}
mkdirSync("data", { recursive: true });
const log = openSync("data/server.log", "a");
const launchId = randomUUID();
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3000",
  ],
  {
    cwd: root,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", log, log],
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      SOULMATE_LAUNCH_ID: launchId,
    },
  },
);
child.unref();
console.log("正在启动本地网站…");
let ready = null;
for (let i = 0; i < 40; i++) {
  ready = await health();
  if (ready) break;
  await new Promise((r) => setTimeout(r, 500));
}
if (!ready) {
  console.error(
    "启动没有成功。3000 端口可能被占用，请查看 data/server.log 或联系开发者。",
  );
  process.exit(1);
}
writeFileSync(
  "data/server-process.json",
  JSON.stringify({
    pid: ready.process_id,
    project: root,
    url,
    launch_id: launchId,
  }),
);
console.log("网站已准备好：" + url);
console.log("仅当前电脑可访问，不会公开到互联网。");
open();
