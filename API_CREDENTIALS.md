# Document Processing Agent - API Credentials

## 🔑 Your API Key

**IMPORTANT: Keep this confidential!**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3NjI2MjU2ODQ2MzFfbGY5NDB3NGJvIiwiZW1haWwiOiJhcGktYWRtaW5AZG9jYWdlbnQuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjI2MjU2ODQsImV4cCI6MTc2MzIzMDQ4NH0.V4f5PFRL_aNdhAdw4rZvaI_Ax9S7WNJ1rG7Hi22_vjI
```

---

## 📋 API Information for Platform Registration

### Base URL
```
https://docaiagent-v01.onrender.com
```

### API Version
```
v1
```

### Full API Endpoint
```
https://docaiagent-v01.onrender.com/api/v1
```

### Authentication Type
```
Bearer Token (JWT)
```

### Authentication Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3NjI2MjU2ODQ2MzFfbGY5NDB3NGJvIiwiZW1haWwiOiJhcGktYWRtaW5AZG9jYWdlbnQuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjI2MjU2ODQsImV4cCI6MTc2MzIzMDQ4NH0.V4f5PFRL_aNdhAdw4rZvaI_Ax9S7WNJ1rG7Hi22_vjI
```

### Token Expiration
```
7 days (expires: 2025-11-15)
```

### Renewal
To get a new token when this expires:
```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-admin@docagent.com",
    "password": "SecureAdminPassword2024"
  }'
```

---

## 🔗 Available Endpoints

### Document Upload
```
POST /api/v1/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer YOUR_API_KEY

Form field: file (the document to upload)
Supported formats: PDF, DOCX, DOC, TXT, CSV, XLSX
Max file size: 50MB
```

### Document Processing
```
POST /api/v1/documents/{documentId}/process
Authorization: Bearer YOUR_API_KEY

Extracts text from the uploaded document
```

### Generate Summary
```
POST /api/v1/generate/summary
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

Body:
{
  "documentId": "doc_xxx",
  "summaryType": "brief|standard|detailed"
}
```

### Generate Quiz
```
POST /api/v1/generate/quiz
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

Body:
{
  "documentId": "doc_xxx",
  "questionCount": 5,
  "questionTypes": ["multiple_choice", "true_false"]
}
```

### Generate Flashcards
```
POST /api/v1/generate/flashcards
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

Body:
{
  "documentId": "doc_xxx",
  "cardCount": 10
}
```

### List Documents
```
GET /api/v1/documents
Authorization: Bearer YOUR_API_KEY
```

### Get Document Details
```
GET /api/v1/documents/{documentId}
Authorization: Bearer YOUR_API_KEY
```

### Delete Document
```
DELETE /api/v1/documents/{documentId}
Authorization: Bearer YOUR_API_KEY
```

### Health Check
```
GET /health
(No authentication required)
```

---

## 📊 API Specifications

### Rate Limits
- **Default**: 100 requests per minute
- **Upload**: 10 uploads per minute

### Response Format
All responses are in JSON format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2025-11-08T..."
  },
  "requestId": "req_xxx"
}
```

### Content Types
- Request: `application/json` or `multipart/form-data`
- Response: `application/json`

### CORS
Enabled for all origins (configurable)

---

## 🧪 Test Your Integration

### Quick Test Command
```bash
# Set your API key as environment variable
export API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3NjI2MjU2ODQ2MzFfbGY5NDB3NGJvIiwiZW1haWwiOiJhcGktYWRtaW5AZG9jYWdlbnQuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjI2MjU2ODQsImV4cCI6MTc2MzIzMDQ4NH0.V4f5PFRL_aNdhAdw4rZvaI_Ax9S7WNJ1rG7Hi22_vjI"

# Test health endpoint
curl https://docaiagent-v01.onrender.com/health

# Upload a test document
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@test.pdf"
```

### Example: Full Workflow in Code

**JavaScript/Node.js:**
```javascript
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const BASE_URL = 'https://docaiagent-v01.onrender.com/api/v1';

// Upload document
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch(`${BASE_URL}/documents/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  },
  body: formData
});

const { data: { documentId } } = await uploadResponse.json();

// Process document
await fetch(`${BASE_URL}/documents/${documentId}/process`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Generate summary
const summaryResponse = await fetch(`${BASE_URL}/generate/summary`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId,
    summaryType: 'brief'
  })
});

const summary = await summaryResponse.json();
console.log(summary);
```

**Python:**
```python
import requests

API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
BASE_URL = 'https://docaiagent-v01.onrender.com/api/v1'
HEADERS = {'Authorization': f'Bearer {API_KEY}'}

# Upload document
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        f'{BASE_URL}/documents/upload',
        headers=HEADERS,
        files=files
    )
    doc_id = response.json()['data']['documentId']

# Process document
requests.post(
    f'{BASE_URL}/documents/{doc_id}/process',
    headers=HEADERS
)

# Generate summary
response = requests.post(
    f'{BASE_URL}/generate/summary',
    headers={**HEADERS, 'Content-Type': 'application/json'},
    json={
        'documentId': doc_id,
        'summaryType': 'brief'
    }
)

summary = response.json()
print(summary)
```

---

## 🔒 Security Best Practices

1. **Never expose your API key in:**
   - Public repositories
   - Client-side code
   - URLs or query parameters

2. **Store securely:**
   - Use environment variables
   - Use secrets management (AWS Secrets Manager, etc.)
   - Never hardcode in source code

3. **Rotate regularly:**
   - Create a new account with a new token every 6 months
   - Update all services using the old token

4. **Monitor usage:**
   - Check Render dashboard for unusual activity
   - Set up alerts for rate limit exceeded

---

## 📞 Support

- **API Documentation**: https://docaiagent-v01.onrender.com
- **Health Status**: https://docaiagent-v01.onrender.com/health
- **GitHub Repository**: https://github.com/Alexseyoum/DOCAIAGENT.v01

---

## ⚠️ Important Notes

- Token expires in **7 days** - login again to get a new one
- Free tier on Render may spin down after inactivity
- First request after inactivity may take 30-60 seconds
- Maximum file size: **50MB**
- Supported formats: PDF, DOCX, DOC, TXT, CSV, XLSX

---

**Generated**: 2025-11-08
**Expires**: 2025-11-15
