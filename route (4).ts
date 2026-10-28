import { NextRequest } from "next/server";
import { transaction } from "@/lib/store";
import { publicCharacter } from "@/lib/schema";
import { respond, errorResponse, HttpError } from "@/lib/api";
export async function GET(
  _: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    if (!/^[a-zA-Z0-9_-]{32}$/.test(token))
      throw new HttpError(404, "匿名分享不存在或已失效。");
    const p = await transaction(
      (db) => db.results.find((r) => r.share_token === token)?.character,
    );
    if (!p) throw new HttpError(404, "这份分享已过期或被主人删除。");
    return respond({ result: publicCharacter(p) });
  } catch (e) {
    return errorResponse(e);
  }
}
