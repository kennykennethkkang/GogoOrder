// JS/admin-orders.js
document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "../PHP";
  const tbody = document.getElementById("orders-tbody");
  const countEl = document.getElementById("order-count");
  const searchInput = document.getElementById("order-search");

  let allOrders = [];

  function renderOrders(filterText = "") {
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = filterText.toLowerCase();

    const filtered = allOrders.filter((order) => {
      if (!query) return true;
      return (
        String(order.id || order.order_id).includes(query) ||
        (order.customer_name &&
          order.customer_name.toLowerCase().includes(query)) ||
        (order.status && order.status.toLowerCase().includes(query))
      );
    });

    filtered.forEach((order) => {
      const tr = document.createElement("tr");

      const itemCount = Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + (item.qty || 0), 0)
        : 0;

      const statusLower = (order.status || "").toLowerCase();
      let statusClass = "admin-status-badge admin-status-pending";
      if (statusLower === "completed") statusClass = "admin-status-badge admin-status-completed";
      if (statusLower === "cancelled" || statusLower === "canceled")
        statusClass = "admin-status-badge admin-status-cancelled";

      const type = (order.order_type || "pickup").toLowerCase();
      const typeText = type === "delivery" ? "Delivery" : "Pickup";
      const address = type === "delivery" ? order.address || "" : "";
      const timeText = order.scheduled_time || "";

      tr.innerHTML = `
        <td>${order.id || order.order_id}</td>
        <td>${order.customer_name || order.name || ""}</td>
        <td>${itemCount}</td>
        <td>$${Number(order.total || 0).toFixed(2)}</td>
        <td><span class="${statusClass}">${order.status || ""}</span></td>
        <td>
          <div>${typeText}</div>
          ${address ? `<div class="muted">${address}</div>` : ""}
          ${timeText ? `<div class="muted">${timeText}</div>` : ""}
        </td>
        <td>${order.created_at || order.timestamp || ""}</td>
        <td class="admin-actions">
          ${
            statusLower === "cancelled" || statusLower === "canceled"
              ? ""
              : `
                <button class="admin-action-btn" data-complete-id="${order.id}">Complete</button>
                ${
                  statusLower === "completed"
                    ? ""
                    : `<button class="admin-action-btn admin-action-cancel" data-cancel-id="${order.id}">Cancel</button>`
                }
              `
          }
        </td>
      `;

      tbody.appendChild(tr);
    });

    if (countEl) {
      countEl.textContent = filtered.length;
    }
  }

  fetch(`${apiBase}/api-orders.php`)
    .then((res) => res.json())
    .then((data) => {
      allOrders = Array.isArray(data.orders) ? data.orders : [];
      renderOrders();
    })
    .catch((err) => {
      console.error("Failed to load orders:", err);
    });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderOrders(searchInput.value);
    });
  }

  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const completeBtn = e.target.closest("[data-complete-id]");
      const cancelBtn = e.target.closest("[data-cancel-id]");

      if (completeBtn) {
        const id = completeBtn.getAttribute("data-complete-id");
        fetch(`${apiBase}/api-orders.php?id=${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        })
          .then((res) => res.json())
          .then((body) => {
            if (body.error) throw new Error(body.error);
            allOrders = allOrders.map((o) =>
              String(o.id || o.order_id) === String(id)
                ? { ...o, status: "Completed" }
                : o
            );
            renderOrders(searchInput ? searchInput.value : "");
          })
          .catch((err) => alert(err.message || "Failed to update order"));
      } else if (cancelBtn) {
        const id = cancelBtn.getAttribute("data-cancel-id");
        fetch(`${apiBase}/api-orders.php?id=${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Cancelled" }),
        })
          .then((res) => res.json())
          .then((body) => {
            if (body.error) throw new Error(body.error);
            allOrders = allOrders.map((o) =>
              String(o.id || o.order_id) === String(id)
                ? { ...o, status: "Cancelled" }
                : o
            );
            renderOrders(searchInput ? searchInput.value : "");
          })
          .catch((err) => alert(err.message || "Failed to cancel order"));
      }
    });
  }
});
