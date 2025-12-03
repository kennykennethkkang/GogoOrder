#!/bin/bash
# Script to start PHP server for GogoOrder

echo "🚀 Starting PHP server for GogoOrder..."
echo "📍 Server will run at: http://localhost:8000"
echo "📝 Open this URL in your browser instead of Live Server"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
php -S localhost:8000

