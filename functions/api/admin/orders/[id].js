import { error, json, readJson, text } from "../../../_shared/http.js";

const statuses = new Set(["new", "quote_sent", "awaiting_payment", "paid", "in_progress", "fulfilled", "cancelled"]);

export async function onRequestPatch({ request, env, params }) {
  let body;
  try {
    body = await readJson(request, 4000);
  } catch (exception) {
    return error(exception.message || "Dữ liệu gửi lên không hợp lệ.");
  }
  const status = text(body.status, 32);
  const adminNote = text(body.adminNote, 2000);
  if (!statuses.has(status)) return error("Trạng thái đơn hàng không hợp lệ.");

  const result = await env.DB.prepare(
    "UPDATE orders SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?"
  ).bind(status, adminNote, new Date().toISOString(), params.id).run();
  if (!result.meta.changes) return error("Không tìm thấy đơn hàng.", 404);
  return json({ ok: true });
}