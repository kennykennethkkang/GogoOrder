// Cart management using localStorage for persistence across pages
let cart = [];

// Initialize cart from localStorage
function initCart() {
    const savedCart = localStorage.getItem('gogoOrderCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCart();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('gogoOrderCart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(itemId, menuData, customizations = null) {
    console.log('Cart addToCart called with itemId:', itemId);
    console.log('menuData:', menuData);
    console.log('customizations:', customizations);
    
    if (!menuData || !Array.isArray(menuData)) {
        console.error('Invalid menuData provided');
        return;
    }
    
    const item = menuData.find(i => i.id === itemId);
    if (!item) {
        console.error('Item not found:', itemId, 'Available items:', menuData.map(i => i.id));
        return;
    }

    console.log('Adding item to cart:', item.name);
    console.log('Current cart before add:', JSON.stringify(cart));
    
    // Create cart item with customizations
    const cartItem = {
        ...item,
        quantity: 1,
        customizations: customizations || null
    };
    
    // Check if same item with same customizations exists
    const existingItemIndex = cart.findIndex(i => {
        if (i.id !== itemId) return false;
        // Compare customizations
        const iCustom = i.customizations || null;
        const newCustom = customizations || null;
        if (!iCustom && !newCustom) return true;
        if (!iCustom || !newCustom) return false;
        return JSON.stringify(iCustom) === JSON.stringify(newCustom);
    });
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
        console.log('Updated quantity to:', cart[existingItemIndex].quantity);
    } else {
        cart.push(cartItem);
        console.log('Added new item to cart:', cartItem);
        console.log('Cart length now:', cart.length);
    }
    
    console.log('Cart after add:', JSON.stringify(cart));
    saveCart();
    
    // Force update immediately
    console.log('Calling updateCart...');
    updateCart();
    console.log('updateCart completed');
}

// Remove item from cart
function removeFromCart(index) {
    console.log('Removing item from cart at index:', index);
    cart.splice(index, 1);
    console.log('Cart after removal:', cart);
    saveCart();
    updateCart();
}

// Expose functions globally immediately
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCart = updateCart;
window.getCartTotal = getCartTotal;
window.getCartItemCount = getCartItemCount;
window.clearCart = clearCart;

// Expose cart array for debugging
window.getCart = () => cart;

// Update quantity of item in cart
function updateCartQuantity(itemId, quantity) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = quantity;
            saveCart();
            updateCart();
        }
    }
}

// Get cart total
function getCartTotal() {
    // Recommendations are added as separate items, so we just sum all items
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get cart item count
function getCartItemCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Clear cart
function clearCart() {
    cart = [];
    saveCart();
    updateCart();
}

// Update cart display
function updateCart() {
    console.log('updateCart called. Cart length:', cart.length);
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) {
        console.warn('cart-items container not found');
        return; // Cart container might not exist on all pages
    }
    console.log('Found cart-items container');
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">Your cart is empty</p>';
        
        // Update checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.textContent = 'Checkout';
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
        }
        return;
    }

    // Enable checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.cursor = 'pointer';
    }

    cart.forEach((item, index) => {
        console.log('Rendering cart item:', item.name, 'Quantity:', item.quantity);
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        // Build customizations display
        let customizationsHTML = '';
        if (item.customizations) {
            const custom = item.customizations;
            if (custom.removedIngredients && custom.removedIngredients.length > 0) {
                customizationsHTML += `<div class="cart-customization"><span class="custom-label">No:</span> ${custom.removedIngredients.join(', ')}</div>`;
            }
            if (custom.addedRecommendations && custom.addedRecommendations.length > 0) {
                const recNames = custom.addedRecommendations.map(r => r.name).join(', ');
                customizationsHTML += `<div class="cart-customization"><span class="custom-label">+ Add-ons:</span> ${recNames}</div>`;
            }
        }
        
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
            <div class="cart-item-info">
                <p>${item.name}</p>
                ${customizationsHTML}
                <span>×${item.quantity}</span>
            </div>
            <p class="cart-price">$${(item.price * item.quantity).toFixed(2)}</p>
            <i class="fa-solid fa-trash" onclick="window.removeFromCart(${index})" style="cursor: pointer;"></i>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
    
    console.log('Cart items rendered. Total items in cart:', cart.length);

    // Add total if checkout button exists
    const total = getCartTotal();
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
        totalElement.innerHTML = `
            <div style="border-top: 2px solid #f0f0f0; padding-top: 15px; margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <strong>Total:</strong>
                    <strong style="color: #ff7b29; font-size: 18px;">$${total.toFixed(2)}</strong>
                </div>
            </div>
        `;
    }
}

// Initialize cart when DOM is ready
function initializeCart() {
    const init = () => {
        console.log('Initializing cart...');
        const cartItemsContainer = document.getElementById('cart-items');
        
        // Only initialize if cart-items container exists (for sidebar cart)
        // Checkout page uses checkout-cart-items, so skip initialization there
        if (cartItemsContainer) {
            console.log('Cart container found, initializing sidebar cart');
            initCart();
        } else {
            // Check if we're on checkout page
            const checkoutCartContainer = document.getElementById('checkout-cart-items');
            if (checkoutCartContainer) {
                console.log('On checkout page - cart.js initialization skipped (checkout.js handles it)');
                return; // Don't retry, checkout.js will handle it
            }
            // If neither exists, it might be a page without cart, so just stop
            console.log('No cart container found - this page may not have a cart sidebar');
            return;
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

// Start initialization
initializeCart();

