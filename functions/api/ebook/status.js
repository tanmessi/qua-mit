import { findDigitalOrder, MAX_DOWNLOADS, PAID_STATUSES } from "../../_shared/ebook.js";
import { error, json } from "../../_shared/http.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu.", 503);
  const url = new URL(request.url);
  const order = await findDigitalOrder(env, url.searchParams.get("order"), url.searchParams.get("token"));
  if (!order) return error("Không tìm thấy đơn hàng hoặc link không hợp lệ.", 404);

  return json({
    orderId: order.id,
    productName: order.product_name,
    amount: order.amount_vnd,
    transferNote: order.transfer_note,
    status: order.status,
    paid: PAID_STATUSES.includes(order.status),
    fileName: order.file_name || "",
    fileSize: order.file_size || 0,
    downloadsLeft: Math.max(0, MAX_DOWNLOADS - order.download_count)
  }, 200, { "Referrer-Policy": "no-referrer" });
}
