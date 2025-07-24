export interface ProjectDocument {
  id: string;
  projectId: number;
  documentName: string;
  content: string; // Markdown content
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  
  // Additional metadata
  tags?: string[];
  isPublic?: boolean;
  version?: number;
  
  // User information for display
  author?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  
  lastModifier?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface CreateDocumentRequest {
  projectId: number;
  documentName: string;
  content: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateDocumentRequest {
  documentName?: string;
  content?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changes: string; // Summary of changes
  createdAt: Date;
  createdBy: string;
  
  author?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface DocumentSearchResult {
  document: ProjectDocument;
  relevanceScore: number;
  matchedContent: string;
}