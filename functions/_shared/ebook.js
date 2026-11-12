export const MAX_DOWNLOADS = 10;
export const PAID_STATUSES = ["paid", "in_progress", "fulfilled"];
export const FILE_CHUNK_BYTES = 512 * 1024;

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function newDownloadToken() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function accessPath(orderId, token) {
  return `/ebook.html#order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
}

export async function findDigitalOrder(env, orderId, token) {
  if (typeof orderId !== "string" || typeof token !== "string" || !/^[A-Z0-9]{4,32}$/.test(orderId) || token.length < 20 || token.length > 100) return null;
  return env.DB.prepare(
    "SELECT o.id, o.product_id, o.product_name, o.amount_vnd, o.transfer_note, o.status, o.download_count, p.file_name, p.file_size FROM orders o LEFT JOIN products p ON p.id = o.product_id WHERE o.id = ? AND o.order_type = 'digital' AND o.download_token_hash = ?"
  ).bind(orderId, await hashToken(token)).first();
}
