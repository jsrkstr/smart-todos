#!/bin/bash
# Build script for Smart Todos sandbox Docker image
# Run this script to build the sandbox image before using code execution

set -e

echo "Building Smart Todos sandbox Docker image..."
docker build -f Dockerfile.sandbox -t smart-todos-sandbox:latest .

echo ""
echo "✅ Sandbox image built successfully!"
echo ""
echo "Image: smart-todos-sandbox:latest"
echo ""
echo "To verify the image:"
echo "  docker images | grep smart-todos-sandbox"
echo ""
echo "To test the image:"
echo "  docker run --rm smart-todos-sandbox:latest node --version"
