// JS/client-app.js
// Customer home page: load menu, handle cart interactions, keep UI in sync.

(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";
  const cartKey = "gogoCart";

  let allMenu = [];
  let activeCategory = null;
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

  function normalizeImage(raw) {
    if (!raw) return "/img/placeholder.png";
    if (String(raw).startsWith("http")) return raw;
    return "/" + String(raw).replace(/^\/?/, "");
  }

  function addToCart(item) {
    const cart = loadCart();
    const existing = cart.find((c) => c.id === item.id);
    const normalizedImage = normalizeImage(item.image_url || item.image);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1, image_url: normalizedImage });
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

  function renderCategories() {
    const list = document.querySelector(".category-list");
    if (!list) return;
    list.innerHTML = "";
    const categories = Array.from(
      new Set(allMenu.map((m) => m.category || "Other"))
    );
    if (!activeCategory) {
      activeCategory = categories[0] || null;
    }

    categories.forEach((cat) => {
      const slug = (cat || "category").toLowerCase().replace(/\s+/g, "");
      const iconName = categoryIconMap[slug] || "appetizers.png";
      const div = document.createElement("div");
      div.className = "category" + (cat === activeCategory ? " active" : "");
      div.innerHTML = `
        <img src="img/categories/${iconName}" alt="${cat}" onerror="this.src='img/categories/appetizers.png'">
        <p>${cat}</p>
        <i class="fa-solid fa-arrow-right category-arrow"></i>
      `;
      div.addEventListener("click", () => {
        activeCategory = cat;
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
      const inCategory = activeCategory
        ? (m.category || "").toLowerCase() === activeCategory.toLowerCase()
        : true;
      const matchesSearch = searchTerm
        ? (m.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return inCategory && matchesSearch;
    });

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "item-card";
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
        row.innerHTML = `
          <img src="${imgSrc}">
          <div class="cart-item-info">
            <p>${item.name}</p>
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
    const searchInput = document.querySelector("#menu-search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value;
        renderMenuItems();
      });
    }
  });
})();
