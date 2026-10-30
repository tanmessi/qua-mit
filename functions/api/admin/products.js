import { error, json, money, newId, readJson, text } from "../../_shared/http.js";

const categories = new Set(["ai", "service", "digital"]);

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY sort_order, name").all();
  return json({ products: results });
}

export async function onRequestPost({ request, env }) {
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

  const id = text(body.id, 80) || newId("product-").toLowerCase();
  if (!/^[a-z0-9-]+$/.test(id)) return error("Mã sản phẩm chỉ được chứa chữ thường, số và dấu gạch ngang.");
  try {
    await env.DB.prepare(
      "INSERT INTO products (id, name, category, description, duration, price_vnd, active, requires_gmail, fulfillment_note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, name, category, description, duration, price, body.active === false ? 0 : 1, body.requiresGmail === true ? 1 : 0, fulfillmentNote, Number(body.sortOrder) || 100).run();
  } catch {
    return error("Không thể tạo sản phẩm. Kiểm tra mã sản phẩm đã tồn tại chưa.", 409);
  }
  return json({ id }, 201);
}