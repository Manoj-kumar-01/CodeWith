#!/bin/bash

echo "🚀 Starting CodeWith? Platform..."

# 1. Stop native Redis to avoid port conflicts
echo "🛑 Stopping native services..."
sudo systemctl stop redis-server 2>/dev/null

# 2. Start Docker Infrastructure
echo "🐳 Starting Docker containers (Compiler, DBs)..."
cd compiler && docker compose up -d
cd ..

# 3. Start Main Server with PM2
echo "⚡ Starting Main Server with PM2..."
pm2 restart codewith-main || pm2 start server.js --name "codewith-main"

echo "✅ All systems are online!"
echo "------------------------------------------------"
echo "Main Website: http://localhost:3000"
echo "Compiler:     http://localhost:3001"
echo "------------------------------------------------"
echo "Use 'pm2 logs' to see live activity."
