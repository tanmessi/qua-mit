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
const aiProductGrid = document.querySelector("#ai-product-grid");
const ebookSection = document.querySelector("#ebooks");
const ebookProductGrid = document.querySelector("#ebook-product-grid");

const CHECKOUT_TEXT = {
  ai: {
    title: "Xác nhận gói AI",
    durationLabel: "Thời hạn",
    disclosure: "Lời mời được gửi tới Gmail này sau khi bạn thanh toán và Quả Mít xác nhận giao dịch. Tài khoản cần đủ điều kiện sử dụng Google One.",
    consent: "Tôi đồng ý để Quả Mít lưu Gmail này nhằm xử lý đơn, kích hoạt và hỗ trợ sau mua.",
    emailNote: "Bấm gửi email để Quả Mít nhận Gmail kích hoạt; sau đó chuyển khoản và chờ xác nhận thủ công."
  },
  ebook: {
    title: "Xác nhận mua ebook",
    durationLabel: "Định dạng",
    emailLabel: "Email nhận thông tin đơn",
    disclosure: "Sau khi tạo đơn, bạn nhận một link tải riêng. Nút tải PDF sẽ mở ngay khi Quả Mít xác nhận đã nhận tiền.",
    consent: "Tôi đồng ý để Quả Mít lưu email này nhằm xử lý đơn và hỗ trợ sau mua.",
    emailNote: "Không bắt buộc: gửi email để Quả Mít xác nhận nhanh hơn. Hãy lưu link tải ở trên trước khi đóng cửa sổ."
  }
};

aiCustomerEmail.addEventListener("input", () => aiCustomerEmail.setCustomValidity(""));

