import { error, json, newId, readJson, sameOrigin, text } from "../_shared/http.js";

const gmailPattern = /^[a-z0-9._%+-]+@gmail\.com$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function paymentQr(env, amount, transferNote) {
  const bankId = env.BANK_ID || "Pvcombank";
  const account = env.BANK_ACCOUNT || "107003933616";
  const accountName = env.BANK_ACCOUNT_NAME || "PHAM LE TAN";
  if (!/^[A-Za-z0-9]+$/.test(bankId) || !/^\d{8,20}$/.test(account)) return null;
  return `https://img.vietqr.io/image/${bankId}-${account}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(accountName)}`;
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error("Yêu cầu không hợp lệ.", 403);
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu. Vui lòng liên hệ Quả Mít.", 503);

  let body;
  try {
    body = await readJson(request, 12000);
  } catch (exception) {
    return error(exception.message || "Dữ liệu gửi lên không hợp lệ.");
  }

  const now = new Date().toISOString();
  if (body.type === "ai") {
    if (body.consent !== true) return error("Vui lòng đồng ý lưu thông tin để xử lý đơn.");
    const productId = text(body.productId, 80);
    const activationEmail = text(body.activationEmail, 254).toLowerCase();
    const product = await env.DB.prepare(
      "SELECT id, name, duration, price_vnd, requires_gmail, fulfillment_note FROM products WHERE id = ? AND category = 'ai' AND active = 1"
    ).bind(productId).first();
    if (!product || !Number.isInteger(product.price_vnd) || product.price_vnd <= 0) return error("Gói này chưa sẵn sàng để thanh toán.", 409);
    if (product.requires_gmail ? !gmailPattern.test(activationEmail) : !emailPattern.test(activationEmail)) {
      return error(product.requires_gmail ? "Gói này cần địa chỉ Gmail hợp lệ." : "Vui lòng nhập địa chỉ email hợp lệ.");
    }

    const orderId = newId("QM");
    const transferNote = `QMIT ${orderId}`;
    const qrUrl = paymentQr(env, product.price_vnd, transferNote);
    if (!qrUrl) return error("Thông tin tài khoản nhận tiền chưa được cấu hình đúng.", 503);

    await env.DB.prepare(
      "INSERT INTO orders (id, order_type, customer_name, contact, activation_email, product_id, product_name, duration, amount_vnd, transfer_note, consented_at, status, created_at, updated_at) VALUES (?, 'ai', '', ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', ?, ?)"
    ).bind(orderId, activationEmail, activationEmail, product.id, product.name, product.duration || "", product.price_vnd, transferNote, now, now, now).run();

    return json({ orderId, productName: product.name, duration: product.duration, amount: product.price_vnd, transferNote, qrUrl, fulfillmentNote: product.fulfillment_note }, 201);
  }

  if (body.type === "service") {
    if (body.consent !== true) return error("Vui lòng đồng ý lưu thông tin để xử lý yêu cầu.");
    const customerName = text(body.name, 120);
    const contact = text(body.contact, 254);
    const brief = text(body.brief, 3000);
    if (!customerName || !contact || !brief) return error("Vui lòng điền đủ tên, thông tin liên hệ và nhu cầu.");

    const orderId = newId("QM");
    const productId = text(body.productId, 80);
    const product = productId
      ? await env.DB.prepare("SELECT id, name FROM products WHERE id = ? AND active = 1").bind(productId).first()
      : null;
    await env.DB.prepare(
      "INSERT INTO orders (id, order_type, customer_name, contact, product_id, product_name, brief, amount_vnd, consented_at, status, created_at, updated_at) VALUES (?, 'service', ?, ?, ?, ?, ?, 0, ?, 'new', ?, ?)"
    ).bind(orderId, customerName, contact, product?.id || null, product?.name || "Yêu cầu dịch vụ", brief, now, now, now).run();
    return json({ orderId, message: "Yêu cầu đã được lưu." }, 201);
  }

  return error("Loại đơn hàng không hợp lệ.");
}