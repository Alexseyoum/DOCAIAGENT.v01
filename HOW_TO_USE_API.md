# How to Use the Document Processing Agent API

**Complete Guide: From Document Upload to Quiz Generation**

---

## 🚀 Quick Start: Complete Workflow

### Step 1: Get Your API Key

**Already done!** You can register at https://docaiagent-v01.onrender.com/

Save your API token - you'll need it for all requests.

---

### Step 2: Upload a Document

Upload a PDF, DOCX, TXT, CSV, or Excel file.

**Using curl (Command Line):**
```bash
# Set your API key
API_KEY="your_api_key_here"

# Upload a document
curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@/path/to/your/document.pdf"
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "filename": "document.pdf",
  "fileSize": 152400,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-11-09T10:00:00.000Z",
  "status": "uploaded"
}
```

**💾 Save the `documentId` - you'll need it for the next steps!**

---

### Step 3: Process the Document (Extract Text)

Before you can generate summaries/quizzes, you need to extract the text from the document.

**Using curl:**
```bash
# Replace DOC_ID with your documentId from Step 2
DOC_ID="doc_abc123"

curl -X POST https://docaiagent-v01.onrender.com/api/v1/documents/$DOC_ID/process \
  -H "Authorization: Bearer $API_KEY"
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "status": "completed",
  "wordCount": 1250,
  "extractedAt": "2025-11-09T10:00:30.000Z"
}
```

**⚡ This step is required before generating summaries, quizzes, or flashcards!**

---

### Step 4: Generate Content

Now you can generate educational content from your document.

#### A. Generate Summary

**Brief Summary:**
```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/summary \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_abc123",
    "summaryType": "brief"
  }'
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "generatedAt": "2025-11-09T10:01:00.000Z",
  "summary": {
    "title": "Introduction to Machine Learning",
    "documentType": "article",
    "overview": "Comprehensive overview of the document...",
    "keyPoints": [
      "Machine learning enables computers to learn from data",
      "Applications include image recognition, NLP, and predictions",
      "Common algorithms include neural networks and decision trees"
    ],
    "importantTerms": [
      {
        "term": "Machine Learning",
        "definition": "A branch of AI that enables computers to learn from data"
      }
    ],
    "mainTopics": ["Machine Learning", "Neural Networks", "Applications"],
    "estimatedReadTime": "5 minutes"
  },
  "metadata": {
    "detailLevel": "brief",
    "wordCount": 250,
    "processingTime": 1.2,
    "llmProvider": "groq"
  }
}
```

**Summary Types:**
- `"brief"` - Short overview (2-3 paragraphs)
- `"standard"` - Medium detail (1-2 pages)
- `"detailed"` - Comprehensive analysis (3+ pages)

---

#### B. Generate Quiz

**Create a quiz with multiple-choice questions:**

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/quiz \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_abc123",
    "questionCount": 5,
    "questionTypes": ["multiple_choice"]
  }'
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "generatedAt": "2025-11-09T10:02:00.000Z",
  "quiz": {
    "title": "Machine Learning Quiz",
    "description": "Test your knowledge on machine learning concepts",
    "questions": [
      {
        "id": 1,
        "type": "multiple-choice",
        "question": "What is machine learning?",
        "options": [
          "A programming language",
          "A branch of AI that enables computers to learn from data",
          "A type of database",
          "A web framework"
        ],
        "correctAnswer": "A branch of AI that enables computers to learn from data",
        "explanation": "Machine learning is a subset of artificial intelligence...",
        "difficulty": "medium",
        "topic": "Machine Learning Basics"
      }
    ]
  },
  "metadata": {
    "questionCount": 5,
    "difficulty": "medium",
    "questionTypes": ["multiple_choice"],
    "processingTime": 2.1
  }
}
```

**Quiz Options:**
- `questionCount`: Number of questions (1-20)
- `questionTypes`: Array of `["multiple_choice", "true_false", "short_answer"]`
- `difficulty`: `"easy"`, `"medium"`, or `"hard"` (optional)

---

#### C. Generate Flashcards

**Create study flashcards:**

```bash
curl -X POST https://docaiagent-v01.onrender.com/api/v1/generate/flashcards \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_abc123",
    "cardCount": 10
  }'
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "generatedAt": "2025-11-09T10:03:00.000Z",
  "flashcards": {
    "title": "Machine Learning Flashcards",
    "description": "Key concepts and terminology",
    "cards": [
      {
        "id": 1,
        "front": "What is supervised learning?",
        "back": "A type of machine learning where the algorithm learns from labeled training data",
        "category": "Concepts",
        "difficulty": "easy",
        "tags": ["machine-learning", "supervised-learning"],
        "hint": "Think about learning with a teacher",
        "relatedConcepts": ["Unsupervised Learning", "Training Data"]
      }
    ]
  },
  "metadata": {
    "cardCount": 10,
    "focusAreas": ["key-terms", "concepts", "facts"],
    "processingTime": 1.8
  }
}
```

**Flashcard Options:**
- `cardCount`: Number of cards to generate (1-50)
- `focusAreas`: Array of `["key-terms", "concepts", "facts", "examples"]` (optional)

---

## 📱 Using from a Web Application

**JavaScript/Browser Example:**

```javascript
// Your API key
const API_KEY = 'your_api_key_here';
const API_BASE = 'https://docaiagent-v01.onrender.com/api/v1';

