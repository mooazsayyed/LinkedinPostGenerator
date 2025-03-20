#!/bin/bash

# Update package lists
echo "Updating package lists..."
sudo apt update -y

# Install required system dependencies (for Puppeteer & Chrome)
echo "Installing system dependencies..."
sudo apt install -y wget curl unzip libxss1 libappindicator3-1 fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 libpangocairo-1.0-0 libx11-xcb1

# Install Google Chrome (if needed)
echo "Downloading and installing Google Chrome..."
wget -q -O chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i chrome.deb || sudo apt --fix-broken install -y
rm chrome.deb

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Ensure Puppeteer downloads Chrome
echo "Ensuring Puppeteer has Chrome installed..."
npx puppeteer browsers install chrome

# Start the application
echo "Starting the application..."
npm start
