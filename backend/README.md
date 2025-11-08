# Document Processing Agent - Backend API

Backend API for the Document Processing Agent that handles document uploads, text extraction, and AI-powered educational content generation.

## Features

- **Document Upload:** Multi-format support (PDF, DOCX, DOC, TXT, CSV, Excel)
- **Text Extraction:** Extract text from various document formats
- **AI Content Generation:** Generate summaries, quizzes, and flashcards using FREE LLMs (Groq/Gemini)
- **RESTful API:** Clean, well-documented API endpoints
- **TypeScript:** Full type safety
- **Error Handling:** Comprehensive error handling with detailed messages
- **Logging:** Structured logging with Pino
- **Testing:** Jest-based testing with >80% coverage

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- FREE API key from Groq or Gemini (see [GET_FREE_API_KEYS.md](GET_FREE_API_KEYS.md))

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your FREE LLM API keys to .env
# Option 1: Use Groq (RECOMMENDED - fastest)
# LLM_PROVIDER=groq
# GROQ_API_KEY=gsk_your-key-here

# Option 2: Use Gemini
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=your-key-here

# Get FREE API keys (2 mins): See GET_FREE_API_KEYS.md
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server will run on `http://localhost:3000` by default.

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## API Endpoints

### Document Management

#### Upload Document
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data

Body:
- file: File (required)

Response 200:
{
  "success": true,
  "documentId": "doc_a1b2c3d4e5f6g7h8",
  "filename": "study_notes.pdf",
  "fileSize": 2457600,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-01-08T10:30:00Z",
  "status": "uploaded"
}
```

#### Get Document
```http
GET /api/v1/documents/:id

Response 200:
{
  "success": true,
  "documentId": "doc_a1b2c3d4e5f6g7h8",
  "filename": "study_notes.pdf",
  "fileSize": 2457600,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-01-08T10:30:00Z",
  "status": "uploaded"
}
```

#### Get Document Status
```http
GET /api/v1/documents/:id/status

Response 200:
{
  "success": true,
  "documentId": "doc_a1b2c3d4e5f6g7h8",
  "status": "uploaded"
}
```

#### Delete Document
```http
DELETE /api/v1/documents/:id

Response: 204 No Content
```

### Health Check
```http
GET /health

Response 200:
{
  "status": "ok",
  "timestamp": "2025-01-08T10:30:00Z",
  "uptime": 123.45,
  "llmProvider": "groq",
  "llmAvailable": true
}
```

## Project Structure

```
backend/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── setup.ts        # Test setup
│   │   └── upload.test.ts  # Upload tests
│   ├── config/             # Configuration
│   │   └── index.ts        # App configuration
│   ├── controllers/        # Request handlers
│   │   └── document-controller.ts
│   ├── middleware/         # Express middleware
│   │   ├── error-handler.ts
│   │   ├── request-id.ts
│   │   └── upload.ts
│   ├── routes/             # API routes
│   │   └── documents.ts
│   ├── storage/            # Data storage
│   │   └── document-store.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── id-generator.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   ├── app.ts              # Express app setup
│   └── index.ts            # Server entry point
├── uploads/                # Uploaded files (gitignored)
├── .env.example            # Environment template
├── .gitignore
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

All configuration is managed through environment variables. See `.env.example` for available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `LLM_PROVIDER` | LLM provider (groq/gemini/anthropic) | `groq` |
| `GROQ_API_KEY` | Groq API key (FREE) | (required if using groq) |
| `GEMINI_API_KEY` | Google Gemini API key (FREE) | (required if using gemini) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key (PAID) | (required if using anthropic) |
| `JWT_SECRET` | JWT signing secret | (change in production) |
| `MAX_FILE_SIZE_MB` | Max file size in MB | `50` |
| `UPLOAD_DIR` | Upload directory | `./uploads` |

## Supported File Types

- **PDF:** `.pdf`
- **Word:** `.docx`, `.doc`
- **Text:** `.txt`
- **CSV:** `.csv`
- **Excel:** `.xlsx`

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2025-01-08T10:30:00Z"
  },
  "requestId": "req_abc123def456"
}
```

### Error Codes

- `INVALID_FILE_TYPE` - File type not supported
- `FILE_TOO_LARGE` - File exceeds size limit
- `NO_FILE_PROVIDED` - No file in request
- `DOCUMENT_NOT_FOUND` - Document ID not found
- `PROCESSING_FAILED` - Processing error
- `INVALID_PARAMETERS` - Invalid request parameters
- `INTERNAL_ERROR` - Server error

## Development

### Adding a New Endpoint

1. Create controller function in `src/controllers/`
2. Add route in appropriate router in `src/routes/`
3. Add types in `src/types/index.ts` if needed
4. Write tests in `src/__tests__/`
5. Update this README

### Code Style

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## Testing

Tests are written using Jest and Supertest.

```bash
# Run all tests
npm test

# Run specific test file
npm test upload.test.ts

# Coverage report
npm run test:coverage
```

### Test Coverage Requirements

- Minimum 80% coverage for all metrics
- All new code must include tests
- Integration tests for all API endpoints

## Production Deployment

### Build

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Environment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to secure random string
- [ ] Set `LLM_PROVIDER` (groq recommended for FREE)
- [ ] Set proper `GROQ_API_KEY` or `GEMINI_API_KEY`
- [ ] Configure `CORS_ORIGINS`
- [ ] Set up proper logging destination
- [ ] Configure database (replace in-memory store)
- [ ] Set up Redis for caching
- [ ] Configure file storage (S3/R2)

## Roadmap

### Phase 1: MVP (COMPLETED ✅)
- [x] Document upload API
- [x] File validation
- [x] Basic error handling
- [x] PDF/TXT text extraction
- [x] Summary generation (brief, standard, detailed)
- [x] FREE LLM integration (Groq/Gemini)

### Phase 2: Content Generation
- [ ] Quiz generation
- [ ] Flashcard generation
- [ ] Multi-level summaries
- [ ] Batch processing

### Phase 3: Production Features
- [ ] PostgreSQL integration
- [ ] Redis caching
- [ ] Job queue (BullMQ)
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] S3 storage

### Phase 4: Advanced Features
- [ ] Webhook support
- [ ] Real-time progress
- [ ] Large document handling
- [ ] Next.js SDK

## Contributing

1. Follow the user stories in `USER_STORIES.md`
2. Write tests for all new code
3. Ensure code coverage stays above 80%
4. Update documentation
5. Follow TypeScript best practices

## License

MIT

## Support

For issues and questions, refer to the project documentation in the root directory.
