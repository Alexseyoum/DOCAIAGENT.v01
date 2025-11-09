# Quick Start Guide - Document Processing Agent

**Get started in 5 minutes!**

---

## 🎯 Overview

The Document Processing Agent API workflow:

```
Register → Upload → Process → Generate (Summary/Quiz/Flashcards)
```

---

## ⚡ Super Quick Example

```bash
# 1. Get your API key from: https://docaiagent-v01.onrender.com/
API_KEY="your_api_key_here"

# 2. Upload a document
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@mydocument.pdf"

# Save the documentId from response!

# 3. Process the document
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/DOC_ID/process \
  -H "Authorization: Bearer $API_KEY"

# 4. Generate summary
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/summary \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"DOC_ID","summaryType":"brief"}'

# 5. Generate quiz
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/quiz \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"DOC_ID","questionCount":5,"questionTypes":["multiple_choice"]}'

# 6. Generate flashcards
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/flashcards \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"DOC_ID","cardCount":10}'
```

---

## 🌐 From JavaScript

```javascript
const API_KEY = 'your_api_key_here';
const API_BASE = 'https://docaiagent-v01.onrender.com/api/v1';

async function processDocument(file) {
  // 1. Upload
  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: formData
  });
  const { documentId } = await uploadRes.json();

  // 2. Process
  await fetch(`${API_BASE}/documents/${documentId}/process`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });

  // 3. Generate summary
  const summaryRes = await fetch(`${API_BASE}/generate/summary`, {
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

  return await summaryRes.json();
}
```

---

## 🐍 From Python

```python
import requests

API_KEY = 'your_api_key_here'
API_BASE = 'https://docaiagent-v01.onrender.com/api/v1'
headers = {'Authorization': f'Bearer {API_KEY}'}

# 1. Upload
files = {'file': open('document.pdf', 'rb')}
response = requests.post(f'{API_BASE}/documents/upload', headers=headers, files=files)
doc_id = response.json()['documentId']

# 2. Process
requests.post(f'{API_BASE}/documents/{doc_id}/process', headers=headers)

# 3. Generate summary
summary = requests.post(
    f'{API_BASE}/generate/summary',
    headers={**headers, 'Content-Type': 'application/json'},
    json={'documentId': doc_id, 'summaryType': 'brief'}
).json()

print(summary)
```

---

## 📋 API Cheatsheet

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Get API key |
| `/documents/upload` | POST | Upload document |
| `/documents/:id/process` | POST | Extract text |
| `/generate/summary` | POST | Create summary |
| `/generate/quiz` | POST | Create quiz |
| `/generate/flashcards` | POST | Create flashcards |
| `/documents` | GET | List all docs |
| `/documents/:id` | GET | Get doc details |
| `/documents/:id` | DELETE | Delete doc |

---

## 🎨 Summary Types

- `"brief"` - Quick overview (2-3 paragraphs)
- `"standard"` - Medium detail (1-2 pages)
- `"detailed"` - Full analysis (3+ pages)

---

## 📝 Quiz Options

```json
{
  "documentId": "doc_xxx",
  "questionCount": 5,
  "questionTypes": ["multiple_choice", "true_false", "short_answer"],
  "difficulty": "medium"
}
```

---

## 🎴 Flashcard Options

```json
{
  "documentId": "doc_xxx",
  "cardCount": 10,
  "focusAreas": ["key-terms", "concepts", "facts", "examples"]
}
```

---

## ✅ Supported Formats

- PDF (.pdf)
- Word (.docx, .doc)
- Text (.txt)
- CSV (.csv)
- Excel (.xlsx)

**Max size:** 50 MB

---

## 🚨 Common Issues

**401 Unauthorized**
→ Check your API key in the Authorization header

**404 Document Not Found**
→ Make sure the documentId is correct

**400 Not Processed**
→ Call `/documents/:id/process` before generating content

---

## 📱 Live Demo

Try it now: **https://docaiagent-v01.onrender.com/**

1. Register to get your API key
2. Test the API with curl or JavaScript
3. Build your application!

---

## 📚 Full Documentation

- **Complete Guide:** `HOW_TO_USE_API.md`
- **Test Script:** Run `bash test-workflow.sh`
- **API Health:** https://docaiagent-v01.onrender.com/health

---

**Ready to start?** Get your API key at https://docaiagent-v01.onrender.com/ 🚀
