// JS/admin-menu-list.js
document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "../PHP";
  const tbody = document.getElementById("menu-tbody");
  const searchInput = document.getElementById("menu-search");

  let allItems = [];

  function renderMenu(filterText = "") {
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = filterText.toLowerCase();

    const filtered = allItems.filter((item) => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    });

    filtered.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>$${Number(item.price || 0).toFixed(2)}</td>
        <td>${item.category || ""}</td>
        <td>
          <button class="btn-ghost" data-edit-id="${item.id}">
            <i class="fa-solid fa-pen"></i>
          </button>
        </td>
        <td>
          <button class="btn-ghost" data-delete-id="${item.id}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  fetch(`${apiBase}/api-menu.php`)
    .then((res) => res.json())
    .then((data) => {
      allItems = Array.isArray(data.items) ? data.items : [];
      renderMenu();
    })
    .catch((err) => {
      console.error("Failed to load menu items:", err);
    });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderMenu(searchInput.value);
    });
  }

  // Delegate click events for edit/delete
  if (tbody) {
    tbody.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit-id]");
      const deleteBtn = event.target.closest("[data-delete-id]");

      if (editBtn) {
        const id = editBtn.getAttribute("data-edit-id");
        window.location.href = `admin-menu-edit.php?id=${encodeURIComponent(
          id
        )}`;
      } else if (deleteBtn) {
        const id = deleteBtn.getAttribute("data-delete-id");
        if (confirm("Delete this menu item?")) {
          fetch(`${apiBase}/api-menu.php?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
          })
            .then((res) => res.json())
            .then(() => {
              allItems = allItems.filter(
                (item) => String(item.id) !== String(id)
              );
              renderMenu(searchInput ? searchInput.value : "");
            })
            .catch(() => alert("Failed to delete item"));
        }
      }
    });
  }
});
