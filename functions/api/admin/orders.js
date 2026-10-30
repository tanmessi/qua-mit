import { error, json } from "../../_shared/http.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu.", 503);
  const { results } = await env.DB.prepare(
    "SELECT id, order_type, customer_name, contact, activation_email, product_id, product_name, duration, brief, amount_vnd, transfer_note, status, admin_note, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 500"
  ).all();
  return json({ orders: results });
}