import { error, json } from "../../_shared/http.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu.", 503);
  const { results } = await env.DB.prepare(
    "SELECT COALESCE(NULLIF(activation_email, ''), NULLIF(contact, '')) AS identifier, MAX(customer_name) AS customer_name, MAX(activation_email) AS activation_email, MAX(contact) AS contact, COUNT(*) AS order_count, COALESCE(SUM(CASE WHEN status IN ('paid', 'in_progress', 'fulfilled') THEN amount_vnd ELSE 0 END), 0) AS paid_total, MAX(created_at) AS last_order_at FROM orders GROUP BY lower(COALESCE(NULLIF(activation_email, ''), NULLIF(contact, ''))) ORDER BY last_order_at DESC LIMIT 500"
  ).all();
  return json({ customers: results });
}