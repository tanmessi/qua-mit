import { createSession, passwordMatches } from "../_shared/auth.js";
import { error, json, sameOrigin } from "../_shared/http.js";

async function hashAddress(address) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error("Yêu cầu không hợp lệ.", 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return error("Dữ liệu đăng nhập không hợp lệ.");
  }

  if (body.action === "logout") {
    return json({ ok: true }, 200, { "Set-Cookie": "qm_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0" });
  }

  if (!env.DB || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return error("Backend chưa được cấu hình đầy đủ.", 503);
    if (!env.DB || !env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 16 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
      return error("Backend chưa được cấu hình đầy đủ. Mật khẩu admin cần ít nhất 16 ký tự và khóa phiên ít nhất 32 ký tự.", 503);
    }
  const now = Math.floor(Date.now() / 1000);
  const ipHash = await hashAddress(request.headers.get("CF-Connecting-IP") || "unknown");
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE attempted_at < ?").bind(now - 86400).run();
  const recentAttempts = await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_login_attempts WHERE ip_hash = ? AND attempted_at > ?").bind(ipHash, now - 900).first();
  if (recentAttempts.count >= 10) return error("Quá nhiều lần thử. Vui lòng đợi 15 phút rồi thử lại.", 429);

  if (typeof body.password !== "string" || body.password.length > 512 || !(await passwordMatches(body.password, env.ADMIN_PASSWORD))) {
    await env.DB.prepare("INSERT INTO admin_login_attempts (ip_hash, attempted_at) VALUES (?, ?)").bind(ipHash, now).run();
    return error("Mật khẩu không chính xác.", 401);
  }

  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip_hash = ?").bind(ipHash).run();
  const session = await createSession(env.SESSION_SECRET);
  return json({ ok: true }, 200, {
    "Set-Cookie": `qm_admin=${session}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`
  });
}