#!/bin/bash

# Exit on any error
set -e

echo "Starting build process..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "Building frontend..."
npx react-scripts build
cd ..

echo "Build completed successfully!" 