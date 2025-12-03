// JS/admin-menu-form.js
document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "../PHP";
  const form = document.getElementById("menu-form");
  if (!form) return;

  const mode = form.dataset.mode || "add";
  const idInput = document.getElementById("item-id");
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  if (mode === "edit" && editId) {
    fetch(`${apiBase}/api-menu.php`)
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || [];
        const item = items.find((i) => String(i.id) === String(editId));
        if (!item) return;

        if (idInput) idInput.value = item.id;
        form.elements["name"].value = item.name || "";
        form.elements["price"].value = item.price || "";
        form.elements["category"].value = item.category || "";
        form.elements["image"].value = item.image || "";
        form.elements["description"].value = item.description || "";
      })
      .catch((err) => console.error("Error loading menu.json for edit:", err));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    if (mode === "add") {
      fetch(`${apiBase}/api-menu.php`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((resp) => {
          if (resp.error) throw new Error(resp.error);
          window.location.href = "admin-menu-list.php";
        })
        .catch((err) => alert(err.message || "Failed to add item"));
    } else {
      formData.append("_method", "PATCH");
      formData.append("id", editId);
      fetch(`${apiBase}/api-menu.php?id=${encodeURIComponent(editId)}`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((resp) => {
          if (resp.error) throw new Error(resp.error);
          window.location.href = "admin-menu-list.php";
        })
        .catch((err) => alert(err.message || "Failed to save changes"));
    }
  });
});
