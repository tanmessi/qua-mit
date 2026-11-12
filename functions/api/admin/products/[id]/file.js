import { FILE_CHUNK_BYTES } from "../../../../_shared/ebook.js";
import { error, json, text } from "../../../../_shared/http.js";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export async function onRequestPut({ request, env, params }) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_FILE_BYTES) return error("File quá lớn (tối đa 50MB).", 413);
  const product = await env.DB.prepare("SELECT id FROM products WHERE id = ? AND category = 'digital'").bind(params.id).first();
  if (!product) return error("Chỉ tải file lên được cho sản phẩm số.", 404);

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) return error("File trống hoặc quá lớn (tối đa 50MB).", 413);
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") return error("Chỉ hỗ trợ file PDF.", 415);

  let fileName = text(decodeURIComponent(request.headers.get("X-File-Name") || ""), 200).replace(/[\\/:*?"<>|\r\n]/g, "_");
  if (!fileName.toLowerCase().endsWith(".pdf")) fileName = `${fileName || params.id}.pdf`;

  const statements = [env.DB.prepare("DELETE FROM product_file_chunks WHERE product_id = ?").bind(params.id)];
  for (let offset = 0, index = 0; offset < bytes.length; offset += FILE_CHUNK_BYTES, index += 1) {
    statements.push(env.DB.prepare("INSERT INTO product_file_chunks (product_id, chunk_index, data) VALUES (?, ?, ?)").bind(params.id, index, bytes.slice(offset, offset + FILE_CHUNK_BYTES).buffer));
  }
  statements.push(env.DB.prepare("UPDATE products SET file_name = ?, file_size = ?, updated_at = ? WHERE id = ?").bind(fileName, bytes.length, new Date().toISOString(), params.id));
  await env.DB.batch(statements);
  return json({ fileName, fileSize: bytes.length });
}
