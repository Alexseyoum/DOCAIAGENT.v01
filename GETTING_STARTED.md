# Getting Started - Document Processing Agent

This guide will help you set up and run the Document Processing Agent backend.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.0.0 (comes with Node.js)
- **FREE LLM API Key** - Choose one:
  - **Groq** (Recommended - Fastest!) - [Get FREE key](https://console.groq.com/keys) ⚡
  - **Google Gemini** (Large context) - [Get FREE key](https://makersuite.google.com/app/apikey) 🌟
  - **Anthropic Claude** (Paid) - [Get key](https://console.anthropic.com/) 💳
- **Git** (optional, for version control)

**📖 See `GET_FREE_API_KEYS.md` for detailed instructions on getting FREE API keys!**

### Check Your Node.js Version

```bash
node -v
# Should output v20.x.x or higher

npm -v
# Should output 10.x.x or higher
```

---

## Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

**On Windows:**
```bash
cd backend
setup.bat
```

**On Mac/Linux:**
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Create necessary directories
mkdir uploads
mkdir -p src/__tests__/fixtures
```

---

## Configuration

### 1. Choose Your FREE LLM Provider

**Option A: Groq (Recommended - Fastest!)**

```env
# In your .env file
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_key_here
```

Get your FREE Groq API key: https://console.groq.com/keys

**Option B: Google Gemini (Large Context)**

```env
# In your .env file
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza_your_gemini_key_here
```

Get your FREE Gemini API key: https://makersuite.google.com/app/apikey

**Option C: Anthropic Claude (Paid)**

```env
# In your .env file
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant_your_claude_key_here
```

**📖 Detailed instructions:** See `GET_FREE_API_KEYS.md`

### 2. Optional Configuration

You can customize other settings in `.env`:

```env
# Server port (default: 3000)
PORT=3000

# Max file size in MB (default: 50)
MAX_FILE_SIZE_MB=50

# Log level (debug, info, warn, error)
LOG_LEVEL=info
```

---

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

You should see:
```
INFO: Server started successfully
  port: 3000
  env: "development"
  nodeVersion: "v20.x.x"
```

The server is now running at `http://localhost:3000`

### Production Mode

```bash
# Build the project
npm run build

# Start production server
npm start
```

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "uptime": 12.34
}
```

### 2. Upload a Document

Create a test file:

```bash
# Create a test PDF
echo "%PDF-1.4 This is a test PDF" > test.pdf
```

Upload it:

```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -F "file=@test.pdf"
```

Expected response:
```json
{
  "success": true,
  "documentId": "doc_a1b2c3d4e5f6g7h8",
  "filename": "test.pdf",
  "fileSize": 31,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-01-08T10:30:00.000Z",
  "status": "uploaded"
}
```

### 3. Retrieve Document

```bash
curl http://localhost:3000/api/v1/documents/doc_a1b2c3d4e5f6g7h8
```

### 4. Using Postman

1. Open Postman
2. Create a new request:
   - Method: `POST`
   - URL: `http://localhost:3000/api/v1/documents/upload`
   - Body: `form-data`
   - Key: `file` (type: File)
   - Value: Select a PDF/DOCX/TXT file
3. Click **Send**

---

## Running Tests

### Run All Tests

```bash
npm test
```

Expected output:
```
PASS  src/__tests__/upload.test.ts
  Document Upload API
    POST /api/v1/documents/upload
      ✓ should upload a valid PDF file (123ms)
      ✓ should upload a valid TXT file (45ms)
      ✓ should return 400 for no file provided (12ms)
      ✓ should return 400 for invalid file type (34ms)
      ✓ should return 413 for file too large (89ms)
      ✓ should sanitize filename with special characters (56ms)
      ✓ should generate unique document IDs (67ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Coverage:    85%+
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage report will be in `coverage/lcov-report/index.html`

---

## Project Structure

```
backend/
├── src/
│   ├── __tests__/              # Tests
│   ├── config/                 # Configuration
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Express middleware
│   ├── routes/                 # API routes
│   ├── storage/                # Data storage
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utilities
│   ├── app.ts                  # Express app
│   └── index.ts                # Entry point
├── uploads/                    # Uploaded files
├── .env                        # Environment variables
└── package.json                # Dependencies
```

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

1. Change the port in `.env`:
   ```env
   PORT=3001
   ```
2. Restart the server

### Tests Failing

```bash
# Clear test cache
npm test -- --clearCache

# Re-run tests
npm test
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild the project
npm run build
```

---

## Next Steps

Now that your backend is running, you can:

### 1. Test with Real Documents

Upload actual PDFs, Word documents, or text files:

```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -F "file=@/path/to/your/document.pdf"
```

### 2. Implement Text Extraction (US-004)

Next story in Sprint 1:
- Add PDF text extraction using `pdf-parse`
- See `USER_STORIES.md` for details

### 3. Build the Frontend

Create a Next.js app to integrate with this API:
- File upload component
- Document listing
- Progress tracking

### 4. Add Content Generation (US-008)

Implement summary generation using Claude API

---

## Development Workflow

### Adding a New Feature

1. **Read the User Story** in `USER_STORIES.md`
2. **Create a branch** (if using Git)
3. **Write tests first** (TDD approach)
4. **Implement the feature**
5. **Run tests** and ensure coverage >80%
6. **Update documentation**
7. **Update `BUILD_PROGRESS.md`**

### Daily Workflow

```bash
# Start your day
git pull
npm install  # if dependencies changed
npm run dev

# Make changes
# ... edit code ...

# Test your changes
npm test

# Before committing
npm run lint
npm run format
npm test
```

---

## API Documentation

Full API documentation is available in `USER_STORIES.md` under each story.

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/documents/upload` | POST | Upload document |
| `/api/v1/documents/:id` | GET | Get document metadata |
| `/api/v1/documents/:id/status` | GET | Get document status |
| `/api/v1/documents/:id` | DELETE | Delete document |

---

## Performance Tips

### Development

- Use `npm run dev` for hot reload
- Keep tests running in watch mode
- Use Postman collections for API testing

### Production

- Always run `npm run build` before deploying
- Set `NODE_ENV=production`
- Use a process manager like PM2
- Enable compression
- Use Redis for caching

---

## Getting Help

### Documentation

- **User Stories:** `USER_STORIES.md`
- **Build Progress:** `BUILD_PROGRESS.md`
- **Tracking Guide:** `TRACKING_GUIDE.md`
- **Backend README:** `backend/README.md`

### Common Issues

1. **"Cannot find module"** → Run `npm install`
2. **"Port already in use"** → Change `PORT` in `.env`
3. **"Tests failing"** → Run `npm test -- --clearCache`
4. **"TypeScript errors"** → Run `npm run build`

---

## Success Checklist

After setup, you should be able to:

- [ ] Start the server with `npm run dev`
- [ ] See "Server started successfully" in the logs
- [ ] Access `http://localhost:3000/health` in browser
- [ ] Upload a PDF file using curl or Postman
- [ ] Run `npm test` and see all tests passing
- [ ] Generate coverage report with >80% coverage

---

## What's Next?

### Immediate (Sprint 1)

- [x] **US-001:** Document Upload API ✅ (You are here!)
- [ ] **US-002:** Document Retrieval API (already implemented!)
- [ ] **US-004:** PDF Text Extraction
- [ ] **US-008:** Summary Generation

### Future Sprints

- Quiz generation
- Flashcard generation
- Async job processing
- Caching with Redis
- Authentication

Check `USER_STORIES.md` for the complete roadmap!

---

**Congratulations! Your Document Processing Agent backend is ready! 🎉**

Happy coding! 🚀
