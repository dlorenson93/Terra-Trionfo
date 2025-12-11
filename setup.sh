#!/bin/bash

# Terra Trionfo Setup Script
# This script helps you set up the Terra Trionfo application

set -e

echo "🌾 Terra Trionfo Setup Script"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is accessible
echo ""
echo "📦 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found in PATH"
    echo "   Make sure PostgreSQL is installed and accessible"
else
    echo "✅ PostgreSQL client found"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found!"
    echo "   Copying .env.example to .env..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and update your database credentials!"
    echo "   File location: $(pwd)/.env"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Run Prisma migrations
echo ""
echo "🗃️  Setting up database..."
npm run prisma:migrate

# Seed the database
echo ""
echo "🌱 Seeding database with sample data..."
npm run prisma:seed

# Success message
echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 You can now start the development server with:"
echo "   npm run dev"
echo ""
echo "📝 Test credentials:"
echo "   Admin:    admin@terratrionfo.com / password123"
echo "   Vendor:   vendor@example.com / password123"
echo "   Consumer: consumer@example.com / password123"
echo ""
echo "🌐 The app will be available at: http://localhost:3000"
echo ""
