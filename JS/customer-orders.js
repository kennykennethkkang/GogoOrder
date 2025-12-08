// JS/customer-orders.js
// Load and render a customer's orders.

(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";

  function formatDateTime(raw) {
    if (!raw) return "";
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    }
    return String(raw).replace("T", " ").split(".")[0];
  }

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
      const created = formatDateTime(order.created_at || order.timestamp);
      const itemsHtml = (order.items || [])
        .map(
          (item) => {
            let customizationsHTML = "";
            let descriptionHTML = "";
            
            if (item.description) {
              descriptionHTML = `<div class="order-item-description">${item.description}</div>`;
            }
            
            if (item.customizations) {
              try {
                const customData = typeof item.customizations === 'string' 
                  ? JSON.parse(item.customizations) 
                  : item.customizations;
                
                if (typeof customData === 'object' && customData !== null) {
                  if (customData.with && Array.isArray(customData.with) && customData.with.length > 0) {
                    customizationsHTML += `<div class="order-item-customization"><span class="custom-label">With:</span> ${customData.with.join(", ")}</div>`;
                  }
                  if (customData.without && Array.isArray(customData.without) && customData.without.length > 0) {
                    customizationsHTML += `<div class="order-item-customization"><span class="custom-label">Without:</span> ${customData.without.join(", ")}</div>`;
                  }
                } else if (Array.isArray(customData) && customData.length > 0) {
                  customizationsHTML += `<div class="order-item-customization"><span class="custom-label">With:</span> ${customData.join(", ")}</div>`;
                }
              } catch (e) {
                // If parsing fails, try to display as string
                if (item.customizations) {
                  customizationsHTML += `<div class="order-item-customization">${item.customizations}</div>`;
                }
              }
            }
            
            return `
              <div class="order-item-row">
                <div class="order-item-info">
                  <span class="order-item-name">${item.item_name}</span>
                  ${descriptionHTML}
                  ${customizationsHTML}
                </div>
                <span class="order-qty">x${item.qty}</span>
                <span class="order-price">$${Number(item.price).toFixed(2)}</span>
              </div>
            `;
          }
        )
        .join("");

      const statusLower = (order.status || "").toLowerCase();
      let badgeClass = "status-badge";
      if (statusLower === "pending") badgeClass += " badge-pending";
      if (statusLower === "cancelled" || statusLower === "canceled")
        badgeClass += " badge-cancelled";
      if (statusLower === "completed") badgeClass += " badge-completed";

      const type = (order.order_type || "pickup").toLowerCase();
      const addressBlock =
        type === "delivery"
          ? `<div class="muted">Address: ${order.address || "N/A"}</div>`
          : "";
      const timeBlock = order.scheduled_time
        ? `<div class="muted">Scheduled: ${formatDateTime(order.scheduled_time)}</div>`
        : "";

      div.innerHTML = `
        <div class="order-card-header">
          <h4>Order #${order.id}</h4>
          <span class="${badgeClass}">${order.status}</span>
        </div>
        <div class="order-grid">${itemsHtml}</div>
        <div class="order-card-footer">
          <div class="order-meta-left">
            <div class="muted">Items</div>
            <div class="text-strong">${totalItems} item(s)</div>
            <div class="muted">${type === "delivery" ? "Delivery" : "Pickup"}</div>
            ${addressBlock}
          </div>
          <div class="order-meta-center">
            <div class="muted">Total</div>
            <div class="text-strong">$${Number(order.total).toFixed(2)}</div>
            ${timeBlock}
          </div>
          <div class="order-meta-right">
            <div class="muted">Placed</div>
            <div>${created}</div>
          </div>
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
