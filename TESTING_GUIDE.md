# Document Processing Agent - Testing Guide

Your API is live at: **https://docaiagent-v01.onrender.com**

## Quick Test Commands

### 1. Health Check
```bash
curl https://docaiagent-v01.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T...",
  "uptime": 123.45,
  "version": "1.0.0",
  "environment": "production"
}
```

---

## Full API Testing Workflow

### Step 1: Register a User

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token!** You'll need it for authenticated requests.

---

### Step 2: Login (Alternative to Register)

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### Step 3: Upload a Document

```bash
# Replace YOUR_TOKEN_HERE with the token from registration/login
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/document.pdf"
```

Example with a local file:
```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@./sample.pdf"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_123abc",
      "filename": "document.pdf",
      "size": 102400,
      "mimeType": "application/pdf",
      "uploadedAt": "2025-11-08T..."
    }
  }
}
```

**Save the document ID!** You'll need it for generation.

---

### Step 4: Generate a Summary

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_123abc",
    "summaryType": "brief"
  }'
```

Summary types available:
- `brief` - Short overview
- `standard` - Moderate detail
- `detailed` - Comprehensive summary

Expected response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "id": "sum_456def",
      "documentId": "doc_123abc",
      "type": "brief",
      "content": "This document discusses...",
      "generatedAt": "2025-11-08T..."
    }
  }
}
```

---

### Step 5: Generate a Quiz

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/quiz \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_123abc",
    "questionCount": 5,
    "questionTypes": ["multiple_choice", "true_false"]
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "quiz_789ghi",
      "documentId": "doc_123abc",
      "questions": [
        {
          "id": "q1",
          "type": "multiple_choice",
          "question": "What is...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "B"
        }
      ]
    }
  }
}
```

---

### Step 6: Generate Flashcards

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_123abc",
    "cardCount": 10
  }'
```

---

### Step 7: List Your Documents

```bash
curl -X GET https://docaiagent-v01.onrender.com/api/v1/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 8: Get Document Details

```bash
curl -X GET https://docaiagent-v01.onrender.com/api/v1/documents/doc_123abc \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 9: Delete a Document

```bash
curl -X DELETE https://docaiagent-v01.onrender.com/api/v1/documents/doc_123abc \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with Sample Files

### Create a Test Text File

```bash
echo "This is a sample document for testing the Document Processing Agent. It contains information about artificial intelligence and machine learning." > test.txt
```

### Upload the Test File

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test.txt"
```

---

## Common Testing Scenarios

### Scenario 1: Complete Workflow

```bash
# 1. Register
TOKEN=$(curl -s -X POST https://docaiagent-v01.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Tester"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. Upload document
DOC_ID=$(curl -s -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Document ID: $DOC_ID"

# 3. Generate summary
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/summary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"summaryType\":\"brief\"}"
```

---

## Monitoring Endpoints

### Check System Stats

```bash
curl -X GET https://docaiagent-v01.onrender.com/api/v1/monitoring/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Job Status Tracking

For async operations, you can check job status:

```bash
curl -X GET https://docaiagent-v01.onrender.com/api/v1/jobs/job_123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2025-11-08T..."
  },
  "requestId": "req_abc123"
}
```

Common error codes:
- `INVALID_PARAMETERS` - Missing or invalid request data
- `AUTHENTICATION_FAILED` - Invalid or missing token
- `NOT_FOUND` - Resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `FILE_TOO_LARGE` - File exceeds size limit

---

## Tips for Testing

1. **Save your token**: Store it in an environment variable:
   ```bash
   export API_TOKEN="your_token_here"
   curl -H "Authorization: Bearer $API_TOKEN" ...
   ```

2. **Use Postman or Insomnia**: Import these curl commands for easier testing

3. **Check logs**: Monitor your Render dashboard for detailed logs

4. **Test file types**: Try different formats:
   - PDF files
   - Word documents (.docx, .doc)
   - Text files (.txt)
   - CSV files
   - Excel files (.xlsx)

5. **Max file size**: 50MB (configurable)

---

## Next Steps

- Integrate with your Next.js frontend
- Set up webhooks for async notifications
- Add more documents and test batch processing
- Monitor performance in Render dashboard

Happy testing! 🚀
