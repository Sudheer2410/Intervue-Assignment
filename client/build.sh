#!/bin/bash
# Build script for Render deployment

echo "Installing dependencies..."
npm ci --only=production

echo "Building React app..."
npm run build

echo "Build completed!" 