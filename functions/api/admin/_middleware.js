import { verifySession } from "../../_shared/auth.js";
import { error, sameOrigin } from "../../_shared/http.js";

export async function onRequest({ request, env, next }) {
  if (!env.SESSION_SECRET) return error("Backend chưa được cấu hình.", 503);
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("qm_admin="))?.slice("qm_admin=".length);
  if (!(await verifySession(token, env.SESSION_SECRET))) return error("Cần đăng nhập quản trị.", 401);
  if (!env.DB) return error("Chưa kết nối cơ sở dữ liệu.", 503);
  if (!['GET', 'HEAD'].includes(request.method) && !sameOrigin(request)) return error("Yêu cầu không hợp lệ.", 403);
  return next();
}