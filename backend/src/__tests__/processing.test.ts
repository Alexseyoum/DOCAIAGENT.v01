import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

describe('Document Processing API', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();

    // Ensure upload directory exists
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
  });

  describe('POST /api/v1/documents/:id/process - PDF Processing (US-004)', () => {
    it('should extract text from a valid PDF file', async () => {
      // Create a test PDF file
      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      const testPDFContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Content) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000304 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
398
%%EOF`;

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testPDFContent);

      // First upload the document
      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(uploadResponse.status).toBe(200);
      const documentId = uploadResponse.body.documentId;

      // Now process it
      const processResponse = await request(app)
        .post(`/api/v1/documents/${documentId}/process`);

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.documentId).toBe(documentId);
      expect(processResponse.body.status).toBe('completed');
      expect(processResponse.body.wordCount).toBeGreaterThan(0);
      expect(processResponse.body.pageCount).toBeGreaterThan(0);
      expect(processResponse.body.extractedAt).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .post('/api/v1/documents/doc_nonexistent123/process');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('should handle corrupted PDF files gracefully', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'corrupted.pdf');
      const corruptedContent = Buffer.from('%PDF-1.4\nCorrupted content that is not valid PDF');

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, corruptedContent);

      // Upload the corrupted PDF
      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      // Try to process it
      const processResponse = await request(app)
        .post(`/api/v1/documents/${documentId}/process`);

      expect(processResponse.status).toBe(500);
      expect(processResponse.body.success).toBe(false);
      expect(processResponse.body.error.code).toBe('PROCESSING_FAILED');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('POST /api/v1/documents/:id/process - TXT Processing (US-007)', () => {
    it('should extract text from a TXT file', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test-content.txt');
      const testContent = `Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on developing systems that can learn from and make decisions based on data.

Key Concepts:
1. Supervised Learning
2. Unsupervised Learning
3. Reinforcement Learning

Conclusion:
Machine learning is transforming how we solve complex problems.`;

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testContent);

      // Upload the TXT file
      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(uploadResponse.status).toBe(200);
      const documentId = uploadResponse.body.documentId;

      // Process it
      const processResponse = await request(app)
        .post(`/api/v1/documents/${documentId}/process`);

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.documentId).toBe(documentId);
      expect(processResponse.body.status).toBe('completed');
      expect(processResponse.body.wordCount).toBeGreaterThan(30);
      expect(processResponse.body.extractedAt).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should handle empty TXT files', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'empty.txt');
      fs.writeFileSync(testFilePath, '');

      // Upload the empty TXT file
      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      // Process it
      const processResponse = await request(app)
        .post(`/api/v1/documents/${documentId}/process`);

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.wordCount).toBe(0);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('GET /api/v1/documents/:id/text', () => {
    it('should retrieve extracted text from processed PDF', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'sample.pdf');
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Sample Text) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000304 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
398
%%EOF`;

      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, pdfContent);

      // Upload and process
      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      await request(app)
        .post(`/api/v1/documents/${documentId}/process`);

      // Retrieve text
      const textResponse = await request(app)
        .get(`/api/v1/documents/${documentId}/text`);

      expect(textResponse.status).toBe(200);
      expect(textResponse.body.success).toBe(true);
      expect(textResponse.body.documentId).toBe(documentId);
      expect(textResponse.body.text).toBeDefined();
      expect(textResponse.body.wordCount).toBeGreaterThan(0);
      expect(textResponse.body.extractedAt).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 400 if document has not been processed', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'unprocessed.txt');
      fs.writeFileSync(testFilePath, 'Test content');

      // Upload but don't process
      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      const documentId = uploadResponse.body.documentId;

      // Try to get text
      const textResponse = await request(app)
        .get(`/api/v1/documents/${documentId}/text`);

      expect(textResponse.status).toBe(400);
      expect(textResponse.body.success).toBe(false);
      expect(textResponse.body.error.code).toBe('PROCESSING_FAILED');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .get('/api/v1/documents/doc_nonexistent123/text');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('DOCX Processing (US-005)', () => {
    it('should process DOCX files successfully', async () => {
      // Note: This test uses a minimal DOCX structure
      // Real DOCX files will work better, but this tests the integration
      const testFilePath = path.join(__dirname, 'fixtures', 'test.docx');

      // Create a minimal valid DOCX file structure (ZIP with document.xml)
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();

      // Add minimal Word document structure
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Test DOCX content for parsing</w:t></w:r></w:p>
  </w:body>
</w:document>`;

      zip.addFile('word/document.xml', Buffer.from(documentXml));
      zip.addFile('[Content_Types].xml', Buffer.from('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>'));
      zip.writeZip(testFilePath);

      const uploadResponse = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', testFilePath);

      expect(uploadResponse.status).toBe(200);
      const documentId = uploadResponse.body.documentId;

      const processResponse = await request(app)
        .post(`/api/v1/documents/${documentId}/process`);

      // DOCX processing should work now with US-005 implemented
      expect(processResponse.status).toBe(200);
      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.wordCount).toBeGreaterThan(0);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });
});
