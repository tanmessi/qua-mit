const params = new URLSearchParams(location.hash.slice(1));
const orderId = params.get("order") || "";
const token = params.get("token") || "";
const title = document.querySelector("#ebook-title");
const message = document.querySelector("#ebook-message");
const download = document.querySelector("#ebook-download");
const STATUS_LABELS = {
  awaiting_payment: "Chờ xác nhận thanh toán",
  paid: "Đã thanh toán",
  in_progress: "Đã thanh toán",
  fulfilled: "Đã thanh toán",
  cancelled: "Đã hủy",
  new: "Mới",
  quote_sent: "Chờ thanh toán"
};
let pollTimer;

function query() {
  return `order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
}

async function refresh() {
  try {
    const response = await fetch(`/api/ebook/status?${query()}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không kiểm tra được đơn hàng.");

    title.textContent = data.productName;
    document.querySelector("#ebook-summary").hidden = false;
    document.querySelector("#ebook-order").textContent = data.orderId;
    document.querySelector("#ebook-amount").textContent = `${Number(data.amount).toLocaleString("vi-VN")}đ`;
    document.querySelector("#ebook-transfer").textContent = data.transferNote;
    document.querySelector("#ebook-status").textContent = STATUS_LABELS[data.status] || data.status;

    if (data.paid && data.downloadsLeft > 0) {
      download.href = `/api/ebook/download?${query()}`;
      download.hidden = false;
      message.textContent = `Thanh toán đã được xác nhận. Bạn còn ${data.downloadsLeft} lượt tải.`;
      clearInterval(pollTimer);
    } else if (data.paid) {
      download.hidden = true;
      message.textContent = "Link này đã hết lượt tải. Vui lòng liên hệ Quả Mít để được cấp lại.";
      clearInterval(pollTimer);
    } else if (data.status === "cancelled") {
      download.hidden = true;
      message.textContent = "Đơn hàng đã bị hủy. Vui lòng liên hệ Quả Mít nếu bạn đã chuyển khoản.";
      clearInterval(pollTimer);
    } else {
      download.hidden = true;
      message.textContent = "Quả Mít đang chờ xác nhận chuyển khoản. Trang sẽ tự cập nhật — bạn có thể giữ trang này mở hoặc quay lại sau bằng chính link này.";
    }
  } catch (error) {
    title.textContent = "Không mở được trang tải";
    message.textContent = error instanceof TypeError ? "Chưa kết nối được máy chủ. Vui lòng thử lại sau." : error.message;
  }
}

if (!orderId || !token) {
  title.textContent = "Link tải không hợp lệ";
  message.textContent = "Vui lòng dùng đúng link nhận được sau khi đặt mua ebook.";
} else {
  refresh();
  pollTimer = setInterval(refresh, 20000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && download.hidden) refresh();
  });
  download.addEventListener("click", () => setTimeout(refresh, 3000));
}
