import { documentStore } from '../storage/document-store';

// Clear document store before each test
beforeEach(() => {
  documentStore.clear();
});

// Global test timeout
jest.setTimeout(10000);
