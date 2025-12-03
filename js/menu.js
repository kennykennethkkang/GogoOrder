let menuData = [];
let currentCategory = 'all';

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
    let filteredItems = menuData;
    
    if (category !== 'all') {
        filteredItems = menuData.filter(item => item.category === category);
    }
    
    menuItemsContainer.innerHTML = '';
    
    if (filteredItems.length === 0) {
        menuItemsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No items found.</p>';
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
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/120x120?text=No+Image'" style="cursor: pointer;" onclick="window.openItemModal(${item.id}, menuData)">
            <h4 style="cursor: pointer;" onclick="window.openItemModal(${item.id}, menuData)">${item.name}</h4>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${item.description}</p>
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

// Search functionality
function searchMenu(searchTerm) {
    const menuItemsContainer = document.getElementById('menu-items');
    const searchLower = searchTerm.toLowerCase();
    
    let filteredItems = menuData;
    
    if (currentCategory !== 'all') {
        filteredItems = menuData.filter(item => item.category === currentCategory);
    }
    
    filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
    );
    
    menuItemsContainer.innerHTML = '';
    
    if (filteredItems.length === 0) {
        menuItemsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No items found matching your search.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        
        let ratingHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < 3) {
                ratingHTML += '<i class="fa-solid fa-star"></i>';
            } else {
                ratingHTML += '<i class="fa-regular fa-star"></i>';
            }
        }

        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/120x120?text=No+Image'" style="cursor: pointer;" onclick="window.openItemModal(${item.id}, menuData)">
            <h4 style="cursor: pointer;" onclick="window.openItemModal(${item.id}, menuData)">${item.name}</h4>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${item.description}</p>
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    
    // Category filter
    const categoryElements = document.querySelectorAll('.category');
    categoryElements.forEach(category => {
        category.addEventListener('click', () => {
            categoryElements.forEach(cat => cat.classList.remove('active'));
            category.classList.add('active');
            currentCategory = category.getAttribute('data-category');
            displayMenuItems(currentCategory);
            
            // Clear search when category changes
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = '';
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                displayMenuItems(currentCategory);
            } else {
                searchMenu(e.target.value);
            }
        });
    }
});

