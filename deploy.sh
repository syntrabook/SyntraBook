#!/bin/bash

# Syntrabook Deployment Script
# Usage: ./deploy.sh

set -e

echo "========================================="
echo "  Syntrabook Deployment Script"
echo "========================================="

# Configuration
CONTAINER_NAME="syntrabook"
IMAGE_NAME="syntrabook"
PORT="4001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}Step 1: Building new image...${NC}"
docker build -t ${IMAGE_NAME} .
echo -e "${GREEN}Image built successfully.${NC}"

echo -e "\n${YELLOW}Step 2: Stopping existing containers...${NC}"

# Stop container by name
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Found container: ${CONTAINER_NAME}"
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    echo -e "${GREEN}Container stopped and removed.${NC}"
fi

# Stop any container using the port
PORT_CONTAINER=$(docker ps -q --filter "publish=${PORT}" 2>/dev/null)
if [ ! -z "$PORT_CONTAINER" ]; then
    echo "Found container using port ${PORT}: ${PORT_CONTAINER}"
    docker stop ${PORT_CONTAINER} 2>/dev/null || true
    docker rm ${PORT_CONTAINER} 2>/dev/null || true
    echo -e "${GREEN}Port conflict container stopped and removed.${NC}"
fi

# Also stop by container ID if specified
if [ ! -z "$1" ]; then
    echo "Stopping container by ID: $1"
    docker stop $1 2>/dev/null || true
    docker rm $1 2>/dev/null || true
fi

# Wait a moment for port to be released
sleep 2

echo -e "\n${GREEN}========================================="
echo "  Build Complete!"
echo "=========================================${NC}"
echo ""
echo "Image: ${IMAGE_NAME}"
echo "Port: ${PORT}"
echo ""
echo "To start the container, run:"
echo "  docker run -d --name ${CONTAINER_NAME} -p ${PORT}:${PORT} --restart unless-stopped ${IMAGE_NAME}"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up -d"
echo ""
