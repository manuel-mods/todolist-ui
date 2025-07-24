import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ProjectDocument,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentVersion,
  DocumentSearchResult
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private api = inject(ApiService);

  // Get all documents for a project
  getProjectDocuments(projectId: number): Observable<ProjectDocument[]> {
    return this.api.get<ProjectDocument[]>(`/projects/${projectId}/documents`);
  }

  // Get a specific document
  getDocument(documentId: string): Observable<ProjectDocument> {
    return this.api.get<ProjectDocument>(`/documents/${documentId}`);
  }

  // Create a new document
  createDocument(data: CreateDocumentRequest): Observable<ProjectDocument> {
    return this.api.post<ProjectDocument>(`/projects/${data.projectId}/documents`, data);
  }

  // Update an existing document
  updateDocument(documentId: string, data: UpdateDocumentRequest): Observable<ProjectDocument> {
    return this.api.put<ProjectDocument>(`/documents/${documentId}`, data);
  }

  // Delete a document
  deleteDocument(documentId: string): Observable<void> {
    return this.api.delete<void>(`/documents/${documentId}`);
  }

  // Get document versions/history
  getDocumentVersions(documentId: string): Observable<DocumentVersion[]> {
    return this.api.get<DocumentVersion[]>(`/documents/${documentId}/versions`);
  }

  // Get a specific version of a document
  getDocumentVersion(documentId: string, version: number): Observable<DocumentVersion> {
    return this.api.get<DocumentVersion>(`/documents/${documentId}/versions/${version}`);
  }

  // Restore a document to a specific version
  restoreDocumentVersion(documentId: string, version: number): Observable<ProjectDocument> {
    return this.api.post<ProjectDocument>(`/documents/${documentId}/restore/${version}`, {});
  }

  // Search documents within a project
  searchDocuments(projectId: number, query: string): Observable<DocumentSearchResult[]> {
    return this.api.get<DocumentSearchResult[]>(`/projects/${projectId}/documents/search?q=${encodeURIComponent(query)}`);
  }

  // Get documents by tag
  getDocumentsByTag(projectId: number, tag: string): Observable<ProjectDocument[]> {
    return this.api.get<ProjectDocument[]>(`/projects/${projectId}/documents/tags/${encodeURIComponent(tag)}`);
  }

  // Get all tags used in project documents
  getDocumentTags(projectId: number): Observable<string[]> {
    return this.api.get<string[]>(`/projects/${projectId}/documents/tags`);
  }

  // Duplicate a document
  duplicateDocument(documentId: string, newName?: string): Observable<ProjectDocument> {
    return this.api.post<ProjectDocument>(`/documents/${documentId}/duplicate`, { 
      newName: newName || undefined 
    });
  }

  // Export document as different formats
  exportDocument(documentId: string, format: 'html' | 'pdf' | 'markdown'): Observable<Blob> {
    return this.api.getBlob(`/documents/${documentId}/export/${format}`);
  }

  // Upload images for document content
  uploadDocumentImage(documentId: string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.post<{ url: string }>(`/documents/${documentId}/images`, formData);
  }
}