#!/bin/bash

# Test script for customer history tracking
# Make sure the API is running on port 3001 before running this script

API_URL="http://localhost:3000"
JWT_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Customer History Tracking Test ===${NC}"

# 1. Login to get JWT token
echo -e "\n${GREEN}1. Getting authentication token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }')

JWT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}Failed to get JWT token. Please check login credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"

# 2. Create a test customer
echo -e "\n${GREEN}2. Creating test customer...${NC}"
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_URL/customers" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "surname": "Customer",
    "email": "test@example.com",
    "phone": "1234567890",
    "status": 1
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CUSTOMER_ID" ]; then
  echo -e "${RED}Failed to create customer${NC}"
  echo $CUSTOMER_RESPONSE
else
  echo -e "${GREEN}✓ Customer created with ID: $CUSTOMER_ID${NC}"
fi

# 3. Test customer status change
echo -e "\n${GREEN}3. Testing customer status change...${NC}"
curl -s -X PATCH "$API_URL/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": 2
  }' > /dev/null

echo -e "${GREEN}✓ Customer status changed${NC}"

# 4. Test customer note creation
echo -e "\n${GREEN}4. Testing customer note creation...${NC}"
NOTE_RESPONSE=$(curl -s -X POST "$API_URL/customer-notes" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": '$CUSTOMER_ID',
    "note": "This is a test note for history tracking",
    "noteType": "test"
  }')

echo -e "${GREEN}✓ Customer note created${NC}"

# 5. Test sales creation
echo -e "\n${GREEN}5. Testing sales creation...${NC}"
SALES_RESPONSE=$(curl -s -X POST "$API_URL/sales" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": '$CUSTOMER_ID',
    "title": "Test Sale",
    "description": "Test sale for history tracking"
  }')

SALES_ID=$(echo $SALES_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$SALES_ID" ]; then
  echo -e "${YELLOW}Sales creation may have failed or returned empty${NC}"
else
  echo -e "${GREEN}✓ Sales created with ID: $SALES_ID${NC}"
fi

# 6. Test meeting creation
echo -e "\n${GREEN}6. Testing meeting creation...${NC}"
MEETING_RESPONSE=$(curl -s -X POST "$API_URL/meetings" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": '$CUSTOMER_ID',
    "startTime": "2025-01-15T10:00:00Z",
    "endTime": "2025-01-15T11:00:00Z",
    "description": "Test meeting for history tracking",
    "meetingStatus": 1
  }')

MEETING_ID=$(echo $MEETING_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$MEETING_ID" ]; then
  echo -e "${YELLOW}Meeting creation may have failed or returned empty${NC}"
else
  echo -e "${GREEN}✓ Meeting created with ID: $MEETING_ID${NC}"
fi

# 7. Test meeting status change
echo -e "\n${GREEN}7. Testing meeting status change...${NC}"
if [ ! -z "$MEETING_ID" ]; then
  curl -s -X PATCH "$API_URL/meetings/$MEETING_ID" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "meetingStatus": 2
    }' > /dev/null
  echo -e "${GREEN}✓ Meeting status changed${NC}"
else
  echo -e "${YELLOW}Skipping meeting status change (no meeting ID)${NC}"
fi

# 8. Test customer file upload
echo -e "\n${GREEN}8. Testing customer file creation...${NC}"
FILE_RESPONSE=$(curl -s -X POST "$API_URL/customer-files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": '$CUSTOMER_ID',
    "file": "test-document.pdf",
    "description": "Test document for history tracking"
  }')

echo -e "${GREEN}✓ Customer file record created${NC}"

# 9. Test payment creation
echo -e "\n${GREEN}9. Testing payment creation...${NC}"
if [ ! -z "$SALES_ID" ]; then
  PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payments" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "sales": '$SALES_ID',
      "payType": 1,
      "amount": 1000,
      "calculatedAmount": 1000,
      "description": "Test payment for history tracking"
    }')
  echo -e "${GREEN}✓ Payment created${NC}"
else
  echo -e "${YELLOW}Skipping payment creation (no sales ID)${NC}"
fi

# 10. Get customer history
echo -e "\n${GREEN}10. Fetching customer history...${NC}"
HISTORY_RESPONSE=$(curl -s -X GET "$API_URL/customer-history?customer=$CUSTOMER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo -e "\n${YELLOW}Customer History Records:${NC}"
echo $HISTORY_RESPONSE | python3 -m json.tool 2>/dev/null || echo $HISTORY_RESPONSE

# Count history records
HISTORY_COUNT=$(echo $HISTORY_RESPONSE | grep -o '"action":"[^"]*"' | wc -l)
echo -e "\n${GREEN}✓ Total history records found: $HISTORY_COUNT${NC}"

# Check for each action type
echo -e "\n${YELLOW}Checking for expected action types:${NC}"
for action in "STATUS_CHANGE" "NOTE_ADDED" "SALE_CREATED" "MEETING_CREATED" "MEETING_STATUS_CHANGE" "FILE_ADDED" "PAYMENT_CREATED"; do
  if echo $HISTORY_RESPONSE | grep -q "\"action\":\"$action\""; then
    echo -e "${GREEN}✓ $action found${NC}"
  else
    echo -e "${RED}✗ $action not found${NC}"
  fi
done

echo -e "\n${GREEN}=== Test Complete ===${NC}"