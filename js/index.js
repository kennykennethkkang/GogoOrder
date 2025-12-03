let menuData = [];
let currentCategory = 'Appetizers';

// Expose menuData globally for modal
window.menuData = menuData;

// Load menu data
async function loadMenu() {
    try {
        const response = await fetch('json/menu.json');
        menuData = await response.json();
        window.menuData = menuData; // Expose globally for modal
        displayMenuItems(currentCategory);
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// Display menu items by category
function displayMenuItems(category) {
    const menuItemsContainer = document.getElementById('menu-items');
    const filteredItems = menuData.filter(item => item.category === category);
    
    menuItemsContainer.innerHTML = '';
    
    if (filteredItems.length === 0) {
        menuItemsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No items found in this category.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        
        // Create star rating (3 stars filled)
        let ratingHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < 3) {
                ratingHTML += '<i class="fa-solid fa-star"></i>';
            } else {
                ratingHTML += '<i class="fa-regular fa-star"></i>';
            }
        }

        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="cursor: pointer;" onclick="window.openItemModal(${item.id}, menuData)">
            <h4 style="cursor: pointer;" onclick="window.openItemModal(${item.id}, menuData)">${item.name}</h4>
            <div class="item-rating">
                ${ratingHTML}
            </div>
            <div class="item-footer">
                <p class="price">$${item.price.toFixed(2)}</p>
                <button class="add-btn" onclick="window.addToCartLocal(${item.id})">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        `;
        
        menuItemsContainer.appendChild(itemCard);
    });
}

// Handle category clicks
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    
    // Wait a bit for cart.js to initialize, then update cart display
    setTimeout(() => {
        if (window.updateCart) {
            console.log('Updating cart on page load');
            window.updateCart();
        } else {
            console.warn('updateCart function not available yet');
        }
    }, 100);
    
    const categoryElements = document.querySelectorAll('.category');
    categoryElements.forEach(category => {
        category.addEventListener('click', () => {
            // Remove active class from all categories
            categoryElements.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked category
            category.classList.add('active');
            
            // Get category name and display items
            currentCategory = category.getAttribute('data-category');
            displayMenuItems(currentCategory);
        });
    });
});

// Add to cart - uses cart.js function
function addItemToCart(itemId) {
    console.log('addItemToCart called with itemId:', itemId);
    console.log('menuData available:', menuData && menuData.length > 0);
    
    if (!menuData || menuData.length === 0) {
        console.error('Menu data not loaded yet');
        alert('Menu is still loading. Please try again in a moment.');
        return;
    }
    
    if (window.addToCart) {
        window.addToCart(itemId, menuData);
        console.log('Item added to cart successfully');
    } else {
        console.error('Cart functions not loaded');
        alert('Cart functionality is not available. Please refresh the page.');
    }
}

// Expose addToCart globally so onclick handlers can access it
window.addToCartLocal = addItemToCart;

