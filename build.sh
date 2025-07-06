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

# Install ML-LLM system requirements (only if Python is available)
echo "Checking for Python and installing ML-LLM system requirements..."
if command -v python3 &> /dev/null; then
    echo "Python3 found, installing ML requirements..."
    cd backend/ML-LLM-hybrid-recommendation-system
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    else
        echo "WARNING: requirements.txt not found in ML-LLM-hybrid-recommendation-system"
    fi
    cd ../..
    
    # Install scraper dependencies
    echo "Installing scraper dependencies..."
    cd backend
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    else
        echo "WARNING: requirements.txt not found in backend directory"
    fi
    cd ..
elif command -v python &> /dev/null; then
    echo "Python found, installing ML requirements..."
    cd backend/ML-LLM-hybrid-recommendation-system
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        echo "WARNING: requirements.txt not found in ML-LLM-hybrid-recommendation-system"
    fi
    cd ../..
    
    # Install scraper dependencies
    echo "Installing scraper dependencies..."
    cd backend
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        echo "WARNING: requirements.txt not found in backend directory"
    fi
    cd ..
else
    echo "WARNING: Python not found. ML features may not work properly."
fi

echo "=== Build Complete ==="
echo "Build artifacts:"
echo "- Frontend build: frontend/build/"
echo "- Backend: backend/"
echo "- Root dependencies: node_modules/" 