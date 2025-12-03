// Node.js/Express API endpoint example to save orders to orders.json
// Install: npm install express
// Run: node api/save-order.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('../')); // Serve static files

const ordersFile = path.join(__dirname, '../json/orders.json');

// POST endpoint to save order
app.post('/api/orders', (req, res) => {
    try {
        const newOrder = req.body;
        
        // Read existing orders
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            const fileContent = fs.readFileSync(ordersFile, 'utf8');
            orders = JSON.parse(fileContent);
        }
        
        // Add new order
        orders.push(newOrder);
        
        // Write back to file
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        
        res.json({ success: true, order_id: newOrder.order_id });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// GET endpoint to retrieve all orders
app.get('/api/orders', (req, res) => {
    try {
        if (fs.existsSync(ordersFile)) {
            const fileContent = fs.readFileSync(ordersFile, 'utf8');
            const orders = JSON.parse(fileContent);
            res.json(orders);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error reading orders:', error);
        res.status(500).json({ error: 'Failed to read orders' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Order API server running on http://localhost:${PORT}`);
    console.log(`POST /api/orders - Save new order`);
    console.log(`GET /api/orders - Get all orders`);
});

