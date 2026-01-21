#!/bin/bash

# Templates API Integration Test Script
# Tests all 5 template endpoints

echo "🧪 CLM Templates API Integration Test"
echo "======================================"
echo ""

# Check if backend is running
echo "📡 Checking backend server..."
if ! curl -s http://127.0.0.1:8000/api/v1/templates/types/ > /dev/null 2>&1; then
    echo "❌ Backend server is not running on port 8000"
    echo "Please start the backend server first:"
    echo "  cd backend && python manage.py runserver 8000"
    exit 1
fi
echo "✅ Backend server is running"
echo ""

# Get authentication token via API login
echo "🔑 Getting authentication token..."

# Try to login with test user credentials
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}')

# Extract access token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "Make sure the test user exists. Run:"
    echo "  cd ../../CLM_Backend"
    echo "  python manage.py shell -c \"from authentication.models import User; User.objects.create_user(email='test@example.com', password='testpass123', first_name='Test', last_name='User')\""
    exit 1
fi
echo "✅ Token obtained"
echo ""

# Test 1: GET /api/v1/templates/types/
echo "Test 1: Get All Template Types"
echo "==============================="
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/v1/templates/types/)

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    TOTAL=$(echo "$RESPONSE" | jq -r '.total_types')
    echo "✅ Success: Found $TOTAL template types"
    echo "$RESPONSE" | jq -r '.template_types | keys[]' | while read type; do
        echo "  - $type"
    done
else
    echo "❌ Failed"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 2: GET /api/v1/templates/types/NDA/
echo "Test 2: Get NDA Template Details"
echo "================================="
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/v1/templates/types/NDA/)

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    DISPLAY_NAME=$(echo "$RESPONSE" | jq -r '.display_name')
    REQ_FIELDS=$(echo "$RESPONSE" | jq -r '.required_fields | length')
    OPT_FIELDS=$(echo "$RESPONSE" | jq -r '.optional_fields | length')
    echo "✅ Success: $DISPLAY_NAME"
    echo "  Required fields: $REQ_FIELDS"
    echo "  Optional fields: $OPT_FIELDS"
else
    echo "❌ Failed"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 3: GET /api/v1/templates/summary/
echo "Test 3: Get Template Summary"
echo "============================="
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/v1/templates/summary/)

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Success: Template summary retrieved"
    echo "$RESPONSE" | jq -r '.summary | to_entries[] | "  - \(.key): \(.value.display_name)"'
else
    echo "❌ Failed"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 4: POST /api/v1/templates/validate/
echo "Test 4: Validate Template Data"
echo "==============================="
RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_type": "NDA",
    "data": {
      "effective_date": "2026-01-20",
      "first_party_name": "Test Company A",
      "first_party_address": "123 Test St",
      "second_party_name": "Test Company B",
      "second_party_address": "456 Test Ave",
      "agreement_type": "Mutual",
      "governing_law": "California"
    }
  }' \
  http://127.0.0.1:8000/api/v1/templates/validate/)

if echo "$RESPONSE" | jq -e '.is_valid == true' > /dev/null 2>&1; then
    echo "✅ Success: Template data is valid"
    echo "  Message: $(echo "$RESPONSE" | jq -r '.message')"
else
    echo "❌ Failed or invalid"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 5: POST /api/v1/templates/create-from-type/
echo "Test 5: Create Template from Type"
echo "=================================="
TEMPLATE_NAME="Test-NDA-$(date +%s)"
RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"template_type\": \"NDA\",
    \"name\": \"$TEMPLATE_NAME\",
    \"description\": \"Test NDA created by API test\",
    \"status\": \"draft\",
    \"data\": {
      \"effective_date\": \"2026-01-20\",
      \"first_party_name\": \"Test Corp\",
      \"first_party_address\": \"123 Business Ave\",
      \"second_party_name\": \"Tech Inc\",
      \"second_party_address\": \"456 Tech Blvd\",
      \"agreement_type\": \"Mutual\",
      \"governing_law\": \"California\"
    }
  }" \
  http://127.0.0.1:8000/api/v1/templates/create-from-type/)

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    TEMPLATE_ID=$(echo "$RESPONSE" | jq -r '.template_id')
    echo "✅ Success: Template created"
    echo "  Template ID: $TEMPLATE_ID"
    echo "  Name: $(echo "$RESPONSE" | jq -r '.name')"
    echo "  Status: $(echo "$RESPONSE" | jq -r '.status')"
else
    echo "❌ Failed"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
echo ""

echo "======================================"
echo "✨ Test Suite Complete"
echo "======================================"
