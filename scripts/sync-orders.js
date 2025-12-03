// Script to sync orders from localStorage to orders.json
// Run this with: node scripts/sync-orders.js
// Note: This requires orders to be exported from browser console first

const fs = require('fs');
const path = require('path');

const ordersJsonPath = path.join(__dirname, '../json/orders.json');

// This function would be called from the browser console to export orders
// Copy and paste this into browser console after placing an order:
/*
const orders = JSON.parse(localStorage.getItem('gogoOrders') || '[]');
console.log('Copy this JSON and save to orders.json:', JSON.stringify(orders, null, 2));
*/

// Function to merge new orders into existing orders.json
function syncOrders(newOrders) {
    try {
        // Read existing orders
        let existingOrders = [];
        if (fs.existsSync(ordersJsonPath)) {
            const fileContent = fs.readFileSync(ordersJsonPath, 'utf8');
            existingOrders = JSON.parse(fileContent);
        }
        
        // Merge orders (avoid duplicates by order_id)
        const orderIds = new Set(existingOrders.map(o => o.order_id));
        newOrders.forEach(newOrder => {
            if (!orderIds.has(newOrder.order_id)) {
                existingOrders.push(newOrder);
                orderIds.add(newOrder.order_id);
            }
        });
        
        // Sort by timestamp (newest first)
        existingOrders.sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateB - dateA;
        });
        
        // Write back to file
        fs.writeFileSync(ordersJsonPath, JSON.stringify(existingOrders, null, 2));
        console.log(`Successfully synced ${newOrders.length} new orders to orders.json`);
        console.log(`Total orders: ${existingOrders.length}`);
        
    } catch (error) {
        console.error('Error syncing orders:', error);
    }
}

// If run directly, expect orders as command line argument
if (require.main === module) {
    const newOrdersJson = process.argv[2];
    if (newOrdersJson) {
        try {
            const newOrders = JSON.parse(newOrdersJson);
            syncOrders(newOrders);
        } catch (error) {
            console.error('Invalid JSON provided:', error);
        }
    } else {
        console.log('Usage: node sync-orders.js \'[{"order_id": 1003, ...}]\'');
        console.log('Or copy orders from browser console and paste as argument');
    }
}

module.exports = { syncOrders };

