// JS/admin-menu-form.js
document.addEventListener("DOMContentLoaded", () => {
  // base api path for admin pages
  const apiBase = "../PHP";
  // main form on the page
  const form = document.getElementById("menu-form");
  if (!form) return;

  // detect if we are adding or editing
  const mode = form.dataset.mode || "add";
  const idInput = document.getElementById("item-id");
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  // ingredient list helpers
  const ingredientsList = document.getElementById("ingredients-list");
  const addIngredientBtn = document.getElementById("add-ingredient-btn");

  // Ingredient management functions
  function addIngredientRow(ingredient = { name: "", removable: false }) {
    if (!ingredientsList) return;

    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `
      <input type="text" class="ingredient-name" placeholder="Ingredient name" value="${ingredient.name || ""}" required>
      <label class="ingredient-checkbox">
        <input type="checkbox" class="ingredient-removable" ${ingredient.removable ? "checked" : ""}>
        <span>Removable</span>
      </label>
      <button type="button" class="btn-remove-ingredient" title="Remove ingredient">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    const removeBtn = row.querySelector(".btn-remove-ingredient");
    removeBtn.addEventListener("click", () => row.remove());

    ingredientsList.appendChild(row);
  }

  function getIngredients() {
    // collect ingredient rows into an array for the request
    if (!ingredientsList) return [];
    const rows = ingredientsList.querySelectorAll(".ingredient-row");
    const ingredients = [];
    rows.forEach((row) => {
      const name = row.querySelector(".ingredient-name")?.value.trim();
      const removable = row.querySelector(".ingredient-removable")?.checked || false;
      if (name) {
        ingredients.push({ name, removable });
      }
    });
    return ingredients;
  }

  function loadIngredients(ingredients) {
    if (!ingredientsList) return;
    ingredientsList.innerHTML = "";
    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      ingredients.forEach((ing) => addIngredientRow(ing));
    }
  }

  // Add ingredient button handler
  if (addIngredientBtn) {
    addIngredientBtn.addEventListener("click", () => addIngredientRow());
  }

  // Load existing data for edit mode
  if (mode === "edit" && editId) {
    // load existing item so we can prefill the form
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
        form.elements["image"].value = item.image_url || item.image || "";
        form.elements["description"].value = item.description || "";
        
        // Load ingredients if they exist
        if (item.ingredients && Array.isArray(item.ingredients)) {
          loadIngredients(item.ingredients);
        }
      })
      .catch((err) => console.error("Error loading menu.json for edit:", err));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // bundle form data (including file upload)
    const formData = new FormData(form);
    
    // Collect ingredients data
    const ingredients = getIngredients();
    formData.append("ingredients", JSON.stringify(ingredients));

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
