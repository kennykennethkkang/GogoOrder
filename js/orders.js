// Order management - saves orders to orders.json
const ORDERS_API_URL = 'json/orders.json';

// Generate unique order ID
function generateOrderId() {
    // Get the highest existing order ID and increment
    const existingOrders = JSON.parse(localStorage.getItem('gogoOrders') || '[]');
    if (existingOrders.length === 0) {
        return 1001;
    }
    const maxId = Math.max(...existingOrders.map(o => o.order_id || 0));
    return maxId >= 1001 ? maxId + 1 : 1001;
}

// Format order data to match orders.json structure
function formatOrderForDatabase(orderData) {
    const orderId = generateOrderId();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    return {
        order_id: orderId,
        name: orderData.customerName,
        phone: orderData.phone || "",
        type: orderData.orderType,
        address: orderData.address || "",
        items: orderData.items.map(item => {
            const itemData = {
                id: item.id,
                name: item.name,
                qty: item.quantity,
                price: item.price
            };
            // Add customizations if they exist
            if (item.customizations) {
                itemData.customizations = item.customizations;
            }
            return itemData;
        }),
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        notes: orderData.notes || "",
        status: "Pending",
        timestamp: timestamp
    };
}

// Save order to database (orders.json)
async function saveOrderToDatabase(orderData) {
    try {
        // Format the order
        const formattedOrder = formatOrderForDatabase(orderData);
        
        // Read existing orders from orders.json
        let existingOrders = [];
        try {
            const response = await fetch(ORDERS_API_URL);
            existingOrders = await response.json();
        } catch (error) {
            console.warn('Could not read orders.json, starting with empty array');
            existingOrders = [];
        }
        
        // Add new order
        existingOrders.push(formattedOrder);
        
        // Save to localStorage as backup
        localStorage.setItem('gogoOrders', JSON.stringify(existingOrders));
        
        // Check if using Live Server (which doesn't support PHP)
        const currentPort = window.location.port;
        if (currentPort === '5500' || window.location.hostname === '127.0.0.1' && currentPort === '5500') {
            console.error('❌ ERROR: You are using Live Server (port 5500) which does NOT support PHP!');
            console.error('📢 You MUST use PHP server instead:');
            console.error('   1. Stop Live Server');
            console.error('   2. Run: php -S localhost:8000');
            console.error('   3. Open: http://localhost:8000');
            alert('❌ ERROR: Live Server does not support PHP!\n\nPlease:\n1. Stop Live Server\n2. Run: php -S localhost:8000\n3. Open: http://localhost:8000\n\nOr double-click start-server.sh');
            throw new Error('Using Live Server - PHP not supported');
        }
        
        // Try to save to backend API (PHP endpoint)
        try {
            console.log('📤 Sending order to PHP backend...');
            console.log('Current URL:', window.location.href);
            console.log('Order data:', formattedOrder);
            
            // Try different paths in case of path issues
            const apiPath = 'api/save-order.php';
            console.log('API path:', apiPath);
            
            const response = await fetch(apiPath, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formattedOrder),
                mode: 'cors',
                credentials: 'omit'
            });
            
            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);
            
            const responseText = await response.text();
            console.log('📥 Response text:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error('Invalid response from server: ' + responseText);
            }
            
            if (response.ok && result.success) {
                console.log('✅ Order saved to database (json/orders.json) via PHP backend');
                console.log('Order ID:', result.order_id);
            } else {
                console.error('❌ API error:', result);
                throw new Error(result.error || 'API returned error');
            }
        } catch (apiError) {
            // API not available or error occurred
            console.error('❌ Error saving to backend:', apiError);
            console.error('Error details:', apiError.message);
            console.log('📦 Order saved to localStorage as backup');
            console.log('New order:', formattedOrder);
            console.log('All orders:', existingOrders);
            
            // Make orders available globally for manual export
            window.lastOrder = formattedOrder;
            window.allOrders = existingOrders;
            
            // Provide export function as fallback
            window.exportOrders = function() {
                const ordersJson = JSON.stringify(existingOrders, null, 2);
                const blob = new Blob([ordersJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'orders.json';
                a.click();
                URL.revokeObjectURL(url);
                console.log('✅ Orders exported!');
                console.log('📁 File downloaded. Copy it to: json/orders.json');
                alert('Backend unavailable. Orders exported! Check your downloads folder and copy orders.json to json/orders.json');
            };
            
            // Show helpful message
            console.warn('⚠️ Backend API not available. Order saved to localStorage only.');
            console.log('💾 To save to json/orders.json, run: window.exportOrders()');
            console.log('📋 Or copy this: JSON.stringify(window.allOrders, null, 2)');
        }
        
        return formattedOrder;
        
    } catch (error) {
        console.error('Error saving order to database:', error);
        throw error;
    }
}

// Get all orders (combines orders.json and localStorage)
async function getAllOrders() {
    try {
        const response = await fetch(ORDERS_API_URL);
        const fileOrders = await response.json();
        const localOrders = JSON.parse(localStorage.getItem('gogoOrders') || '[]');
        
        // Merge and deduplicate by order_id
        const allOrders = [...fileOrders];
        localOrders.forEach(localOrder => {
            if (!allOrders.find(o => o.order_id === localOrder.order_id)) {
                allOrders.push(localOrder);
            }
        });
        
        // Sort by timestamp (newest first)
        return allOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('gogoOrders') || '[]');
    }
}

// Get order by ID
async function getOrderById(orderId) {
    const orders = await getAllOrders();
    return orders.find(order => order.order_id === orderId);
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    // In production, this would be an API call:
    // await fetch(`/api/orders/${orderId}`, {
    //     method: 'PATCH',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ status: newStatus })
    // });
    
    const orders = JSON.parse(localStorage.getItem('gogoOrders') || '[]');
    const orderIndex = orders.findIndex(order => order.order_id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('gogoOrders', JSON.stringify(orders));
    }
}

// Expose functions globally
window.saveOrderToDatabase = saveOrderToDatabase;
window.getAllOrders = getAllOrders;
window.getOrderById = getOrderById;
window.updateOrderStatus = updateOrderStatus;

