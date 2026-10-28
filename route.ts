import { respond } from "@/lib/api";
export const dynamic = "force-dynamic";
export function GET() {
  return respond({
    status: "ok",
    app: "soulmate-lab",
    stage: "M1",
    provider: "local-library",
    portrait_count: 60,
    paid_ai_enabled: false,
    hosting: "loopback-only",
    version: "1.0.0",
    process_id: process.pid,
    launch_id: process.env.SOULMATE_LAUNCH_ID ?? null,
  });
}