function renderAiProduct(product) {
  const card = document.createElement("article");
  card.className = "ai-product-card";
  card.dataset.productId = product.id;

  const details = document.createElement("div");
  const label = document.createElement("p");
  label.className = "ai-product-label";
  label.textContent = product.fulfillment_note ? "GMAIL CÁ NHÂN · GÓI AI" : "GÓI CÔNG CỤ AI";
  const name = document.createElement("h4");
  name.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  details.append(label, name, description);

  const purchase = document.createElement("div");
  purchase.className = "ai-product-buy";
  const price = document.createElement("strong");
  price.textContent = Number.isInteger(product.price_vnd) && product.price_vnd > 0
    ? `${product.price_vnd.toLocaleString("vi-VN")}đ`
    : "Báo giá";
  const duration = document.createElement("span");
  duration.textContent = product.price_vnd ? `trọn gói · ${product.duration || "theo gói"}` : (product.duration || "theo gói");
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button ${product.price_vnd ? "button-coral" : "button-outline"}`;
  button.dataset.productId = product.id;
  button.dataset.product = product.name;
  button.dataset.duration = product.duration || "";
  button.dataset.requiresGmail = String(Boolean(product.requires_gmail));
  if (Number.isInteger(product.price_vnd) && product.price_vnd > 0) {
    button.dataset.buyAi = "";
    button.dataset.price = String(product.price_vnd);
    button.innerHTML = 'Mua ngay <span aria-hidden="true">↗</span>';
  } else {
    button.dataset.quoteProduct = product.name;
    button.innerHTML = 'Hỏi giá <span aria-hidden="true">↗</span>';
  }
  purchase.append(price, duration, button);
  card.append(details, purchase);
  return card;
}

function renderEbookProduct(product) {
  const card = document.createElement("article");
  card.className = "ai-product-card";
  card.dataset.productId = product.id;

  const details = document.createElement("div");
  const label = document.createElement("p");
  label.className = "ai-product-label";
  label.textContent = "EBOOK · PDF";
  const name = document.createElement("h4");
  name.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  details.append(label, name, description);

  const purchase = document.createElement("div");
  purchase.className = "ai-product-buy";
  const price = document.createElement("strong");
  price.textContent = `${product.price_vnd.toLocaleString("vi-VN")}đ`;
  const format = document.createElement("span");
  format.textContent = product.duration || "Ebook PDF";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-coral";
  button.dataset.buyEbook = "";
  button.dataset.productId = product.id;
  button.dataset.product = product.name;
  button.dataset.duration = product.duration || "Ebook PDF";
  button.dataset.price = String(product.price_vnd);
  button.innerHTML = 'Mua ebook <span aria-hidden="true">↗</span>';
  purchase.append(price, format, button);
  card.append(details, purchase);
  return card;
}

async function loadAiCatalog() {
  try {
    const response = await fetch("/api/catalog", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.products)) return;
    const ebooks = data.products.filter((product) => product.category === "digital" && product.has_file && Number.isInteger(product.price_vnd) && product.price_vnd > 0);
    ebookProductGrid.replaceChildren(...ebooks.map(renderEbookProduct));
    ebookSection.hidden = ebooks.length === 0;
    const aiProducts = data.products.filter((product) => product.category === "ai");
    aiProductGrid.replaceChildren(...aiProducts.map(renderAiProduct));
    if (!aiProducts.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "catalog-empty";
      emptyState.textContent = "Hiện chưa có gói AI mở bán.";
      aiProductGrid.append(emptyState);
    }
  } catch {
    // Keep the static catalog when the API is not available in local preview.
  }
}

aiProductGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-quote-product")) {
    const brief = document.querySelector("#order-brief");
    brief.value = `Mình quan tâm ${button.dataset.quoteProduct}, vui lòng gửi thông tin gói và báo giá.`;
    document.querySelector("#order-product-id").value = button.dataset.productId || "";
    document.querySelector("#order-form").scrollIntoView({ behavior: "smooth", block: "center" });
    brief.focus({ preventScroll: true });
    return;
  }
  if (!button.hasAttribute("data-buy-ai")) return;
  openCheckout("ai", button);
});

ebookProductGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-buy-ebook]");
  if (button) openCheckout("ebook", button);
});

function openCheckout(kind, button) {
  const copy = CHECKOUT_TEXT[kind];
  aiOrderForm.reset();
  aiCustomerEmail.setCustomValidity("");
  aiOrderForm.dataset.kind = kind;
  aiOrderForm.dataset.productId = button.dataset.productId;
  const requiresGmail = kind === "ai" && button.dataset.requiresGmail === "true";
  aiOrderForm.dataset.requiresGmail = String(requiresGmail);
  aiOrderForm.hidden = false;
  document.querySelector("#checkout-payment").hidden = true;
  document.querySelector("#checkout-ebook-access").hidden = true;
  document.querySelector("#checkout-error").hidden = true;
  document.querySelector("#checkout-error").textContent = "";
  document.querySelector("#checkout-title").textContent = copy.title;
  document.querySelector("#checkout-duration-label").textContent = copy.durationLabel;
  document.querySelector("#checkout-disclosure").textContent = copy.disclosure;
  document.querySelector("#checkout-consent-text").textContent = copy.consent;
  document.querySelector("#checkout-email-note").textContent = copy.emailNote;
  document.querySelector("#checkout-product").textContent = button.dataset.product;
  document.querySelector("#checkout-duration").textContent = button.dataset.duration;
  document.querySelector("#ai-email-label").textContent = copy.emailLabel || (requiresGmail ? "Gmail nhận lời mời kích hoạt" : "Email nhận hướng dẫn kích hoạt");
  aiCustomerEmail.placeholder = requiresGmail ? "tenban@gmail.com" : "tenban@example.com";
  checkoutPrice.textContent = `${Number(button.dataset.price).toLocaleString("vi-VN")}đ`;
  aiCheckout.showModal();
}

document.querySelector("#checkout-ebook-copy").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(document.querySelector("#checkout-ebook-link").href);
    button.innerHTML = 'Đã sao chép <span aria-hidden="true">✓</span>';
  } catch {
    button.textContent = "Hãy sao chép link từ nút Mở trang tải ebook";
  }
});

document.querySelector("#checkout-close").addEventListener("click", () => aiCheckout.close());
aiCheckout.addEventListener("click", (event) => {
  if (event.target === aiCheckout) aiCheckout.close();
});

aiOrderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = aiCustomerEmail.value.trim().toLowerCase();
  const requiresGmail = aiOrderForm.dataset.requiresGmail === "true";
  const validEmail = requiresGmail ? /^[a-z0-9._%+-]+@gmail\.com$/i.test(email) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!validEmail) {
    aiCustomerEmail.setCustomValidity(requiresGmail ? "Vui lòng nhập địa chỉ Gmail kết thúc bằng @gmail.com." : "Vui lòng nhập địa chỉ email hợp lệ.");
    aiCustomerEmail.reportValidity();
    return;
  }

  const submitButton = aiOrderForm.querySelector("[type=submit]");
  const checkoutError = document.querySelector("#checkout-error");
  submitButton.disabled = true;
  checkoutError.hidden = true;
  try {
    const isEbook = aiOrderForm.dataset.kind === "ebook";
    const consent = new FormData(aiOrderForm).get("consent") === "on";
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(isEbook
        ? { type: "ebook", productId: aiOrderForm.dataset.productId, email, consent }
        : { type: "ai", productId: aiOrderForm.dataset.productId, activationEmail: email, consent })
    });
    const order = await response.json();
    if (!response.ok) throw new Error(order.error || "Chưa tạo được đơn hàng. Vui lòng liên hệ Quả Mít.");

    document.querySelector("#checkout-product").textContent = order.productName;
    document.querySelector("#checkout-duration").textContent = order.duration;
    checkoutPrice.textContent = `${order.amount.toLocaleString("vi-VN")}đ`;
    checkoutPaymentAmount.textContent = `${order.amount.toLocaleString("vi-VN")}đ`;
    document.querySelector("#checkout-reference").textContent = `Mã đơn: ${order.orderId}`;
    document.querySelector("#checkout-qr").src = order.qrUrl;
    const accessUrl = order.accessUrl ? new URL(order.accessUrl, location.origin).href : "";
    if (accessUrl) {
      document.querySelector("#checkout-ebook-link").href = accessUrl;
      document.querySelector("#checkout-ebook-copy").innerHTML = 'Sao chép link tải <span aria-hidden="true">▣</span>';
    }
    document.querySelector("#checkout-ebook-access").hidden = !accessUrl;
    const emailBody = isEbook
      ? `Mã đơn: ${order.orderId}\nEbook: ${order.productName}\nSố tiền: ${order.amount.toLocaleString("vi-VN")}đ\nEmail: ${email}\nNội dung chuyển khoản: ${order.transferNote}`
      : `Mã đơn: ${order.orderId}\nGói: ${order.productName}\nThời hạn: ${order.duration}\nSố tiền: ${order.amount.toLocaleString("vi-VN")}đ\nGmail nhận kích hoạt: ${email}\nNội dung chuyển khoản: ${order.transferNote}`;
    document.querySelector("#checkout-email-link").href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`Đơn ${order.orderId} - ${order.productName}`)}&body=${encodeURIComponent(emailBody)}`;
    aiOrderForm.hidden = true;
    document.querySelector("#checkout-payment").hidden = false;
  } catch (error) {
    checkoutError.textContent = error instanceof TypeError
      ? "Chưa kết nối được backend. Hãy thử lại sau hoặc liên hệ Quả Mít."
      : error.message;
    checkoutError.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
});

loadAiCatalog();

document.querySelector("#order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const body = `Tên: ${data.get("name")}\nLiên hệ: ${data.get("contact")}\nYêu cầu: ${data.get("brief")}`;
  const message = document.querySelector("#form-message");
  const submitButton = form.querySelector("[type=submit]");
  submitButton.disabled = true;
  fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ type: "service", name: data.get("name"), contact: data.get("contact"), brief: data.get("brief"), productId: data.get("productId"), consent: data.get("consent") === "on" })
  }).then(async (response) => {
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không lưu được yêu cầu.");
    message.textContent = `Đã lưu yêu cầu ${result.orderId}. Quả Mít sẽ liên hệ với bạn.`;
    form.reset();
  }).catch(() => {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Đặt làm riêng — Quả Mít")}&body=${encodeURIComponent(body)}`;
    message.textContent = `Cảm ơn ${data.get("name")}! Trình email vừa mở — bấm gửi để hoàn tất.`;
  }).finally(() => {
    submitButton.disabled = false;
  });
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