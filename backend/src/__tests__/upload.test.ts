import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

describe('Document Upload API', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();

    // Ensure upload directory exists
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
  });

  describe('POST /api/v1/documents/upload', () => {
    it('should upload a valid PDF file', async () => {
      // Create a test PDF file
      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      const testFileContent = Buffer.from('%PDF-1.4 test content');

      // Ensure fixtures directory exists
      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const response = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.documentId).toMatch(/^doc_[a-zA-Z0-9]{16}$/);
      expect(response.body.filename).toBe('test.pdf');
      expect(response.body.mimeType).toBe('application/pdf');
      expect(response.body.fileSize).toBe(testFileContent.length);
      expect(response.body.status).toBe('uploaded');
      expect(response.body.uploadedAt).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should upload a valid TXT file', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test.txt');
      const testFileContent = 'This is a test text file';

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const response = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.mimeType).toBe('text/plain');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 400 for no file provided', async () => {
      const response = await request(app)
        .post('/api/v1/documents/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILE_PROVIDED');
    });

    it('should return 400 for invalid file type', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test.exe');
      fs.writeFileSync(testFilePath, 'executable content');

      const response = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 413 for file too large', async () => {
      // Create a file larger than the limit
      const testFilePath = path.join(__dirname, 'fixtures', 'large.pdf');
      const largeContent = Buffer.alloc(config.maxFileSizeBytes + 1000);
      fs.writeFileSync(testFilePath, largeContent);

      const response = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(response.status).toBe(413);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should sanitize filename with special characters', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test file!@#$.pdf');
      const testFileContent = Buffer.from('%PDF-1.4 test content');

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const response = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Original filename should be preserved in response
      expect(response.body.filename).toBe('test file!@#$.pdf');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should generate unique document IDs for multiple uploads', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      const testFileContent = Buffer.from('%PDF-1.4 test content');

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const response1 = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const response2 = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(response1.body.documentId).not.toBe(response2.body.documentId);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('GET /api/v1/documents/:id', () => {
    it('should retrieve document metadata', async () => {
      // First upload a document
      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      const testFileContent = Buffer.from('%PDF-1.4 test content');

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      // Now retrieve it
      const response = await request(app)
        .get(`/api/v1/documents/${documentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.documentId).toBe(documentId);
      expect(response.body.filename).toBe('test.pdf');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .get('/api/v1/documents/doc_nonexistent123');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('GET /api/v1/documents/:id/status', () => {
    it('should retrieve document status', async () => {
      // Upload a document first
      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      const testFileContent = Buffer.from('%PDF-1.4 test content');

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      const response = await request(app)
        .get(`/api/v1/documents/${documentId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('uploaded');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    it('should delete a document', async () => {
      // Upload a document first
      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      const testFileContent = Buffer.from('%PDF-1.4 test content');

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testFileContent);

      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      const response = await request(app)
        .delete(`/api/v1/documents/${documentId}`);

      expect(response.status).toBe(204);

      // Verify it's actually deleted
      const getResponse = await request(app)
        .get(`/api/v1/documents/${documentId}`);

      expect(getResponse.status).toBe(404);

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .delete('/api/v1/documents/doc_nonexistent123');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });
});
