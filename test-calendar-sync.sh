#!/bin/bash

# Test Calendar Sync Script
# This script helps test the Google Calendar sync functionality

echo "🔄 Testing Google Calendar Sync"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if JWT token is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: JWT token required${NC}"
    echo "Usage: ./test-calendar-sync.sh YOUR_JWT_TOKEN"
    echo ""
    echo "To get your JWT token:"
    echo "1. Open browser DevTools (F12)"
    echo "2. Go to Application > Cookies"
    echo "3. Find 'token' cookie value"
    exit 1
fi

JWT_TOKEN="$1"
BASE_URL="http://localhost:3000"

echo -e "${YELLOW}Step 1: Getting sync status...${NC}"
STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/calendar/sync" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

echo -e "${YELLOW}Step 2: Triggering manual sync...${NC}"
SYNC_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/calendar/sync" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$SYNC_RESPONSE" | jq '.' 2>/dev/null || echo "$SYNC_RESPONSE"
echo ""

# Check if sync was successful
if echo "$SYNC_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Sync successful!${NC}"
else
    echo -e "${RED}❌ Sync failed or had errors${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Checking updated status...${NC}"
FINAL_STATUS=$(curl -s -X GET "${BASE_URL}/api/calendar/sync" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

echo "$FINAL_STATUS" | jq '.' 2>/dev/null || echo "$FINAL_STATUS"
echo ""

# Check event count
EVENT_COUNT=$(echo "$FINAL_STATUS" | jq '.connections[0].eventCount' 2>/dev/null)
if [ "$EVENT_COUNT" != "null" ] && [ "$EVENT_COUNT" != "0" ]; then
    echo -e "${GREEN}✅ Found ${EVENT_COUNT} events synced!${NC}"
else
    echo -e "${YELLOW}⚠️  No events synced. Check server logs for errors.${NC}"
fi

echo ""
echo "To view detailed server logs, check your terminal running 'pnpm dev'"
