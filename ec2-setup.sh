#!/bin/bash
# Run this on your EC2 instance

# Create directories
sudo mkdir -p /var/www/html/poolpay
sudo mkdir -p /var/www/html/integration

# Set permissions
sudo chown -R $USER:$USER /var/www/html/poolpay
sudo chown -R $USER:$USER /var/www/html/integration

# Install dependencies if needed
sudo apt update
sudo apt install -y nginx

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx