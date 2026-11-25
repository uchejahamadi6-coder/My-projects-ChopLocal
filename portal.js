(() => {
  const ORDER_KEY = "choplocal.demo.orders";
  const DRAFT_KEY = "choplocal.demo.checkout";
  const sampleOrders = [
    { id: "CL-1042", parentId: "CL-1042", restaurant: "Sweet Sensation", items: ["1 × Party jollof rice", "1 × Chicken and chips"], total: 10400, area: "Festac Town", status: "Preparing", rider: "Royal Rider Ada" },
    { id: "CL-1041", parentId: "CL-1041", restaurant: "Chicken Republic", items: ["2 × Rice and chicken"], total: 9800, area: "Amuwo Odofin", status: "Ready for pickup", rider: "Unassigned" },
    { id: "CL-1040-A", parentId: "CL-1040", restaurant: "Cold Stone Creamery", items: ["1 × Signature ice cream"], total: 6500, area: "Festac Town", status: "Picked up", rider: "Royal Rider Timi" },
    { id: "CL-1040-B", parentId: "CL-1040", restaurant: "Festac Pizza Kitchen", items: ["1 × Chicken pizza"], total: 7800, area: "Festac Town", status: "Preparing", rider: "Royal Rider Timi" },
    { id: "CL-1039", parentId: "CL-1039", restaurant: "Amala Ibadan", items: ["1 × Amala, Gbegiri and Ewedu"], total: 4200, area: "Festac Town", status: "Delivered", rider: "Royal Rider Femi" }
  ];

  const money = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

  function readStoredJson(key, fallback) {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`Could not read the demo data in this browser session (${key}). Clear this prototype's session data and try again.`);
    }
  }

  function setNotice(element, message, isError = false) {
    element.textContent = message;
    element.style.color = isError ? "#9a482b" : "";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function initCheckout() {
    const linesElement = document.querySelector("#checkoutLines");
    if (!linesElement) return;

    const notice = document.querySelector("#checkoutNotice");
    let draft;
    try {
      draft = readStoredJson(DRAFT_KEY, []);
    } catch (error) {
      setNotice(notice, error.message, true);
      document.querySelector("#placeDemoOrder").disabled = true;
      return;
    }
    if (!Array.isArray(draft) || draft.some((item) => !item.restaurant || !item.name || !Number.isFinite(item.price) || !Number.isFinite(item.quantity))) {
      setNotice(notice, "The saved demo basket is invalid. Return to the menu and create it again.", true);
      document.querySelector("#placeDemoOrder").disabled = true;
      return;
    }
    if (!draft.length) {
      linesElement.innerHTML = '<div class="empty-state">Your basket is empty. Add food from the <a href="index.html">Festac menu</a> first.</div>';
      document.querySelector("#placeDemoOrder").disabled = true;
      return;
    }

    const grouped = draft.reduce((groups, item) => {
      if (!groups.has(item.restaurant)) groups.set(item.restaurant, []);
      groups.get(item.restaurant).push(item);
      return groups;
    }, new Map());
    const subtotal = draft.reduce((sum, item) => sum + item.price * item.quantity, 0);
    linesElement.innerHTML = [...grouped.entries()].map(([restaurant, items]) => `
      <div class="restaurant-label">${escapeHtml(restaurant)}</div>
      ${items.map((item) => `<div class="checkout-line"><span>${item.quantity} × ${escapeHtml(item.name)}<small>${money(item.price)} each</small></span><strong>${money(item.price * item.quantity)}</strong></div>`).join("")}
    `).join("");
    document.querySelector("#foodSubtotal").textContent = money(subtotal);
    document.querySelector("#restaurantCount").textContent = String(grouped.size);

    document.querySelector("#checkoutForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const area = document.querySelector("#deliveryArea").value.trim();
      if (!area) {
        setNotice(notice, "Enter an area for this demo order.", true);
        return;
      }

      const existing = readStoredJson(ORDER_KEY, sampleOrders);
      if (!Array.isArray(existing)) {
        setNotice(notice, "Demo order history is invalid; no order was created.", true);
        return;
      }
      const parentId = `CL-DEMO-${Date.now().toString().slice(-6)}`;
      const newSuborders = [...grouped.entries()].map(([restaurant, items], index) => ({
        id: `${parentId}-${String.fromCharCode(65 + index)}`,
        parentId,
        restaurant,
        items: items.map((item) => `${item.quantity} × ${item.name}`),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        area,
        status: "New",
        rider: "Unassigned"
      }));
      try {
        sessionStorage.setItem(ORDER_KEY, JSON.stringify([...existing, ...newSuborders]));
      } catch (error) {
        setNotice(notice, "The browser could not save this demo order. No order was placed.", true);
        return;
      }
      let basketClearFailed = false;
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        basketClearFailed = true;
      }
      linesElement.innerHTML = `<div class="empty-state"><div class="success-mark">✓</div><strong>Demo order created</strong><p>${newSuborders.length} restaurant order${newSuborders.length === 1 ? "" : "s"} created under ${escapeHtml(parentId)}. This was not sent to any restaurant or rider.</p><a class="secondary-btn" href="admin.html">View the admin demo</a></div>`;
      document.querySelector("#checkoutForm").hidden = true;
      document.querySelector("#foodSubtotal").textContent = money(subtotal);
      setNotice(notice, basketClearFailed
        ? "Demo order saved, but the basket could not be cleared from this browser session. No payment or delivery was triggered."
        : "Prototype only: no payment, notification, or real delivery was triggered.", basketClearFailed);
    });
  }

  function initAdmin() {
    const list = document.querySelector("#orderList");
    if (!list) return;

    const notice = document.querySelector("#adminNotice");
    let orders;
    try {
      orders = readStoredJson(ORDER_KEY, sampleOrders);
      if (!Array.isArray(orders)) throw new Error("Stored demo orders must be a list.");
    } catch (error) {
      setNotice(notice, error.message, true);
      return;
    }

    const role = document.querySelector("#adminRole");
    const restaurantFilter = document.querySelector("#restaurantFilter");
    const roleSummary = document.querySelector("#roleSummary");
    const restaurants = [...new Set(orders.map((order) => order.restaurant))].sort();
    restaurantFilter.innerHTML = restaurants.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");

    function render() {
      const isOperations = role.value === "operations";
      restaurantFilter.disabled = isOperations;
      roleSummary.textContent = isOperations
        ? "ChopLocal operations can view every restaurant order and manage rider assignment."
        : `Restaurant staff can view and update orders for ${restaurantFilter.value || "their restaurant"} only. In production, the server enforces this scope for each signed-in staff account.`;
      const visibleOrders = orders.filter((order) => isOperations || order.restaurant === restaurantFilter.value);
      if (!visibleOrders.length) {
        list.innerHTML = '<div class="empty-state">No orders are visible in this view.</div>';
        return;
      }
      list.innerHTML = visibleOrders.map((order) => `
        <article class="order-card">
          <div class="order-top">
            <div><div class="order-id">${escapeHtml(order.id)} <span class="order-meta">· grouped order ${escapeHtml(order.parentId)}</span></div>
              <div class="order-meta">${escapeHtml(order.restaurant)} · delivery area: ${escapeHtml(order.area)}</div></div>
            <span class="order-status">${escapeHtml(order.status)}</span>
          </div>
          <div class="order-items">${order.items.map(escapeHtml).join("<br>")}<br><strong>Food subtotal: ${money(order.total)}</strong></div>
          <div class="order-actions">
            <label class="order-meta">Update status
              <select data-status-for="${escapeHtml(order.id)}">
                ${["New", "Accepted", "Preparing", "Ready for pickup", "Picked up", "Delivered", "Cancelled"].map((status) => `<option${status === order.status ? " selected" : ""}>${status}</option>`).join("")}
              </select>
            </label>
            ${isOperations ? `<label class="order-meta">Rider
              <select data-rider-for="${escapeHtml(order.id)}">
                ${["Unassigned", "Royal Rider Ada", "Royal Rider Femi", "Royal Rider Timi"].map((rider) => `<option${rider === order.rider ? " selected" : ""}>${rider}</option>`).join("")}
              </select>
            </label>` : `<span class="order-meta">Rider assignment is managed by ChopLocal operations.</span>`}
          </div>
        </article>`).join("");

      list.querySelectorAll("[data-status-for]").forEach((select) => {
        select.addEventListener("change", () => updateOrder(select.dataset.statusFor, "status", select.value));
      });
      list.querySelectorAll("[data-rider-for]").forEach((select) => {
        select.addEventListener("change", () => updateOrder(select.dataset.riderFor, "rider", select.value));
      });
    }

    function updateOrder(id, field, value) {
      const order = orders.find((entry) => entry.id === id);
      if (!order) {
        setNotice(notice, "That order is no longer available. Refresh the demo.", true);
        return;
      }
      order[field] = value;
      try {
        sessionStorage.setItem(ORDER_KEY, JSON.stringify(orders));
      } catch (error) {
        setNotice(notice, "The browser could not save this demo update.", true);
        return;
      }
      setNotice(notice, "Demo order updated in this browser session only.");
      render();
    }

    role.addEventListener("change", render);
    restaurantFilter.addEventListener("change", render);
    render();
  }

  initCheckout();
  initAdmin();
})();
