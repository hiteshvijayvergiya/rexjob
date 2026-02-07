#!/bin/bash

# RexJobs Node.js Installation Script
echo "╔═══════════════════════════════════════╗"
echo "║   RexJobs Installation Script         ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required!"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client not found in PATH"
    echo "Please ensure MySQL 8.0+ is installed"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   Next Steps:                         ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "1. Edit .env file with your settings:"
echo "   nano .env"
echo ""
echo "2. Configure database credentials"
echo ""
echo "3. Run migrations:"
echo "   npm run migrate:latest"
echo ""
echo "4. Start the server:"
echo "   npm run dev"
echo ""
echo "5. Visit: http://localhost:3000"
echo ""
echo "✨ Installation complete!"
