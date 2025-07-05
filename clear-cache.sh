#!/bin/bash

# Clear Cache Script for Render Deployment
# This script helps clear various caches that might be causing issues

echo "🧹 Clearing caches for Render deployment..."

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Clear node_modules and reinstall
echo "Removing node_modules..."
rm -rf node_modules
rm -rf frontend/node_modules

# Clear package-lock files
echo "Removing package-lock files..."
rm -f package-lock.json
rm -f frontend/package-lock.json

# Clear build artifacts
echo "Clearing build artifacts..."
rm -rf frontend/build
rm -rf backend/dist

# Clear Python cache
echo "Clearing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Clear any temporary files
echo "Clearing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install
cd frontend && npm install && cd ..

echo "✅ Cache clearing complete!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. In Render dashboard, go to your service"
echo "3. Click 'Manual Deploy' → 'Clear build cache & deploy'"
echo "4. Or trigger a new deployment from your Git repository"
echo ""
echo "This will ensure a fresh deployment with no cached issues." 