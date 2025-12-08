// JS/admin-dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const pendingEl = document.getElementById("stat-pending");
  const todayCompletedEl = document.getElementById("stat-completed-today");
  const totalCompletedEl = document.getElementById("stat-completed-total");
  const menuEl = document.getElementById("stat-menu");

  Promise.all([
    fetch("../PHP/api-orders.php")
      .then((r) => r.json())
      .then((data) => data.orders || [])
      .catch(() => []),
    fetch("../PHP/api-menu.php")
      .then((r) => r.json())
      .then((data) => data.items || [])
      .catch(() => []),
  ])
    .then(([orders, menu]) => {
      const todayPrefix = new Date().toISOString().slice(0, 10);

      let pending = 0;
      let todayCompleted = 0;
      let totalCompleted = 0;

      orders.forEach((order) => {
        const statusLower = (order.status || "").toLowerCase();
        const isCompleted = ["completed", "complete", "done"].includes(statusLower);
        if (statusLower === "pending") pending++;
        if (isCompleted) totalCompleted++;
        if (isCompleted && order.created_at && String(order.created_at).startsWith(todayPrefix)) {
          todayCompleted++;
        }
      });

      if (pendingEl) pendingEl.textContent = pending;
      if (todayCompletedEl) todayCompletedEl.textContent = todayCompleted;
      if (totalCompletedEl) totalCompletedEl.textContent = totalCompleted;
      if (menuEl) menuEl.textContent = menu.length;
    })
    .catch((err) => console.error("Dashboard stats error:", err));
});
