import { NextRequest } from "next/server";
import { transaction } from "@/lib/store";
import {
  requireOwner,
  sameOrigin,
  respond,
  errorResponse,
  HttpError,
} from "@/lib/api";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, ctx: Context) {
  try {
    const owner = requireOwner(req);
    const { id } = await ctx.params;
    const result = await transaction((db) =>
      db.results.find((r) => r.owner === owner && r.character.id === id),
    );
    if (!result)
      throw new HttpError(404, "这份结果不存在、已过期，或已被删除。");
    return respond({ result: result.character });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    sameOrigin(req);
    const owner = requireOwner(req);
    const { id } = await ctx.params;
    await transaction((db) => {
      const index = db.results.findIndex(
        (r) => r.owner === owner && r.character.id === id,
      );
      if (index < 0) throw new HttpError(404, "结果不存在或已删除。");
      db.results.splice(index, 1);
    });
    return respond({ deleted: true });
  } catch (e) {
    return errorResponse(e);
  }
}
