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
vietqrImage.src = `https://img.vietqr.io/image/${CONFIG.bank.id}-${CONFIG.bank.account}-compact2.png?accountName=${encodeURIComponent(CONFIG.bank.name)}&addInfo=${encodeURIComponent("QUA MIT ung ho")}`;
document.querySelector("#bank-caption").textContent = `${CONFIG.bank.id} · ${CONFIG.bank.account} · ${CONFIG.bank.name}`;
document.querySelector("#momo-number").textContent = CONFIG.momo;
document.querySelector("#contact-email").href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Liên hệ từ trang Quả Mít")}`;

const themeButton = document.querySelector("#theme-toggle");
const storedTheme = localStorage.getItem("ai-journal-theme");

if (storedTheme === "light") document.body.classList.add("light");

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("ai-journal-theme", document.body.classList.contains("light") ? "light" : "dark");
});

const fortunes = [
  "Một việc hoàn thành đáng giá hơn ba việc còn dang dở.",
  "Đừng đo tốc độ của mình bằng hành trình của người khác.",
  "Một câu hỏi đúng có thể tiết kiệm cả buổi chiều.",
  "Làm bản thử nhỏ trước khi đặt cược lớn.",
  "Hôm nay tiến một bước cũng là tiến về phía trước."
];
const fortuneButton = document.querySelector("#fortune-button");
const fortuneResult = document.querySelector("#fortune-result p");
const fortuneKey = `ai-journal-fortune-${new Date().toISOString().slice(0, 10)}`;
const savedFortune = localStorage.getItem(fortuneKey);

if (savedFortune) fortuneResult.textContent = savedFortune;

fortuneButton.addEventListener("click", () => {
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  fortuneResult.textContent = fortune;
  localStorage.setItem(fortuneKey, fortune);
  fortuneButton.disabled = true;
  fortuneButton.innerHTML = "Đã rút quẻ <span aria-hidden=\"true\">✓</span>";
});

if (savedFortune) {
  fortuneButton.disabled = true;
  fortuneButton.innerHTML = "Đã rút quẻ <span aria-hidden=\"true\">✓</span>";
}

document.querySelector("#order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const body = `Tên: ${data.get("name")}\nLiên hệ: ${data.get("contact")}\nYêu cầu: ${data.get("brief")}`;
  location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Đặt làm riêng — Quả Mít")}&body=${encodeURIComponent(body)}`;
  document.querySelector("#form-message").textContent = `Cảm ơn ${data.get("name")}! Trình email vừa mở — bấm gửi để hoàn tất.`;
});

const chatPanel = document.querySelector("#chat-panel");
document.querySelector("#chat-launch").addEventListener("click", () => {
  chatPanel.hidden = !chatPanel.hidden;
  if (!chatPanel.hidden) document.querySelector("#chat-input").focus();
});
document.querySelector("#chat-close").addEventListener("click", () => {
  chatPanel.hidden = true;
});
document.querySelector("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#chat-input");
  const message = document.createElement("p");
  message.className = "chat-bubble outgoing";
  message.textContent = input.value.trim();
  document.querySelector("#chat-messages").append(message);
  input.value = "";
  const reply = document.createElement("p");
  reply.className = "chat-bubble";
  reply.textContent = "Mình đã nhận tin nhắn trong bản demo này.";
  document.querySelector("#chat-messages").append(reply);
});