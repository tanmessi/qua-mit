import { error, json, money, readJson, text } from "../../../_shared/http.js";

const categories = new Set(["ai", "service", "digital"]);

export async function onRequestPatch({ request, env, params }) {
  let body;
  try {
    body = await readJson(request, 6000);
  } catch (exception) {
    return error(exception.message || "Dữ liệu gửi lên không hợp lệ.");
  }

  const name = text(body.name, 120);
  const category = text(body.category, 20);
  const description = text(body.description, 1000);
  const duration = text(body.duration, 80);
  const fulfillmentNote = text(body.fulfillmentNote, 1000);
  const price = body.price === "" || body.price === null ? null : Number(body.price);
  if (!name || !categories.has(category) || (price !== null && !money(price))) return error("Tên, danh mục hoặc giá sản phẩm không hợp lệ.");

  const result = await env.DB.prepare(
    "UPDATE products SET name = ?, category = ?, description = ?, duration = ?, price_vnd = ?, active = ?, requires_gmail = ?, fulfillment_note = ?, sort_order = ?, updated_at = ? WHERE id = ?"
  ).bind(name, category, description, duration, price, body.active === false ? 0 : 1, body.requiresGmail === true ? 1 : 0, fulfillmentNote, Number(body.sortOrder) || 100, new Date().toISOString(), params.id).run();
  if (!result.meta.changes) return error("Không tìm thấy sản phẩm.", 404);
  return json({ ok: true });
}