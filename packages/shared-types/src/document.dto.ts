import { z } from 'zod';
import { DocumentCategory, DocumentType } from './enums.js';

export const initUploadSchema = z.object({
  customerId: z.string().uuid('Valid Customer ID is required'),
  category: z.nativeEnum(DocumentCategory),
  type: z.nativeEnum(DocumentType),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(1000).optional().nullable(),
  fileName: z.string().min(1, 'File name is required'),
  fileSizeBytes: z.number().int().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  sha256Checksum: z.string().length(64, 'SHA-256 checksum must be exactly 64 hex characters'),
  tags: z.array(z.string()).default([]),
});

export type InitUploadDto = z.infer<typeof initUploadSchema>;

export const completeUploadSchema = z.object({
  documentId: z.string().uuid('Valid Document ID is required'),
  storageKey: z.string().min(5, 'Valid storage key is required'),
});

export type CompleteUploadDto = z.infer<typeof completeUploadSchema>;

export const documentFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  type: z.nativeEnum(DocumentType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type DocumentFilterDto = z.infer<typeof documentFilterSchema>;

export interface DocumentResponseDto {
  id: string;
  customerId: string;
  branchId: string;
  category: DocumentCategory;
  type: DocumentType;
  title: string;
  description?: string | null;
  tags: string[];
  fileSizeBytes: number;
  mimeType: string;
  isMalwareClean: boolean;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}
