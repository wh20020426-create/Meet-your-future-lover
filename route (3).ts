import { NextRequest } from "next/server";
import { requestSchema } from "@/lib/schema";
import { inputFingerprint } from "@/lib/engine";
import { transaction } from "@/lib/store";
import { getProvider } from "@/lib/providers";
import {
  sameOrigin,
  jsonBody,
  session,
  randomToken,
  respond,
  errorResponse,
  HttpError,
  limit,
  requireOwner,
} from "@/lib/api";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const input = requestSchema.parse(await jsonBody(req));
    const owner = session(req) ?? randomToken();
    const requestKey = req.headers.get("idempotency-key");
    if (!requestKey || !/^[a-zA-Z0-9-]{16,80}$/.test(requestKey))
      throw new HttpError(400, "生成请求缺少有效标识，请重新提交。");
    const fingerprint = inputFingerprint(input);
    const data = await transaction(async (db) => {
      const existing = db.results.find(
        (r) => r.owner === owner && r.request_key === requestKey,
      );
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          throw new HttpError(409, "此请求已用于另一份问卷，请重新发起测试。");
        return existing;
      }
      limit(req, owner);
      const character = await getProvider().generate(input);
      const result = {
        owner,
        request_key: requestKey,
        fingerprint,
        share_token: null,
        character,
      };
      db.results.push(result);
      return result;
    });
    return respond({ result: data.character }, 201, owner);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    sameOrigin(req);
    const owner = requireOwner(req);
    await transaction((db) => {
      db.results = db.results.filter((r) => r.owner !== owner);
    });
    return respond({ deleted: true });
  } catch (e) {
    return errorResponse(e);
  }
}
