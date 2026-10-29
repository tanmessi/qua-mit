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

const aiCheckout = document.querySelector("#ai-checkout");
const aiOrderForm = document.querySelector("#ai-order-form");
const aiCustomerEmail = document.querySelector("#ai-customer-email");
const checkoutPrice = document.querySelector("#checkout-price");
const checkoutPaymentAmount = document.querySelector("#checkout-payment-amount");

aiCustomerEmail.addEventListener("input", () => aiCustomerEmail.setCustomValidity(""));

document.querySelectorAll("[data-buy-ai]").forEach((button) => {
  button.addEventListener("click", () => {
    aiOrderForm.reset();
    aiOrderForm.hidden = false;
    document.querySelector("#checkout-payment").hidden = true;
    document.querySelector("#checkout-product").textContent = button.dataset.product;
    document.querySelector("#checkout-duration").textContent = button.dataset.duration;
          checkoutPrice.textContent = `${Number(button.dataset.price).toLocaleString("vi-VN")}đ`;
    aiCheckout.showModal();
  });
});

document.querySelectorAll("[data-quote-product]").forEach((button) => {
  button.addEventListener("click", () => {
    const brief = document.querySelector("#order-brief");
    brief.value = `Mình quan tâm ${button.dataset.quoteProduct}, vui lòng gửi thông tin gói và báo giá.`;
    document.querySelector("#order-form").scrollIntoView({ behavior: "smooth", block: "center" });
    brief.focus({ preventScroll: true });
  });
});

document.querySelector("#checkout-close").addEventListener("click", () => aiCheckout.close());
aiCheckout.addEventListener("click", (event) => {
  if (event.target === aiCheckout) aiCheckout.close();
});

aiOrderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(aiOrderForm);
  const email = String(formData.get("email")).trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@gmail\.com$/i.test(email)) {
    aiCustomerEmail.setCustomValidity("Vui lòng nhập địa chỉ Gmail kết thúc bằng @gmail.com.");
    aiCustomerEmail.reportValidity();
    return;
  }
  const product = document.querySelector("#checkout-product").textContent;
  const duration = document.querySelector("#checkout-duration").textContent;
  const amount = Number(checkoutPrice.textContent.replace(/[^0-9]/g, ""));
    checkoutPaymentAmount.textContent = `${amount.toLocaleString("vi-VN")}đ`;
  const orderId = `QM${Date.now().toString().slice(-8)}`;
  const transferNote = `QMIT ${orderId}`;

  document.querySelector("#checkout-payment-amount").textContent = `${amount.toLocaleString("vi-VN")}đ`;
  document.querySelector("#checkout-reference").textContent = `Mã đơn: ${orderId}`;
  document.querySelector("#checkout-qr").src = `https://img.vietqr.io/image/${CONFIG.bank.id}-${CONFIG.bank.account}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(CONFIG.bank.name)}`;
  document.querySelector("#checkout-email-link").href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`Đơn ${orderId} - ${product}`)}&body=${encodeURIComponent(`Mã đơn: ${orderId}\nGói: ${product}\nThời hạn: ${duration}\nSố tiền: ${amount.toLocaleString("vi-VN")}đ\nGmail nhận kích hoạt: ${email}\nNội dung chuyển khoản: ${transferNote}`)}`;
  aiOrderForm.hidden = true;
  document.querySelector("#checkout-payment").hidden = false;
});

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