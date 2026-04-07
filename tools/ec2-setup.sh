#!/bin/bash
# CodeWith Compiler Setup Script for AWS EC2 Ubuntu (Free Tier)
# This script installs Docker, Node.js, and PM2, then prepares your compiler microservice

echo "🚀 Starting CodeWith Compiler Backend setup on AWS EC2..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Node.js (v18 - LTS)
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Add current user to docker group (so you don't need sudo for docker)
sudo usermod -aG docker $USER

# 5. Install PM2 globally (Process Manager to keep NodeJS running in the background)
echo "♾️ Installing PM2..."
sudo npm install -g pm2

# 6. Prepare directories
echo "📂 Preparing compiler directories..."
mkdir -p -m 777 /tmp/compiler
mkdir -p ~/codewith-compiler/backend

echo "========================================================="
echo "✅ Prerequisites installed successfully!"
echo "⚠️ IMPORTANT: You must log out and log back in for Docker permissions to take effect!"
echo ""
echo "Next steps after reconnecting to SSH:"
echo "1. Clone/Upload your compiler backend code to ~/codewith-compiler/backend"
echo "2. cd ~/codewith-compiler/backend"
echo "3. npm install"
echo "4. pm2 start server.js --name \"compiler\""
echo "5. pm2 save"
echo "========================================================="
