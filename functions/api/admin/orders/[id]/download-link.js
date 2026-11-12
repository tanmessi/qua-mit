import { accessPath, hashToken, newDownloadToken } from "../../../../_shared/ebook.js";
import { error, json } from "../../../../_shared/http.js";

export async function onRequestPost({ request, env, params }) {
  const token = newDownloadToken();
  const result = await env.DB.prepare(
    "UPDATE orders SET download_token_hash = ?, download_count = 0, updated_at = ? WHERE id = ? AND order_type = 'digital'"
  ).bind(await hashToken(token), new Date().toISOString(), params.id).run();
  if (!result.meta.changes) return error("Không tìm thấy đơn ebook.", 404);
  return json({ url: new URL(accessPath(params.id, token), request.url).toString() });
}
