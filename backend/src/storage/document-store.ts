import { DocumentMetadata } from '../types';

/**
 * Simple in-memory document store
 * TODO: Replace with PostgreSQL in production
 */
class DocumentStore {
  private documents: Map<string, DocumentMetadata> = new Map();

  /**
   * Save document metadata
   */
  save(metadata: DocumentMetadata): void {
    this.documents.set(metadata.documentId, metadata);
  }

  /**
   * Get document metadata by ID
   */
  get(documentId: string): DocumentMetadata | undefined {
    return this.documents.get(documentId);
  }

  /**
   * Check if document exists
   */
  exists(documentId: string): boolean {
    return this.documents.has(documentId);
  }

  /**
   * Update document metadata
   */
  update(documentId: string, updates: Partial<DocumentMetadata>): boolean {
    const existing = this.documents.get(documentId);
    if (!existing) {
      return false;
    }

    this.documents.set(documentId, { ...existing, ...updates });
    return true;
  }

  /**
   * Delete document metadata
   */
  delete(documentId: string): boolean {
    return this.documents.delete(documentId);
  }

  /**
   * Get all documents for a specific user
   */
  getByUserId(userId: string): DocumentMetadata[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.userId === userId);
  }

  /**
   * Get document by ID and verify ownership
   */
  getByIdAndUserId(documentId: string, userId: string): DocumentMetadata | undefined {
    const doc = this.documents.get(documentId);
    if (doc && doc.userId === userId) {
      return doc;
    }
    return undefined;
  }

  /**
   * Get all documents (for testing/debugging)
   */
  getAll(): DocumentMetadata[] {
    return Array.from(this.documents.values());
  }

  /**
   * Clear all documents (for testing)
   */
  clear(): void {
    this.documents.clear();
  }
}

// Singleton instance
export const documentStore = new DocumentStore();
