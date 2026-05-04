#!/bin/bash

# Configuration
TEST_PORT=3002
PROD_PORT=3001
TEST_URL="http://127.0.0.1:$TEST_PORT"
PROD_URL="http://127.0.0.1:$PROD_PORT"

echo "--------------------------------------------------"
echo "Checking Deployment Status..."
echo "--------------------------------------------------"

# 1. Check if containers are running
if [ "$(docker ps -q -f name=currency_web_docker_test)" ]; then
    echo "✅ Docker Container 'currency_web_docker_test' is RUNNING."
else
    echo "❌ Docker Container 'currency_web_docker_test' is NOT running."
    exit 1
fi

# 2. Check if Production PM2 is still running
if curl -I -s "$PROD_URL" | grep -q "HTTP/1.1 200\|HTTP/1.1 302\|HTTP/2 200"; then
    echo "✅ Production app on port $PROD_PORT is still ACTIVE."
else
    echo "❌ WARNING: Production app on port $PROD_PORT seems DOWN!"
fi

# 3. Check if Test Docker app is responding
if curl -I -s "$TEST_URL" | grep -q "HTTP/1.1 200\|HTTP/1.1 302\|HTTP/2 200"; then
    echo "✅ Test Docker app on port $TEST_PORT is responding."
else
    echo "❌ Test Docker app on port $TEST_PORT is NOT responding."
    exit 1
fi

# 4. Check API connectivity and Shared Uploads
echo "--------------------------------------------------"
echo "Testing Shared Media Access..."
# Find a sample media file path from the database if possible, or use a placeholder
SAMPLE_MEDIA="/api/uploads/test-placeholder.webm"
MEDIA_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "$TEST_URL$SAMPLE_MEDIA")

if [ "$MEDIA_STATUS" == "200" ]; then
    echo "✅ Shared uploads mount is working (returned 200)."
elif [ "$MEDIA_STATUS" == "404" ]; then
    echo "ℹ️  Shared uploads mount check: 404 (Normal if no test-placeholder exists, but path is reachable)."
else
    echo "❌ Shared uploads mount check failed (Status: $MEDIA_STATUS)."
fi

echo "--------------------------------------------------"
echo "Validation Complete."
