#!/bin/bash

set -e  # Exit on any error

echo "=== Starting Build Process ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install and build frontend
echo "Installing frontend dependencies..."
cd frontend
npm install
echo "Building frontend..."
npm run build

# Verify build was created
if [ ! -d "build" ]; then
    echo "ERROR: Build directory was not created!"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "ERROR: index.html was not created in build directory!"
    exit 1
fi

echo "Frontend build verified successfully"
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install ML-LLM system requirements
echo "Installing ML-LLM system requirements..."
cd backend/ML-LLM-hybrid-recommendation-system
pip install -r requirements.txt
cd ../..

echo "=== Build Complete ===" 