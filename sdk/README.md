# Document Processing Agent - Next.js SDK

Official TypeScript SDK for integrating the Document Processing Agent into your Next.js applications.

## Features

- **Full TypeScript support** with complete type definitions
- **React Hooks** for easy integration with Next.js components
- **Webhook support** with signature verification
- **Automatic job polling** for async operations
- **Error handling** with custom error types
- **Works in both** Client and Server Components

## Installation

```bash
npm install @document-agent/nextjs-sdk
# or
yarn add @document-agent/nextjs-sdk
# or
pnpm add @document-agent/nextjs-sdk
```

## Quick Start

### 1. Create a client

```typescript
import { createClient } from '@document-agent/nextjs-sdk';

const client = createClient({
  baseUrl: 'http://localhost:3000',
  apiKey: process.env.DOCUMENT_AGENT_API_KEY, // Optional
  timeout: 30000, // Optional, default 30s
});
```

### 2. Upload a document

```typescript
// In a Server Component or API route
const result = await client.uploadDocument({
  file: fileBuffer,
  filename: 'document.pdf',
});

console.log('Document uploaded:', result.data);
```

### 3. Generate content

```typescript
// Generate a summary
const summaryJob = await client.generateSummary({
  documentId: 'doc_123',
  detailLevel: 'brief',
});

// Wait for the job to complete
const summaryResult = await client.waitForJob(summaryJob.data.jobId);
console.log('Summary:', summaryResult.data.summary);
```

## React Hooks

The SDK provides React hooks for common operations:

### useDocumentUpload

```typescript
'use client';

import { useDocumentUpload } from '@document-agent/nextjs-sdk';
import { client } from './client';

function UploadForm() {
  const { upload, isUploading, error, document } = useDocumentUpload(client);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    await upload({ file, filename: file.name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="file" required />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {document && <p>Uploaded: {document.filename}</p>}
    </form>
  );
}
```

### useDocuments

```typescript
'use client';

import { useDocuments } from '@document-agent/nextjs-sdk';
import { client } from './client';

function DocumentList() {
  const { documents, isLoading, error, refetch, deleteDocument } = useDocuments(client);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Documents</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            {doc.filename} - {doc.status}
            <button onClick={() => deleteDocument(doc.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useSummaryGeneration

```typescript
'use client';

import { useSummaryGeneration } from '@document-agent/nextjs-sdk';
import { client } from './client';

function SummaryGenerator({ documentId }: { documentId: string }) {
  const { generate, data, isGenerating, error } = useSummaryGeneration(client);

  const handleGenerate = () => {
    generate({
      documentId,
      detailLevel: 'brief',
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Summary'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <h3>Summary</h3>
          <p>{data.summary}</p>
        </div>
      )}
    </div>
  );
}
```

### useQuizGeneration

```typescript
'use client';

import { useQuizGeneration } from '@document-agent/nextjs-sdk';
import { client } from './client';

function QuizGenerator({ documentId }: { documentId: string }) {
  const { generate, data, isGenerating, error } = useQuizGeneration(client);

  const handleGenerate = () => {
    generate({
      documentId,
      questionCount: 10,
      difficulty: 'medium',
      questionTypes: ['multiple-choice', 'true-false'],
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Quiz'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <h3>Quiz Generated</h3>
          <pre>{JSON.stringify(data.quiz, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### useFlashcardsGeneration

```typescript
'use client';

import { useFlashcardsGeneration } from '@document-agent/nextjs-sdk';
import { client } from './client';

function FlashcardGenerator({ documentId }: { documentId: string }) {
  const { generate, data, isGenerating, error } = useFlashcardsGeneration(client);

  const handleGenerate = () => {
    generate({
      documentId,
      cardCount: 15,
      focusAreas: ['key-terms', 'concepts'],
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Flashcards'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <h3>Flashcards Generated</h3>
          <pre>{JSON.stringify(data.flashcards, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Webhooks

### Setting up webhooks

```typescript
// In a Server Component or API route
const webhook = await client.registerWebhook({
  url: 'https://your-app.com/api/webhooks',
  events: ['job.completed', 'document.processed'],
  metadata: { description: 'My webhook' },
});

console.log('Webhook registered:', webhook.data);
console.log('Secret (save this!):', webhook.data.secret);
```

### Creating a webhook handler

```typescript
// app/api/webhooks/route.ts
import { createWebhookHandler } from '@document-agent/nextjs-sdk';

const handler = createWebhookHandler({
  secret: process.env.WEBHOOK_SECRET!,
  onEvent: async (event, data) => {
    console.log('Received webhook event:', event);

    switch (event) {
      case 'job.completed':
        console.log('Job completed:', data);
        break;
      case 'document.processed':
        console.log('Document processed:', data);
        break;
      case 'summary.generated':
        console.log('Summary generated:', data);
        break;
      // Handle other events...
    }
  },
});

export const POST = handler;
```

### Manual webhook verification

```typescript
import { verifyWebhookSignature, parseWebhookPayload } from '@document-agent/nextjs-sdk';

export async function POST(request: Request) {
  const signature = request.headers.get('x-webhook-signature')!;
  const body = await request.text();

  const isValid = await verifyWebhookSignature(
    body,
    signature,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = await parseWebhookPayload(
    body,
    signature,
    process.env.WEBHOOK_SECRET!
  );

  // Process the payload
  console.log('Webhook event:', payload.event, payload.data);

  return new Response('OK', { status: 200 });
}
```

## API Reference

### Client Methods

#### Documents

- `uploadDocument(options)` - Upload a document
- `getDocument(documentId)` - Get document by ID
- `listDocuments()` - List all documents
- `deleteDocument(documentId)` - Delete a document

#### Generation

- `generateSummary(options)` - Generate a summary
- `generateQuiz(options)` - Generate a quiz
- `generateFlashcards(options)` - Generate flashcards

#### Jobs

- `getJobStatus(jobId)` - Get job status
- `getJobResult(jobId)` - Get job result
- `waitForJob(jobId, options)` - Wait for job completion with polling

#### Webhooks

- `registerWebhook(options)` - Register a webhook
- `listWebhooks()` - List all webhooks
- `getWebhook(webhookId)` - Get webhook by ID
- `updateWebhook(webhookId, updates)` - Update a webhook
- `deleteWebhook(webhookId)` - Delete a webhook
- `getWebhookDeliveries(webhookId, limit)` - Get webhook deliveries
- `getWebhookStats(webhookId)` - Get webhook statistics

#### Health

- `getHealth()` - Get basic health status
- `getDetailedHealth()` - Get detailed health with services

### Error Handling

```typescript
import { DocumentAgentError } from '@document-agent/nextjs-sdk';

try {
  await client.uploadDocument({ file, filename });
} catch (error) {
  if (error instanceof DocumentAgentError) {
    console.error('Error code:', error.code);
    console.error('Status code:', error.statusCode);
    console.error('Message:', error.message);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides complete type definitions for all methods and responses.

```typescript
import type {
  Document,
  SummaryResult,
  QuizResult,
  FlashcardsResult,
  Webhook,
  WebhookEvent,
  HealthStatus,
} from '@document-agent/nextjs-sdk';
```

## License

MIT
