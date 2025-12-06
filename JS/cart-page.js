// JS/cart-page.js
// Cart page interactions + order submission.

(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";
  const cartKey = "gogoCart";

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
  }

  function cartTotal(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function renderCart() {
    const cart = loadCart();
    const list = document.querySelector("[data-cart-list]");
    const totalEl = document.querySelector("[data-cart-total]");
    if (!list) return;
    list.innerHTML = "";

    if (cart.length === 0) {
      list.innerHTML = '<p class="muted">Your cart is empty.</p>';
      if (totalEl) totalEl.textContent = "$0.00";
      return;
    }

    cart.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const imgSrc = normalizeImage(item.image_url || item.image);
      row.innerHTML = `
        <div class="cart-row-left">
          <img src="${imgSrc}" alt="${item.name}">
          <div>
            <div class="cart-row-title">${item.name}</div>
            <div class="cart-row-price">$${Number(item.price).toFixed(2)}</div>
          </div>
        </div>
        <div class="cart-row-actions">
          <button class="qty-btn" data-dec="${item.id}">-</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-inc="${item.id}">+</button>
          <button class="delete-btn" data-remove="${item.id}">&times;</button>
        </div>
      `;
      list.appendChild(row);
    });

    if (totalEl) {
      totalEl.textContent = `$${cartTotal(cart).toFixed(2)}`;
    }
  }

  function updateQty(id, delta) {
    const cart = loadCart().map((item) => {
      if (item.id === id) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    });
    saveCart(cart);
    renderCart();
  }

  function removeItem(id) {
    const cart = loadCart().filter((item) => item.id !== id);
    saveCart(cart);
    renderCart();
  }

  function submitOrder() {
    const cart = loadCart();
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const nameInput = document.querySelector("#customer-name");
    const typeInput = document.querySelector('input[name="order_type"]:checked');
    const scheduleInput = document.querySelector("#scheduled-time");
    const addressInput = document.querySelector("#delivery-address");

    if (scheduleInput && !scheduleInput.value) {
      alert("Please select a pickup/delivery time or tap ASAP.");
      return;
    }

    if (typeInput && typeInput.value === "delivery") {
      if (!addressInput || !addressInput.value.trim()) {
        alert("Please enter a delivery address.");
        return;
      }
    }

    const payload = {
      name: nameInput ? nameInput.value : "",
      order_type: typeInput ? typeInput.value : "pickup",
      scheduled_time: scheduleInput ? scheduleInput.value : "",
      address: addressInput ? addressInput.value : "",
      items: cart.map((item) => ({
        id: item.id,
        qty: item.qty,
      })),
    };

    fetch(`${apiBase}/api-orders.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error || "Order failed");
        }
        localStorage.removeItem(cartKey);
        alert("Order placed! View your orders for status.");
        window.location.href = isHtmlSubdir ? "view-order.php" : "HTML/view-order.php";
      })
      .catch((err) => {
        alert(err.message || "Order failed");
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCart();

    const asapBtn = document.querySelector("#asap-btn");
    const scheduleInput = document.querySelector("#scheduled-time");
    const addressBlock = document.querySelector("#address-block");
    const addressInput = document.querySelector("#delivery-address");
    document.addEventListener("change", (e) => {
      const radio = e.target.closest('input[name="order_type"]');
      if (radio && addressBlock) {
        if (radio.value === "delivery") {
          addressBlock.style.display = "block";
          if (addressInput) addressInput.required = true;
        } else {
          addressBlock.style.display = "none";
          if (addressInput) {
            addressInput.required = false;
            addressInput.value = "";
          }
        }
      }
    });
    if (asapBtn && scheduleInput) {
      asapBtn.addEventListener("click", () => {
        // Use current time as ASAP marker
        const now = new Date();
        const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        scheduleInput.value = isoLocal;
      });
    }

    document.addEventListener("click", (event) => {
      const dec = event.target.closest("[data-dec]");
      const inc = event.target.closest("[data-inc]");
      const remove = event.target.closest("[data-remove]");
      if (dec) {
        updateQty(Number(dec.getAttribute("data-dec")), -1);
      } else if (inc) {
        updateQty(Number(inc.getAttribute("data-inc")), 1);
      } else if (remove) {
        removeItem(Number(remove.getAttribute("data-remove")));
      }
    });

    const submitBtn = document.querySelector("#confirm-order");
    if (submitBtn) {
      submitBtn.addEventListener("click", submitOrder);
    }
  });
})();