// 1. Upload document
async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });

  const data = await response.json();
  return data.documentId;
}

// 2. Process document (extract text)
async function processDocument(documentId) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/process`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  return await response.json();
}

// 3. Generate summary
async function generateSummary(documentId, summaryType = 'brief') {
  const response = await fetch(`${API_BASE}/generate/summary`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId,
      summaryType
    })
  });

  return await response.json();
}

// 4. Generate quiz
async function generateQuiz(documentId, questionCount = 5) {
  const response = await fetch(`${API_BASE}/generate/quiz`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId,
      questionCount,
      questionTypes: ['multiple_choice']
    })
  });

  return await response.json();
}

// 5. Generate flashcards
async function generateFlashcards(documentId, cardCount = 10) {
  const response = await fetch(`${API_BASE}/generate/flashcards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId,
      cardCount
    })
  });

  return await response.json();
}

// Complete workflow example
async function completeWorkflow(file) {
  try {
    // Upload
    console.log('Uploading document...');
    const documentId = await uploadDocument(file);

    // Process
    console.log('Processing document...');
    await processDocument(documentId);

    // Generate content
    console.log('Generating summary...');
    const summary = await generateSummary(documentId, 'brief');

    console.log('Generating quiz...');
    const quiz = await generateQuiz(documentId, 5);

    console.log('Generating flashcards...');
    const flashcards = await generateFlashcards(documentId, 10);

    return { summary, quiz, flashcards };
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**HTML Form Example:**
```html
<input type="file" id="fileInput" accept=".pdf,.docx,.txt">
<button onclick="handleUpload()">Process Document</button>
<div id="results"></div>

<script>
async function handleUpload() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) {
    alert('Please select a file');
    return;
  }

  const results = await completeWorkflow(file);
  document.getElementById('results').innerHTML = `
    <h2>Summary</h2>
    <pre>${JSON.stringify(results.summary, null, 2)}</pre>

    <h2>Quiz</h2>
    <pre>${JSON.stringify(results.quiz, null, 2)}</pre>

    <h2>Flashcards</h2>
    <pre>${JSON.stringify(results.flashcards, null, 2)}</pre>
  `;
}
</script>
```

---

## 🐍 Using from Python

```python
import requests

API_KEY = 'your_api_key_here'
API_BASE = 'https://docaiagent-v01.onrender.com/api/v1'
headers = {'Authorization': f'Bearer {API_KEY}'}

# 1. Upload document
def upload_document(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f'{API_BASE}/documents/upload',
            headers=headers,
            files=files
        )
        return response.json()['documentId']

# 2. Process document
def process_document(document_id):
    response = requests.post(
        f'{API_BASE}/documents/{document_id}/process',
        headers=headers
    )
    return response.json()

# 3. Generate summary
def generate_summary(document_id, summary_type='brief'):
    response = requests.post(
        f'{API_BASE}/generate/summary',
        headers={**headers, 'Content-Type': 'application/json'},
        json={
            'documentId': document_id,
            'summaryType': summary_type
        }
    )
    return response.json()

# 4. Generate quiz
def generate_quiz(document_id, question_count=5):
    response = requests.post(
        f'{API_BASE}/generate/quiz',
        headers={**headers, 'Content-Type': 'application/json'},
        json={
            'documentId': document_id,
            'questionCount': question_count,
            'questionTypes': ['multiple_choice']
        }
    )
    return response.json()

# 5. Generate flashcards
def generate_flashcards(document_id, card_count=10):
    response = requests.post(
        f'{API_BASE}/generate/flashcards',
        headers={**headers, 'Content-Type': 'application/json'},
        json={
            'documentId': document_id,
            'cardCount': card_count
        }
    )
    return response.json()

# Complete workflow
def process_and_generate(file_path):
    # Upload
    print('Uploading document...')
    doc_id = upload_document(file_path)
    print(f'Document ID: {doc_id}')

    # Process
    print('Processing document...')
    process_document(doc_id)

    # Generate content
    print('Generating summary...')
    summary = generate_summary(doc_id, 'brief')

    print('Generating quiz...')
    quiz = generate_quiz(doc_id, 5)

    print('Generating flashcards...')
    flashcards = generate_flashcards(doc_id, 10)

    return {
        'summary': summary,
        'quiz': quiz,
        'flashcards': flashcards
    }

# Use it
if __name__ == '__main__':
    results = process_and_generate('my_document.pdf')
    print(results)
```

---

## 🔍 Additional API Endpoints

### List All Your Documents

```bash
curl -X GET https://docaiagent-v01.onrender.com/api/v1/documents \
  -H "Authorization: Bearer $API_KEY"
```

### Get Document Details

```bash
curl -X GET https://docaiagent-v01.onrender.com/api/v1/documents/doc_abc123 \
  -H "Authorization: Bearer $API_KEY"
```

### Delete a Document

```bash
curl -X DELETE https://docaiagent-v01.onrender.com/api/v1/documents/doc_abc123 \
  -H "Authorization: Bearer $API_KEY"
```

---

## ⚡ Performance Tips

1. **Processing Time:**
   - Text files: < 1 second
   - PDFs: 1-3 seconds
   - Large documents: 3-10 seconds

2. **Generation Time:**
   - Brief summary: 1-2 seconds
   - Quiz (5 questions): 2-3 seconds
   - Flashcards (10 cards): 2-4 seconds

3. **Best Practices:**
   - Process the document once, then generate multiple content types
   - Cache results on your side to avoid regenerating
   - Use "brief" summaries for quick overviews

---

## 🚨 Error Handling

**Common errors and solutions:**

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```
**Solution:** Check that your API key is correct and included in the Authorization header.

### 404 Document Not Found
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found"
  }
}
```
**Solution:** Make sure the documentId is correct and the document exists.

### 400 Document Not Processed
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_PROCESSED",
    "message": "Document must be processed before generating content"
  }
}
```
**Solution:** Call `/documents/{id}/process` before generating summaries/quizzes.

---

## 📊 Supported File Formats

- ✅ **PDF** (.pdf)
- ✅ **Microsoft Word** (.docx, .doc)
- ✅ **Plain Text** (.txt)
- ✅ **CSV** (.csv)
- ✅ **Excel** (.xlsx)

**Maximum file size:** 50 MB

---

## 🎯 Use Cases

### 1. Study Aid Application
Upload lecture notes → Generate summaries, quizzes, and flashcards

### 2. Document Summarization
Upload reports/articles → Get brief/standard/detailed summaries

### 3. E-Learning Platform
Upload course materials → Auto-generate assessments

### 4. Research Tool
Upload research papers → Extract key points and create study materials

---

## 📞 Support

- **API URL:** https://docaiagent-v01.onrender.com
- **Health Check:** https://docaiagent-v01.onrender.com/health
- **Documentation:** https://docaiagent-v01.onrender.com/
- **GitHub:** https://github.com/Alexseyoum/DOCAIAGENT.v01

---

## 🔒 Security Notes

1. **Never expose your API key** in client-side code for public applications
2. **Use environment variables** to store API keys
3. **Rate limits:** 100 requests/minute (can be adjusted)
4. **Token expiration:** 7 days (re-authenticate after expiration)

---

**Ready to start processing documents? Try the examples above!** 🚀
