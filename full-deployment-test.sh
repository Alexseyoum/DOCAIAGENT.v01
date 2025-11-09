#!/bin/bash

# Full deployment test script
API_BASE="https://docaiagent-v01.onrender.com/api/v1"

echo "=== Document Processing Agent - Full Deployment Test ==="
echo

# Step 1: Register a new user
echo "1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test_$(date +%s)@example.com\",\"password\":\"TestPass123\",\"name\":\"Test User\"}")

echo "$REGISTER_RESPONSE" | jq '.'

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
echo "Token: ${TOKEN:0:50}..."
echo

# Step 2: Upload a document
echo "2. Uploading test document..."
echo "This is a test document about machine learning." > /tmp/test-doc.txt

UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-doc.txt")

echo "$UPLOAD_RESPONSE" | jq '.'

DOC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.documentId // .data.documentId')
echo "Document ID: $DOC_ID"
echo

# Step 3: Get document details
echo "3. Getting document details..."
curl -s -X GET "$API_BASE/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo

# Step 4: Process document (extract text)
echo "4. Processing document (extracting text)..."
PROCESS_RESPONSE=$(curl -s -X POST "$API_BASE/documents/$DOC_ID/process" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROCESS_RESPONSE" | jq '.'
echo

# Step 5: Generate summary
echo "5. Generating summary..."
SUMMARY_RESPONSE=$(curl -s -X POST "$API_BASE/generate/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"summaryType\":\"brief\"}")

echo "$SUMMARY_RESPONSE" | jq '.'
echo

# Step 6: Generate quiz
echo "6. Generating quiz..."
QUIZ_RESPONSE=$(curl -s -X POST "$API_BASE/generate/quiz" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"questionCount\":3,\"questionTypes\":[\"multiple_choice\"]}")

echo "$QUIZ_RESPONSE" | jq '.'
echo

# Step 7: Generate flashcards
echo "7. Generating flashcards..."
FLASHCARDS_RESPONSE=$(curl -s -X POST "$API_BASE/generate/flashcards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"cardCount\":5}")

echo "$FLASHCARDS_RESPONSE" | jq '.'
echo

echo "=== Test Complete ==="
