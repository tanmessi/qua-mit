import { findDigitalOrder, MAX_DOWNLOADS, PAID_STATUSES } from "../../_shared/ebook.js";
import { error } from "../../_shared/http.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu.", 503);
  const url = new URL(request.url);
  const order = await findDigitalOrder(env, url.searchParams.get("order"), url.searchParams.get("token"));
  if (!order) return error("Không tìm thấy đơn hàng hoặc link không hợp lệ.", 404);
  if (!PAID_STATUSES.includes(order.status)) return error("Đơn hàng chưa được xác nhận thanh toán.", 402);
  if (!order.file_size) return error("File ebook chưa sẵn sàng. Vui lòng liên hệ Quả Mít.", 409);

  const now = new Date().toISOString();
  const placeholders = PAID_STATUSES.map(() => "?").join(", ");
  const claimed = await env.DB.prepare(
    `UPDATE orders SET download_count = download_count + 1, last_download_at = ?, status = CASE WHEN status = 'paid' THEN 'fulfilled' ELSE status END, updated_at = ? WHERE id = ? AND download_count < ? AND status IN (${placeholders})`
  ).bind(now, now, order.id, MAX_DOWNLOADS, ...PAID_STATUSES).run();
  if (!claimed.meta.changes) return error(`Link đã hết lượt tải (${MAX_DOWNLOADS} lần). Vui lòng liên hệ Quả Mít.`, 429);

  const { results } = await env.DB.prepare("SELECT chunk_index FROM product_file_chunks WHERE product_id = ? ORDER BY chunk_index").bind(order.product_id).all();
  const statement = env.DB.prepare("SELECT data FROM product_file_chunks WHERE product_id = ? AND chunk_index = ?");
  let next = 0;
  const stream = new ReadableStream({
    async pull(controller) {
      if (next >= results.length) return controller.close();
      const row = await statement.bind(order.product_id, results[next].chunk_index).first();
      next += 1;
      controller.enqueue(new Uint8Array(row.data));
    }
  });

  const fileName = order.file_name || "ebook.pdf";
  const asciiName = fileName.normalize("NFD").replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "") || "ebook.pdf";
  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
