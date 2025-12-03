// JS/customer-orders.js
// Load and render a customer's orders.

(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";

  function renderOrders(orders) {
    const wrap = document.querySelector("[data-order-list]");
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!orders || orders.length === 0) {
      wrap.innerHTML = '<p class="muted">You have no orders yet.</p>';
      return;
    }

    orders.forEach((order) => {
      const div = document.createElement("div");
      div.className = "order-card";
      const totalItems = Array.isArray(order.items)
        ? order.items.reduce((sum, i) => sum + Number(i.qty || 0), 0)
        : 0;
      const created = order.created_at ? order.created_at.replace("T", " ").split(".")[0] : "";
      const itemsHtml = (order.items || [])
        .map(
          (item) => `
            <div class="order-item-row">
              <span>${item.item_name}</span>
              <span class="order-qty">x${item.qty}</span>
              <span class="order-price">$${Number(item.price).toFixed(2)}</span>
            </div>
          `
        )
        .join("");

      const statusLower = (order.status || "").toLowerCase();
      let badgeClass = "status-badge";
      if (statusLower === "pending") badgeClass += " badge-pending";
      if (statusLower === "cancelled" || statusLower === "canceled")
        badgeClass += " badge-cancelled";
      if (statusLower === "completed") badgeClass += " badge-completed";

      div.innerHTML = `
        <div class="order-card-header">
          <h4>Order #${order.id}</h4>
          <span class="${badgeClass}">${order.status}</span>
        </div>
        <div class="order-grid">${itemsHtml}</div>
        <div class="order-card-footer">
          <div>${totalItems} item(s)</div>
          <div>Total $${Number(order.total).toFixed(2)}</div>
          <div class="muted">${created}</div>
          ${
            (order.status || "").toLowerCase() === "pending"
              ? `<button class="order-cancel-btn" data-cancel-id="${order.id}">Cancel</button>`
              : ""
          }
        </div>
      `;
      wrap.appendChild(div);
    });
  }

  function loadOrders() {
    fetch(`${apiBase}/api-orders.php?mine=1`)
      .then((res) => res.json())
      .then((data) => {
        renderOrders(data.orders || []);
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadOrders();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cancel-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-cancel-id");
      if (!confirm("Cancel this order?")) return;

      fetch(`${apiBase}/api-orders.php?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" }),
      })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok || body.error) {
            throw new Error(body.error || "Could not cancel order");
          }
          loadOrders();
        })
        .catch((err) => alert(err.message || "Could not cancel order"));
    });
  });
})();
