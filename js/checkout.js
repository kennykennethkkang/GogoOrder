// Checkout page functionality
const DELIVERY_FEE = 3.99;

// Load cart items on checkout page
function loadCheckoutCart() {
    console.log('Loading checkout cart...');
    
    // Get cart from localStorage
    const cartData = localStorage.getItem('gogoOrderCart');
    console.log('Raw cart data from localStorage:', cartData);
    
    let cart = [];
    try {
        cart = cartData ? JSON.parse(cartData) : [];
    } catch (e) {
        console.error('Error parsing cart data:', e);
        cart = [];
    }
    
    console.log('Parsed cart:', cart);
    console.log('Cart length:', cart.length);
    
    const cartItemsContainer = document.getElementById('checkout-cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const checkoutContent = document.querySelector('.checkout-content');
    const cartPageContainer = document.querySelector('.cart-page-container');
    
    console.log('cartItemsContainer:', cartItemsContainer);
    console.log('emptyCartMessage:', emptyCartMessage);
    console.log('checkoutContent:', checkoutContent);
    console.log('cartPageContainer:', cartPageContainer);
    
    if (!cart || cart.length === 0) {
        console.log('Cart is empty or invalid');
        if (cartItemsContainer) cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">Your cart is empty</p>';
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (checkoutContent) checkoutContent.style.display = 'none';
        if (cartPageContainer) cartPageContainer.style.display = 'none';
        return;
    }
    
    console.log('Cart has items, displaying...');
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    if (checkoutContent) checkoutContent.style.display = 'grid';
    if (cartPageContainer) cartPageContainer.style.display = 'block';
    
    if (!cartItemsContainer) {
        console.error('cartItemsContainer not found!');
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach((item, index) => {
        console.log(`Rendering item ${index}:`, item);
        
        // Validate item has required fields
        if (!item.name || !item.price || !item.quantity) {
            console.warn('Invalid item:', item);
            return;
        }
        
        const cartItem = document.createElement('div');
        cartItem.className = 'checkout-cart-item';
        
        // Build customizations display
        let customizationsHTML = '';
        if (item.customizations) {
            const custom = item.customizations;
            if (custom.removedIngredients && custom.removedIngredients.length > 0) {
                customizationsHTML += `<div class="checkout-customization"><span class="custom-label">No:</span> ${custom.removedIngredients.join(', ')}</div>`;
            }
            if (custom.addedRecommendations && custom.addedRecommendations.length > 0) {
                const recNames = custom.addedRecommendations.map(r => r.name).join(', ');
                customizationsHTML += `<div class="checkout-customization"><span class="custom-label">+ Add-ons:</span> ${recNames}</div>`;
            }
        }
        
        cartItem.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/60x60?text=No+Image'}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
            <div class="checkout-cart-item-info">
                <h4>${item.name}</h4>
                ${customizationsHTML}
                <p>Quantity: ×${item.quantity || 1}</p>
            </div>
            <div class="checkout-cart-item-price">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
        `;
        cartItemsContainer.appendChild(cartItem);
        console.log('Item appended to cart');
    });
    
    console.log('All items rendered, updating totals...');
    updateCheckoutTotals();
}

// Update totals on checkout page
function updateCheckoutTotals() {
    const cart = JSON.parse(localStorage.getItem('gogoOrderCart') || '[]');
    const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'pickup';
    
    // Calculate subtotal (recommendations are separate items, so just sum all)
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;
    
    const subtotalEl = document.getElementById('subtotal');
    const deliveryFeeEl = document.getElementById('delivery-fee');
    const finalTotalEl = document.getElementById('final-total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (deliveryFeeEl) {
        deliveryFeeEl.textContent = deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Free';
        deliveryFeeEl.style.color = deliveryFee > 0 ? '#666' : '#4caf50';
    }
    if (finalTotalEl) finalTotalEl.textContent = `$${total.toFixed(2)}`;
}

// Handle order type change
function setupOrderTypeToggle() {
    const orderTypeInputs = document.querySelectorAll('input[name="orderType"]');
    const deliveryFields = document.getElementById('delivery-fields');
    const addressInput = document.getElementById('address');
    const phoneInput = document.getElementById('phone');
    
    orderTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const orderType = e.target.value;
            
            if (orderType === 'delivery') {
                if (deliveryFields) deliveryFields.style.display = 'block';
                if (addressInput) addressInput.required = true;
                if (phoneInput) phoneInput.required = true;
            } else {
                if (deliveryFields) deliveryFields.style.display = 'none';
                if (addressInput) {
                    addressInput.required = false;
                    addressInput.value = '';
                }
                if (phoneInput) {
                    phoneInput.required = false;
                    phoneInput.value = '';
                }
            }
            
            updateCheckoutTotals();
        });
    });
}

// Handle form submission
function setupFormSubmission() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cart = JSON.parse(localStorage.getItem('gogoOrderCart') || '[]');
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        const formData = new FormData(form);
        // Calculate subtotal (recommendations are separate items)
        let subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        const orderData = {
            customerName: formData.get('name'),
            orderType: formData.get('orderType'),
            address: formData.get('address') || null,
            phone: formData.get('phone') || null,
            notes: formData.get('notes') || null,
            items: cart.map(item => ({
                ...item,
                customizations: item.customizations || null
            })),
            subtotal: subtotal,
            deliveryFee: formData.get('orderType') === 'delivery' ? DELIVERY_FEE : 0,
            total: 0,
            date: new Date().toISOString()
        };
        
        orderData.total = orderData.subtotal + orderData.deliveryFee;
        
        // Validate required fields
        if (!orderData.customerName) {
            alert('Please enter your name');
            return;
        }
        
        if (orderData.orderType === 'delivery') {
            if (!orderData.address) {
                alert('Please enter your delivery address');
                return;
            }
            if (!orderData.phone) {
                alert('Please enter your phone number');
                return;
            }
        }
        
        // Save order to database
        try {
            const savedOrder = await window.saveOrderToDatabase(orderData);
            console.log('Order saved successfully:', savedOrder);
            
            // Clear cart
            localStorage.removeItem('gogoOrderCart');
            
            // Show success message with order ID
            alert(`Order placed successfully! Order ID: ${savedOrder.order_id}\nThank you for your order.`);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error saving order:', error);
            alert('There was an error placing your order. Please try again.');
        }
    });
}

// Initialize checkout page
function initCheckoutPage() {
    console.log('Initializing checkout page...');
    console.log('Document ready state:', document.readyState);
    
    loadCheckoutCart();
    setupOrderTypeToggle();
    setupFormSubmission();
    updateCheckoutTotals();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired');
        setTimeout(initCheckoutPage, 50);
    });
} else {
    console.log('DOM already ready');
    setTimeout(initCheckoutPage, 50);
}

// Also expose function globally for manual refresh
window.refreshCheckoutCart = function() {
    console.log('Manual cart refresh triggered');
    loadCheckoutCart();
    updateCheckoutTotals();
};

