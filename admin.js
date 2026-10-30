const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Không thể hoàn tất yêu cầu.");
  return data;
}

function showLogin(message = "") {
  loginView.hidden = false;
  dashboardView.hidden = true;
  loginMessage.textContent = message;
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
}

function element(tag, value = "", className = "") {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function date(value) {
  if (!value) return "—";
  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString("vi-VN");
}

async function loadSummary() {
  const summary = await api("/api/admin/summary");
  document.querySelector("#stat-orders").textContent = summary.orderCount.toLocaleString("vi-VN");
  document.querySelector("#stat-customers").textContent = summary.customerCount.toLocaleString("vi-VN");
  document.querySelector("#stat-revenue").textContent = money(summary.revenue);
  const pending = summary.statuses.filter((item) => ["new", "quote_sent", "awaiting_payment"].includes(item.status)).reduce((total, item) => total + item.count, 0);
  document.querySelector("#stat-pending").textContent = pending.toLocaleString("vi-VN");
}

function makeSelect(current, options) {
  const select = document.createElement("select");
  for (const [value, label] of options) {
    const option = element("option", label);
    option.value = value;
    option.selected = value === current;
    select.append(option);
  }
  return select;
}

async function loadOrders() {
  const { orders } = await api("/api/admin/orders");
  const body = document.querySelector("#orders-body");
  body.replaceChildren();
  document.querySelector("#orders-empty").hidden = orders.length > 0;
  const options = [["new", "Mới"], ["quote_sent", "Đã báo giá"], ["awaiting_payment", "Chờ thanh toán"], ["paid", "Đã thanh toán"], ["in_progress", "Đang xử lý"], ["fulfilled", "Hoàn tất"], ["cancelled", "Đã hủy"]];

  for (const order of orders) {
    const row = document.createElement("tr");
    const customer = order.customer_name || order.activation_email || order.contact;
    const request = [order.product_name, order.duration, order.brief].filter(Boolean).join(" · ");
    row.append(element("td", order.id));
    const customerCell = document.createElement("td");
    customerCell.append(element("strong", customer || "—"), element("small", order.activation_email || order.contact || ""));
    row.append(customerCell, element("td", request || "—"), element("td", order.amount_vnd ? money(order.amount_vnd) : "Báo giá"));

    const statusCell = document.createElement("td");
    const status = makeSelect(order.status, options);
    statusCell.append(status);
    row.append(statusCell);

    const noteCell = document.createElement("td");
    const note = document.createElement("input");
    note.value = order.admin_note || "";
    note.placeholder = "Ghi chú";
    noteCell.append(note);
    row.append(noteCell);

    const actionCell = document.createElement("td");
    const save = element("button", "Lưu", "row-save");
    save.type = "button";
    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        await api(`/api/admin/orders/${encodeURIComponent(order.id)}`, { method: "PATCH", body: JSON.stringify({ status: status.value, adminNote: note.value }) });
        dashboardMessage.textContent = `Đã cập nhật đơn ${order.id}.`;
        await Promise.all([loadOrders(), loadSummary(), loadCustomers()]);
      } catch (error) {
        dashboardMessage.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    });
    actionCell.append(save);
    row.append(actionCell);
    body.append(row);
  }
}

async function loadProducts() {
  const { products } = await api("/api/admin/products");
  const body = document.querySelector("#products-body");
  body.replaceChildren();
  const categories = [["ai", "AI"], ["digital", "Sản phẩm số"], ["service", "Dịch vụ"]];

  for (const product of products) {
    const row = document.createElement("tr");
    row.append(element("td", product.id));
    const nameCell = document.createElement("td");
    const name = document.createElement("input");
    name.value = product.name;
    nameCell.append(name);
    row.append(nameCell);
    const categoryCell = document.createElement("td");
    const category = makeSelect(product.category, categories);
    categoryCell.append(category);
    row.append(categoryCell);
    const priceCell = document.createElement("td");
    const price = document.createElement("input");
    price.type = "number";
    price.min = "0";
    price.step = "1000";
    price.value = product.price_vnd ?? "";
    price.placeholder = "Báo giá";
    priceCell.append(price);
    row.append(priceCell);
    const durationCell = document.createElement("td");
    const duration = document.createElement("input");
    duration.value = product.duration || "";
    durationCell.append(duration);
    row.append(durationCell);
    const gmailCell = document.createElement("td");
    const requiresGmail = document.createElement("input");
    requiresGmail.type = "checkbox";
    requiresGmail.checked = Boolean(product.requires_gmail);
    gmailCell.append(requiresGmail);
    row.append(gmailCell);
    const descriptionCell = document.createElement("td");
    const description = document.createElement("input");
    description.value = product.description || "";
    descriptionCell.append(description);
    row.append(descriptionCell);
    const activeCell = document.createElement("td");
    const active = document.createElement("input");
    active.type = "checkbox";
    active.checked = Boolean(product.active);
    activeCell.append(active);
    row.append(activeCell);
    const actionCell = document.createElement("td");
    const save = element("button", "Lưu", "row-save");
    save.type = "button";
    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        await api(`/api/admin/products/${encodeURIComponent(product.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ name: name.value, category: category.value, price: price.value, duration: duration.value, description: description.value, requiresGmail: requiresGmail.checked, fulfillmentNote: product.fulfillment_note, active: active.checked, sortOrder: product.sort_order })
        });
        dashboardMessage.textContent = `Đã lưu ${name.value}.`;
      } catch (error) {
        dashboardMessage.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    });
    actionCell.append(save);
    row.append(actionCell);
    body.append(row);
  }
}

async function loadCustomers() {
  const { customers } = await api("/api/admin/customers");
  const body = document.querySelector("#customers-body");
  body.replaceChildren();
  document.querySelector("#customers-empty").hidden = customers.length > 0;
  for (const customer of customers) {
    const row = document.createElement("tr");
    for (const value of [customer.customer_name || "—", customer.activation_email || "—", customer.contact || "—", customer.order_count, money(customer.paid_total), date(customer.last_order_at)]) {
      row.append(element("td", String(value)));
    }
    body.append(row);
  }
}

async function loadDashboard() {
  dashboardMessage.textContent = "";
  try {
    await Promise.all([loadSummary(), loadOrders(), loadProducts(), loadCustomers()]);
  } catch (error) {
    if (error.message.includes("đăng nhập")) return showLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    dashboardMessage.textContent = error.message;
  }
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const password = document.querySelector("#admin-password");
  try {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "login", password: password.value }) });
    password.value = "";
    showDashboard();
    await loadDashboard();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) }).catch(() => {});
  showLogin("Bạn đã đăng xuất.");
});

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
    document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== button.dataset.tab; });
  });
});

document.querySelectorAll("[data-refresh]").forEach((button) => {
  button.addEventListener("click", loadDashboard);
});

document.querySelector("#product-create-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = Object.fromEntries(data);
  payload.requiresGmail = form.elements.requiresGmail.checked;
  try {
    await api("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    dashboardMessage.textContent = "Đã thêm sản phẩm.";
    await Promise.all([loadProducts(), loadDashboard()]);
  } catch (error) {
    dashboardMessage.textContent = error.message;
  }
});

api("/api/admin/summary").then(() => {
  showDashboard();
  return loadDashboard();
}).catch(() => showLogin());