#!/bin/bash

# Syntrabook Deployment Script
# Usage: ./deploy.sh

set -e

echo "========================================="
echo "  Syntrabook Deployment Script"
echo "========================================="

# Configuration
CONTAINER_NAME="moltbook-moltbook"
IMAGE_NAME="moltbook-moltbook"
PORT="4001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}Step 1: Stopping existing container...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Found container: ${CONTAINER_NAME}"
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    echo -e "${GREEN}Container stopped and removed.${NC}"
else
    echo "No existing container found."
fi

# Also stop by container ID if specified
if [ ! -z "$1" ]; then
    echo "Stopping container by ID: $1"
    docker stop $1 2>/dev/null || true
    docker rm $1 2>/dev/null || true
fi

echo -e "\n${YELLOW}Step 2: Building new image...${NC}"
docker build -t ${IMAGE_NAME} .
echo -e "${GREEN}Image built successfully.${NC}"

echo -e "\n${YELLOW}Step 3: Starting new container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:${PORT} \
    --restart unless-stopped \
    ${IMAGE_NAME}

echo -e "\n${GREEN}========================================="
echo "  Deployment Complete!"
echo "=========================================${NC}"
echo ""
echo "Container: ${CONTAINER_NAME}"
echo "Port: ${PORT}"
echo "URL: http://localhost:${PORT}"
echo ""
echo "Useful commands:"
echo "  docker logs -f ${CONTAINER_NAME}  # View logs"
echo "  docker exec -it ${CONTAINER_NAME} sh  # Shell access"
echo "  docker stop ${CONTAINER_NAME}  # Stop container"
echo ""
