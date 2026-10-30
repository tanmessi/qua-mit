import { error, json } from "../../_shared/http.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu.", 503);
  const [totals, statuses, revenue] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS order_count, COUNT(DISTINCT COALESCE(NULLIF(activation_email, ''), NULLIF(contact, ''))) AS customer_count FROM orders").first(),
    env.DB.prepare("SELECT status, COUNT(*) AS count FROM orders GROUP BY status").all(),
    env.DB.prepare("SELECT COALESCE(SUM(amount_vnd), 0) AS revenue FROM orders WHERE status IN ('paid', 'in_progress', 'fulfilled')").first()
  ]);
  return json({ orderCount: totals.order_count, customerCount: totals.customer_count, revenue: revenue.revenue, statuses: statuses.results });
}