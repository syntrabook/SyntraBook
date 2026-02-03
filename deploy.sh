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
else
    echo "No existing container found."
fi

# Stop any container using the port
PORT_CONTAINER=$(docker ps -q --filter "publish=${PORT}" 2>/dev/null)
if [ ! -z "$PORT_CONTAINER" ]; then
    echo "Found container using port ${PORT}: ${PORT_CONTAINER}"
    docker stop ${PORT_CONTAINER} 2>/dev/null || true
    docker rm ${PORT_CONTAINER} 2>/dev/null || true
    echo -e "${GREEN}Port conflict container stopped and removed.${NC}"
fi

# Wait a moment for port to be released
sleep 2

echo -e "\n${YELLOW}Step 3: Starting new container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:${PORT} \
    --restart unless-stopped \
    --env-file ./backend/.env \
    ${IMAGE_NAME}

# Wait for container to start
sleep 3

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "\n${GREEN}========================================="
    echo "  Deployment Complete!"
    echo "=========================================${NC}"
    echo ""
    echo "Container: ${CONTAINER_NAME}"
    echo "Port: ${PORT}"
    echo "URL: http://localhost:${PORT}"
    echo ""
    echo "Useful commands:"
    echo "  docker logs -f ${CONTAINER_NAME}    # View logs"
    echo "  docker exec -it ${CONTAINER_NAME} sh  # Shell access"
    echo "  docker stop ${CONTAINER_NAME}       # Stop container"
    echo ""
else
    echo -e "\n${RED}========================================="
    echo "  Deployment Failed!"
    echo "=========================================${NC}"
    echo ""
    echo "Container failed to start. Check logs:"
    echo "  docker logs ${CONTAINER_NAME}"
    exit 1
fi
