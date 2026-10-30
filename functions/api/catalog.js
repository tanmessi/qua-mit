  "SELECT id, name, category, description, duration, price_vnd, requires_gmail, fulfillment_note FROM products WHERE active = 1 ORDER BY sort_order, name"
import { error, json } from "../_shared/http.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return error("Danh mục chưa được cấu hình.", 503);
  const { results } = await env.DB.prepare(
    "SELECT id, name, category, description, duration, price_vnd, fulfillment_note FROM products WHERE active = 1 ORDER BY sort_order, name"
  ).all();
  return json({ products: results });
}