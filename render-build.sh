#!/bin/bash

# Exit on any error
set -e

echo "Starting Render build process..."

# Print current directory and list contents
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Check if backend directory exists
if [ -d "backend" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
else
    echo "Warning: backend directory not found"
fi

# Check if frontend directory exists
if [ -d "frontend" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    
    echo "Building frontend..."
    npm run build
    cd ..
else
    echo "Error: frontend directory not found"
    exit 1
fi

echo "Build completed successfully!" 