# Quick Commands Reference

**Copy-paste these commands to get started fast!**

---

## 🚀 First Time Setup

### Windows

```bash
cd backend
setup.bat
```

Then edit `.env` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Mac/Linux

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

Then edit `.env` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## 🏃 Running the Server

```bash
# Development mode (with hot reload)
cd backend
npm run dev

# Production build
npm run build
npm start
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 📤 Test API with curl

### Upload a PDF
```bash
# Create test file
echo "%PDF-1.4 Test content" > test.pdf

# Upload it
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -F "file=@test.pdf"
```

### Upload a TXT file
```bash
# Create test file
echo "This is test content" > test.txt

# Upload it
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -F "file=@test.txt"
```

### Get document (replace with your documentId)
```bash
curl http://localhost:3000/api/v1/documents/doc_a1b2c3d4e5f6g7h8
```

### Check health
```bash
curl http://localhost:3000/health
```

### Delete document
```bash
curl -X DELETE http://localhost:3000/api/v1/documents/doc_a1b2c3d4e5f6g7h8
```

---

## 🐛 Troubleshooting

### Reset everything
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Clear test cache
```bash
npm test -- --clearCache
```

### Check if port 3000 is in use
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

### Change port
Edit `.env`:
```
PORT=3001
```

---

## 📊 View Logs

Logs are pretty-printed in development:

```bash
npm run dev
```

Look for:
```
INFO: Server started successfully
  port: 3000
  env: "development"
```

---

## 🔍 Verify Installation

```bash
# Check Node version (need 20+)
node -v

# Check npm version
npm -v

# Check all dependencies installed
cd backend
npm list --depth=0
```

---

## 📦 Build for Production

```bash
cd backend
npm run build

# Output will be in dist/
ls dist/
```

---

## 🎯 Full Test Sequence

```bash
# 1. Install
cd backend
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY

# 3. Run tests
npm test

# 4. Start server
npm run dev

# 5. In another terminal, test upload
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -F "file=@test.pdf"

# 6. Check health
curl http://localhost:3000/health
```

---

## 🚀 Deploy to Production

```bash
# Build
npm run build

# Set environment
export NODE_ENV=production
export PORT=3000
export ANTHROPIC_API_KEY=sk-ant-your-key

# Start
npm start
```

---

## 📝 Common Tasks

### View all documents (dev only)
```bash
# In Node REPL
node
> const { documentStore } = require('./dist/storage/document-store')
> documentStore.getAll()
```

### Clear all documents (dev only)
```bash
# Restart the server (in-memory store will clear)
# Or in Node REPL:
node
> const { documentStore } = require('./dist/storage/document-store')
> documentStore.clear()
```

---

## 🎨 Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

---

## 📚 View Documentation

```bash
# Quick start
cat GETTING_STARTED.md

# User stories
cat USER_STORIES.md

# Build progress
cat BUILD_PROGRESS.md

# This summary
cat SESSION_SUMMARY.md
```

---

## 🔧 Development Workflow

```bash
# 1. Start in watch mode
npm run dev

# 2. In another terminal, start tests in watch mode
npm run test:watch

# 3. Make your changes
# Both will automatically reload!

# 4. Before committing
npm run lint
npm run format
npm test
```

---

## 🎯 Next Steps

### Start US-004 (PDF Extraction)

```bash
# Install PDF parser
cd backend
npm install pdf-parse @types/pdf-parse

# Create parser service
mkdir -p src/services/parsers
touch src/services/parsers/pdf-parser.ts

# Follow US-004 in USER_STORIES.md
```

---

**Pro tip:** Keep this file open in a second terminal for quick reference! 📌
