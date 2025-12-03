// Item Modal functionality
let currentItem = null;
let selectedIngredients = [];
let selectedRecommendations = [];

// Open item modal
function openItemModal(itemId, menuData) {
    const item = menuData.find(i => i.id === itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }
    
    currentItem = item;
    selectedIngredients = item.ingredients ? item.ingredients.map(ing => ing.name) : [];
    selectedRecommendations = [];
    
    const modal = document.getElementById('item-modal');
    if (!modal) {
        createModal();
    }
    
    displayItemDetails(item, menuData);
    document.getElementById('item-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Create modal HTML
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'item-modal';
    modal.className = 'item-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeItemModal()">
                <i class="fa-solid fa-times"></i>
            </button>
            <div id="modal-item-details"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeItemModal();
        }
    });
}

// Display item details in modal
function displayItemDetails(item, menuData) {
    const modalDetails = document.getElementById('modal-item-details');
    if (!modalDetails) return;
    
    // Get recommendations from menu data
    const recommendations = item.recommendations ? item.recommendations.map(rec => {
        const fullItem = menuData.find(m => m.id === rec.id);
        return fullItem ? {...rec, image: fullItem.image, description: fullItem.description} : rec;
    }) : [];
    
    let ingredientsHTML = '';
    if (item.ingredients && item.ingredients.length > 0) {
        ingredientsHTML = `
            <div class="modal-section">
                <h3>Customize Ingredients</h3>
                <p class="section-subtitle">Uncheck items you'd like to remove</p>
                <div class="ingredients-list">
                    ${item.ingredients.map((ing, index) => `
                        <label class="ingredient-item ${!ing.removable ? 'required' : ''}">
                            <input type="checkbox" 
                                   ${!ing.removable ? 'checked disabled' : 'checked'} 
                                   data-ingredient="${ing.name}"
                                   onchange="toggleIngredient('${ing.name}')">
                            <span class="checkmark"></span>
                            <span class="ingredient-name">${ing.name}</span>
                            ${!ing.removable ? '<span class="required-badge">Required</span>' : ''}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let recommendationsHTML = '';
    if (recommendations.length > 0) {
        recommendationsHTML = `
            <div class="modal-section recommendations-section">
                <h3>Recommended Add-ons</h3>
                <div class="recommendations-grid">
                    ${recommendations.map(rec => `
                        <div class="recommendation-card" data-rec-id="${rec.id}">
                            <img src="${rec.image || 'https://via.placeholder.com/80x80'}" alt="${rec.name}" onerror="this.src='https://via.placeholder.com/80x80'">
                            <div class="rec-info">
                                <h4>${rec.name}</h4>
                                <p class="rec-type">${rec.type === 'side' ? 'Side' : 'Beverage'}</p>
                                <p class="rec-price">$${rec.price.toFixed(2)}</p>
                            </div>
                            <button class="add-rec-btn" onclick="toggleRecommendation(${rec.id}, '${rec.name}', ${rec.price})">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    const totalPrice = calculateModalTotal(item, recommendations);
    
    modalDetails.innerHTML = `
        <div class="modal-header">
            <img src="${item.image}" alt="${item.name}" class="modal-item-image">
            <div class="modal-header-info">
                <h2>${item.name}</h2>
                <p class="modal-description">${item.description}</p>
                <div class="modal-price">$${item.price.toFixed(2)}</div>
            </div>
        </div>
        
        ${ingredientsHTML}
        
        ${recommendationsHTML}
        
        <div class="modal-footer">
            <div class="modal-total">
                <span>Total:</span>
                <strong>$${totalPrice.toFixed(2)}</strong>
            </div>
            <button class="add-to-cart-modal-btn" onclick="addCustomizedItemToCart()">
                <i class="fa-solid fa-cart-plus"></i>
                Add to Cart
            </button>
        </div>
    `;
}

// Toggle ingredient
function toggleIngredient(ingredientName) {
    const index = selectedIngredients.indexOf(ingredientName);
    if (index > -1) {
        selectedIngredients.splice(index, 1);
    } else {
        selectedIngredients.push(ingredientName);
    }
}

// Toggle recommendation
function toggleRecommendation(recId, recName, recPrice) {
    const index = selectedRecommendations.findIndex(r => r.id === recId);
    const btn = event.target.closest('.add-rec-btn');
    
    if (index > -1) {
        selectedRecommendations.splice(index, 1);
        btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btn.classList.remove('added');
    } else {
        selectedRecommendations.push({id: recId, name: recName, price: recPrice});
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.classList.add('added');
    }
    
    updateModalTotal();
}

// Calculate modal total
function calculateModalTotal(item, recommendations) {
    let total = item.price;
    selectedRecommendations.forEach(rec => {
        total += rec.price;
    });
    return total;
}

// Update modal total
function updateModalTotal() {
    if (!currentItem) return;
    
    const recommendations = currentItem.recommendations || [];
    const total = calculateModalTotal(currentItem, recommendations);
    
    const totalEl = document.querySelector('.modal-total strong');
    if (totalEl) {
        totalEl.textContent = `$${total.toFixed(2)}`;
    }
}

// Add customized item to cart
function addCustomizedItemToCart() {
    if (!currentItem) return;
    
    // Get menu data
    const menuData = window.menuData || [];
    if (!menuData || menuData.length === 0) {
        console.error('Menu data not available');
        return;
    }
    
    // Calculate removed ingredients
    const allIngredientNames = currentItem.ingredients 
        ? currentItem.ingredients.map(ing => ing.name)
        : [];
    const removedIngredients = allIngredientNames.filter(name => !selectedIngredients.includes(name));
    
    // Create customizations object
    const customizations = {
        removedIngredients: removedIngredients,
        addedRecommendations: selectedRecommendations.map(rec => ({
            id: rec.id,
            name: rec.name,
            price: rec.price
        }))
    };
    
    if (window.addToCart) {
        // Add main item with customizations
        window.addToCart(currentItem.id, menuData, customizations);
        
        // Add recommendations separately (they're tracked in customizations)
        selectedRecommendations.forEach(rec => {
            window.addToCart(rec.id, menuData);
        });
        
        closeItemModal();
        
        // Show success message
        showNotification('Items added to cart!');
    } else {
        console.error('Cart function not available');
    }
}

// Close modal
function closeItemModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    currentItem = null;
    selectedIngredients = [];
    selectedRecommendations = [];
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Expose functions globally
window.openItemModal = openItemModal;
window.closeItemModal = closeItemModal;
window.toggleIngredient = toggleIngredient;
window.toggleRecommendation = toggleRecommendation;
window.addCustomizedItemToCart = addCustomizedItemToCart;

