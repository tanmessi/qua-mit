// ===== ĐIỀN THÔNG TIN THẬT CỦA BẠN TẠI ĐÂY =====
const CONFIG = {
  email: "tanpl.cto@gmail.com",
  bank: {
    id: "Pvcombank",            // mã ngân hàng: MB, VCB, TCB, ACB, BIDV, VPB...
    account: "107003933616", // số tài khoản
    name: "PHAM LE TAN"   // tên chủ tài khoản, KHÔNG DẤU
  },
  momo: "0793931601"       // số điện thoại Momo
};
// ================================================

const vietqrImage = document.querySelector("#vietqr-image");
vietqrImage.src = `https://img.vietqr.io/image/${CONFIG.bank.id}-${CONFIG.bank.account}-qr_only.png?accountName=${encodeURIComponent(CONFIG.bank.name)}&addInfo=${encodeURIComponent("QUA MIT ung ho")}`;
document.querySelector("#bank-account").textContent = CONFIG.bank.account;
document.querySelector("#bank-caption").textContent = `${CONFIG.bank.id} · ${CONFIG.bank.name}`;
document.querySelector("#momo-number").textContent = CONFIG.momo;
document.querySelector("#contact-email").href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Liên hệ từ trang Quả Mít")}`;

document.querySelector("#order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const body = `Tên: ${data.get("name")}\nLiên hệ: ${data.get("contact")}\nYêu cầu: ${data.get("brief")}`;
  location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Đặt làm riêng — Quả Mít")}&body=${encodeURIComponent(body)}`;
  document.querySelector("#form-message").textContent = `Cảm ơn ${data.get("name")}! Trình email vừa mở — bấm gửi để hoàn tất.`;
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy === "bank" ? CONFIG.bank.account : CONFIG.momo;

    try {
      await navigator.clipboard.writeText(value);
      button.innerHTML = 'Đã sao chép <span aria-hidden="true">✓</span>';
      window.setTimeout(() => {
        button.innerHTML = button.dataset.copy === "bank"
          ? 'Sao chép số tài khoản <span aria-hidden="true">▣</span>'
          : 'Sao chép số MoMo <span aria-hidden="true">▣</span>';
      }, 1800);
    } catch {
      button.textContent = "Không thể sao chép trên trình duyệt này";
    }
  });
});