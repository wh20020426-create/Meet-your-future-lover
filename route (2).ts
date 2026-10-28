import { NextRequest } from "next/server";
import { transaction, randomToken } from "@/lib/store";
import {
  requireOwner,
  sameOrigin,
  respond,
  errorResponse,
  HttpError,
} from "@/lib/api";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(req);
    const owner = requireOwner(req);
    const { id } = await ctx.params;
    const token = await transaction((db) => {
      const r = db.results.find(
        (r) => r.owner === owner && r.character.id === id,
      );
      if (!r) throw new HttpError(404, "结果不存在或已删除。");
      r.share_token ??= randomToken();
      return r.share_token;
    });
    return respond({ path: `/share/${token}`, scope: "local-only" });
  } catch (e) {
    return errorResponse(e);
  }
}
