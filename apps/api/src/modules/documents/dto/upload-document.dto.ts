import { DocumentCategory, DocumentType } from '@sai/shared-types';

export interface UploadDocumentDto {
  customerId: string;
  category: DocumentCategory;
  type: DocumentType;
  title: string;
  description?: string;
  tags?: string[];
  replaceDocumentId?: string; // If replacing an existing document to bump version
}

export interface BatchUploadDocumentDto {
  customerId: string;
  category: DocumentCategory;
  type: DocumentType;
  title?: string;
  tags?: string[];
}

export interface DocumentQueryFilter {
  customerId?: string;
  category?: DocumentCategory;
  type?: DocumentType;
  branchId?: string;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}
