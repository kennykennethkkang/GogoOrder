# Order Management System

This application saves orders to `json/orders.json`. Since browsers cannot directly write to files, there are several options:

## Option 1: Backend API (Recommended)

### PHP Setup
1. Place `api/save-order.php` on your web server
2. The orders will automatically be saved to `json/orders.json` when placed

### Node.js Setup
1. Install dependencies: `npm install express`
2. Run the server: `node api/save-order.js`
3. The API will be available at `http://localhost:3000/api/orders`

## Option 2: Manual Export (Frontend Only)

If you don't have a backend:

1. After placing an order, open the browser console
2. Run: `window.exportOrders()`
3. This will download `orders.json`
4. Replace `json/orders.json` with the downloaded file

Or manually:
1. Open browser console after placing an order
2. Copy the orders: `JSON.stringify(window.allOrders, null, 2)`
3. Paste into `json/orders.json`

## Option 3: Sync Script

Use the Node.js sync script:
1. Export orders from browser console
2. Run: `node scripts/sync-orders.js '[{"order_id": 1003, ...}]'`

## Order Format

Orders are saved in this format:
```json
{
  "order_id": 1003,
  "name": "Customer Name",
  "phone": "555-1234",
  "type": "pickup" or "delivery",
  "address": "123 Street" (if delivery),
  "items": [
    {
      "id": 1,
      "name": "Item Name",
      "qty": 1,
      "price": 12.99,
      "customizations": {
        "removedIngredients": ["Ingredient1"],
        "addedRecommendations": [{"id": 13, "name": "Side", "price": 4.99}]
      }
    }
  ],
  "subtotal": 12.99,
  "deliveryFee": 0 or 3.99,
  "total": 12.99,
  "notes": "Special instructions",
  "status": "Pending",
  "timestamp": "2025-02-10 14:30:00"
}
```

