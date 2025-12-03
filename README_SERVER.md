# How to Run GogoOrder with PHP Backend

## ⚠️ IMPORTANT: You MUST use PHP server, NOT Live Server!

Live Server (port 5500) **cannot execute PHP** and will give you 405 errors.

## Quick Start

### Option 1: Use the Start Script (Easiest)

1. Double-click `start-server.sh` (Mac/Linux)
   - Or run in terminal: `./start-server.sh`

2. Open browser to: **http://localhost:8000**

### Option 2: Manual PHP Server

1. Open Terminal
2. Navigate to project:
   ```bash
   cd /Users/yumiko/Desktop/GogoOrder
   ```
3. Start PHP server:
   ```bash
   php -S localhost:8000
   ```
4. Open browser to: **http://localhost:8000**

## Testing

1. **Test PHP is working:**
   - Visit: http://localhost:8000/api/test.php
   - Should show file permissions info

2. **Test API endpoint:**
   - Visit: http://localhost:8000/api/test-save.php
   - Should show "PHP is working"

3. **Place an order:**
   - Go to: http://localhost:8000
   - Add items to cart
   - Click Checkout
   - Fill form and place order
   - Check `json/orders.json` - order should be there!

## Troubleshooting

### Still getting 405 error?
- ✅ Make sure you're using **http://localhost:8000** (PHP server)
- ❌ NOT **http://127.0.0.1:5500** (Live Server)

### PHP not found?
- Install PHP: `brew install php` (Mac)
- Or use XAMPP/MAMP/WAMP

### Port 8000 already in use?
- Use different port: `php -S localhost:8080`
- Update the port in the script

## Stop the Server

Press `Ctrl+C` in the terminal where PHP server is running.

