#!/bin/bash

# Bash Script to Get Token for Testing

echo "=== Getting Token for Testing ==="
echo ""

# Step 1: Try to Register (will fail if user exists, that's okay)
echo "Step 1: Registering new user..."
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456",
    "role": "admin",
    "department": "IT",
    "designation": "Developer"
  }' > /dev/null 2>&1

echo "Step 2: Logging in to get token..."
echo ""

# Step 2: Login to Get Token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }')

# Extract token using jq (if available) or grep
if command -v jq &> /dev/null; then
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
else
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Error: Could not get token"
    echo ""
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "Make sure:"
    echo "1. Server is running on http://localhost:3000"
    echo "2. MongoDB is connected"
    echo "3. User exists (try registering first)"
    exit 1
fi

echo "=== TOKEN RECEIVED ==="
echo ""
echo "$TOKEN"
echo ""
echo "=== Copy this token and use it in your API requests ==="
echo ""
echo "Example curl command:"
echo "curl -X POST http://localhost:3000/api/work-locations \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"name\":\"Test Office\",\"latitude\":22.3072,\"longitude\":73.1812,\"radius\":100.0}'"
echo ""

# Save token to file
echo "$TOKEN" > token.txt
echo "Token also saved to token.txt file"

