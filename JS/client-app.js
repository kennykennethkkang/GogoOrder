// JS/client-app.js
// Customer home page: load menu, handle cart interactions, keep UI in sync.

(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";
  const cartKey = "gogoCart";

  let allMenu = [];
  let activeCategory = null;
  let showAllItems = false;
  let searchTerm = "";

  function loadCart() {
    try {
      const items = JSON.parse(localStorage.getItem(cartKey)) || [];
      return items.map((item) => ({
        ...item,
        image_url: normalizeImage(item.image_url || item.image),
      }));
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    renderCart();
  }

  function addToCart(item) {
    const cart = loadCart();
    // Create a unique key based on id and customizations
    const customKey = JSON.stringify(item.customizations || []) + JSON.stringify(item.removedIngredients || []);
    const existing = cart.find((c) => {
      const cKey = JSON.stringify(c.customizations || []) + JSON.stringify(c.removedIngredients || []);
      return c.id === item.id && cKey === customKey;
    });
    const normalizedImage = normalizeImage(item.image_url || item.image);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ 
        ...item, 
        qty: 1, 
        image_url: normalizedImage,
        description: item.description || "",
        customizations: item.customizations || [],
        removedIngredients: item.removedIngredients || []
      });
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    const cart = loadCart().filter((c) => c.id !== id);
    saveCart(cart);
  }

  function adjustQty(id, delta) {
    const cart = loadCart().map((c) => {
      if (c.id === id) {
        return { ...c, qty: Math.max(1, c.qty + delta) };
      }
      return c;
    });
    saveCart(cart);
  }

  function cartTotal(cart = loadCart()) {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  const categoryIconMap = {
    appetizers: "appetizers.png",
    entrees: "Entrees.png",
    entree: "Entrees.png",
    dessert: "dessert.png",
    desserts: "dessert.png",
    salad: "salad.png",
    salads: "salad.png",
    drink: "drink.png",
    drinks: "drink.png",
  };

  // Define the desired category order
  const categoryOrder = ["Appetizers", "Entrees", "Dessert", "Salad", "Drink"];

  function sortCategories(categories) {
    return categories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      // If both are in the order list, sort by their index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the list, A comes first
      if (indexA !== -1) return -1;
      // If only B is in the list, B comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, maintain original order
      return 0;
    });
  }

  function renderCategories() {
    const list = document.querySelector(".category-list");
    if (!list) return;
    list.innerHTML = "";
    const categories = Array.from(
      new Set(allMenu.map((m) => m.category || "Other"))
    );
    // Sort categories according to desired order
    const sortedCategories = sortCategories(categories);
    // Only auto-select first category on initial load, not when explicitly showing all
    if (activeCategory === null && !showAllItems) {
      activeCategory = sortedCategories[0] || null;
    }

    sortedCategories.forEach((cat) => {
      const slug = (cat || "category").toLowerCase().replace(/\s+/g, "");
      const iconName = categoryIconMap[slug] || "appetizers.png";
      const div = document.createElement("div");
      div.className = "category" + (cat === activeCategory && !showAllItems ? " active" : "");
      div.innerHTML = `
        <img src="img/categories/${iconName}" alt="${cat}" onerror="this.src='img/categories/appetizers.png'">
        <p>${cat}</p>
      `;
      div.addEventListener("click", () => {
        activeCategory = cat;
        showAllItems = false;
        renderCategories();
        renderMenuItems();
      });
      list.appendChild(div);
    });
  }

  function renderMenuItems() {
    const container = document.querySelector(".menu-items");
    if (!container) return;
    container.innerHTML = "";

    const filtered = allMenu.filter((m) => {
      const inCategory = showAllItems 
        ? true 
        : (activeCategory
          ? (m.category || "").toLowerCase() === activeCategory.toLowerCase()
          : true);
      const matchesSearch = searchTerm
        ? (m.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return inCategory && matchesSearch;
    });

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.style.cursor = "pointer";
      const imgSrc = normalizeImage(item.image_url || item.image);
      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}">
        <h4>${item.name}</h4>
        <div class="item-footer">
          <p class="price">$${Number(item.price).toFixed(2)}</p>
          <button class="add-btn" data-add-id="${item.id}">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      `;
      // Make entire card clickable to show modal
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".add-btn")) {
          showItemModal(item);
        }
      });
      container.appendChild(card);
    });
  }

  function renderCart() {
    const cart = loadCart();
    const wrap = document.querySelector(".cart-items");
    const totalEl = document.querySelector("[data-cart-total]");
    const emptyEl = document.querySelector("[data-empty-cart]");
    if (wrap) {
      wrap.innerHTML = "";
      if (cart.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
      } else if (emptyEl) {
        emptyEl.style.display = "none";
      }

      cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-item";
        const imgSrc = normalizeImage(item.image_url || item.image);
        let customizationsHTML = "";
        if (item.customizations && item.customizations.length > 0) {
          customizationsHTML = `<div class="cart-customization"><span class="custom-label">With:</span> ${item.customizations.join(", ")}</div>`;
        }
        if (item.removedIngredients && item.removedIngredients.length > 0) {
          customizationsHTML += `<div class="cart-customization"><span class="custom-label">Without:</span> ${item.removedIngredients.join(", ")}</div>`;
        }
        row.innerHTML = `
          <img src="${imgSrc}">
          <div class="cart-item-info">
            <p>${item.name}</p>
            ${customizationsHTML}
            <span>$${Number(item.price).toFixed(2)}</span>
          </div>
          <div class="cart-qty">
            <button class="qty-btn" data-dec="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-inc="${item.id}">+</button>
          </div>
          <i class="fa-solid fa-trash" data-remove="${item.id}"></i>
        `;
        wrap.appendChild(row);
      });
    }
    if (totalEl) {
      totalEl.textContent = `$${cartTotal(cart).toFixed(2)}`;
    }
  }

  function showItemModal(item) {
    const modal = document.getElementById("item-modal");
    const modalDetails = document.getElementById("modal-item-details");
    if (!modal || !modalDetails) return;

    const imgSrc = normalizeImage(item.image_url || item.image);
    const ingredients = item.ingredients || [];
    
    let ingredientsHTML = "";
    if (ingredients.length > 0) {
      ingredientsHTML = `
        <div class="modal-section">
          <h3>Customize Ingredients</h3>
          <p class="section-subtitle">Select ingredients to include or exclude</p>
          <div class="ingredients-list">
      `;
      
      ingredients.forEach((ing, index) => {
        const isRequired = !ing.removable;
        const checked = !isRequired ? "checked" : "";
        const disabled = isRequired ? "disabled" : "";
        ingredientsHTML += `
          <label class="ingredient-item ${isRequired ? 'required' : ''}">
            <input type="checkbox" ${checked} ${disabled} data-ingredient="${index}">
            <span class="checkmark"></span>
            <span class="ingredient-name">${ing.name}</span>
            ${isRequired ? '<span class="required-badge">Required</span>' : ''}
          </label>
        `;
      });
      
      ingredientsHTML += `
          </div>
        </div>
      `;
    }

    modalDetails.innerHTML = `
      <div class="modal-header">
        <img src="${imgSrc}" alt="${item.name}" class="modal-item-image">
        <div class="modal-header-info">
          <h2>${item.name}</h2>
          <p class="modal-description">${item.description || "No description available."}</p>
          <p class="modal-price">$${Number(item.price).toFixed(2)}</p>
        </div>
      </div>
      ${ingredientsHTML}
      <div class="modal-footer">
        <div class="modal-total">
          <span>Total:</span>
          <strong>$${Number(item.price).toFixed(2)}</strong>
        </div>
        <button class="add-to-cart-modal-btn" data-modal-add-id="${item.id}">
          <i class="fa-solid fa-cart-plus"></i>
          Add to Cart
        </button>
      </div>
    `;

    modal.classList.add("show");
    
    // Attach event listener for add to cart button
    const addBtn = modalDetails.querySelector("[data-modal-add-id]");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const selectedIngredients = [];
        const checkboxes = modalDetails.querySelectorAll("input[type='checkbox']:checked");
        checkboxes.forEach((cb) => {
          const index = parseInt(cb.getAttribute("data-ingredient"));
          if (ingredients[index]) {
            selectedIngredients.push(ingredients[index].name);
          }
        });
        
        addToCart({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          image: item.image_url || item.image,
          description: item.description || "",
          customizations: selectedIngredients,
          removedIngredients: getRemovedIngredients(ingredients, checkboxes)
        });
        
        closeItemModal();
      });
    }
  }

  function getRemovedIngredients(allIngredients, checkedBoxes) {
    const checkedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.getAttribute("data-ingredient")));
    const removed = [];
    allIngredients.forEach((ing, index) => {
      // Only track removable ingredients that are unchecked
      if (ing.removable && !checkedIndices.includes(index)) {
        removed.push(ing.name);
      }
    });
    return removed;
  }

  function closeItemModal() {
    const modal = document.getElementById("item-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  function attachCartListeners() {
    document.addEventListener("click", (event) => {
      const addBtn = event.target.closest("[data-add-id]");
      if (addBtn) {
        const id = Number(addBtn.getAttribute("data-add-id"));
        const item = allMenu.find((m) => Number(m.id) === id);
        if (item) {
          addToCart({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            image: item.image_url || item.image,
            description: item.description || "",
          });
        }
      }

      const dec = event.target.closest("[data-dec]");
      const inc = event.target.closest("[data-inc]");
      const remove = event.target.closest("[data-remove]");
      if (dec) {
        adjustQty(Number(dec.getAttribute("data-dec")), -1);
      } else if (inc) {
        adjustQty(Number(inc.getAttribute("data-inc")), 1);
      } else if (remove) {
        removeFromCart(Number(remove.getAttribute("data-remove")));
      }
    });
  }

  function attachCheckout() {
    const btn = document.querySelector(".checkout-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const target = isHtmlSubdir ? "cart.php" : "HTML/cart.php";
      window.location.href = target;
    });
  }

  function fetchMenu() {
    fetch(`${apiBase}/api-menu.php`)
      .then((res) => res.json())
      .then((data) => {
        allMenu = data.items || [];
        renderCategories();
        renderMenuItems();
        renderCart();
      })
      .catch((err) => {
        console.error("Failed to load menu", err);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchMenu();
    attachCartListeners();
    attachCheckout();
    
    // Close modal handlers
    const modal = document.getElementById("item-modal");
    const closeBtn = document.getElementById("modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeItemModal);
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeItemModal();
        }
      });
    }
    
    // View All button handler
    const viewAllBtn = document.getElementById("view-all-btn");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showAllItems = true;
        activeCategory = null;
        renderCategories();
        renderMenuItems();
        // Scroll to menu section
        const menuSection = document.querySelector("#menu");
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
    
    const searchInput = document.querySelector("#menu-search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value;
        renderMenuItems();
      });
    }
  });
})();
