#!/bin/bash
set -e

echo "🚀 Publishing @keyclaim/sdk to npm..."

# Navigate to SDK directory
cd "$(dirname "$0")"

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    echo "❌ Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the package
echo "🔨 Building package..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish --access public

echo "✅ Successfully published @keyclaim/sdk to npm!"
echo "📦 Package: https://www.npmjs.com/package/@keyclaim/sdk"
