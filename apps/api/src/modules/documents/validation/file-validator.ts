import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import { DocumentCategory, DocumentType } from '@sai/shared-types';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

export interface ValidatedFileResult {
  buffer: Buffer;
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  size: number;
  sha256Checksum: string;
  storageKey: string;
}

export function validateMagicBytes(buffer: Buffer, originalMime: string): string {
  if (!buffer || buffer.length < 4) {
    throw new BadRequestException('Uploaded file is empty or corrupted.');
  }

  // Check PDF: %PDF (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // Check JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // Check PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  throw new BadRequestException(
    `Unsupported or disguised file format detected. Only valid PDF, JPEG, and PNG files with genuine magic bytes are allowed. Provided header does not match expected format for ${originalMime}.`,
  );
}

export function sanitizeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext);
  const cleanBase = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  return `${cleanBase || 'document'}${ext}`;
}

export function generateStorageKey(
  customerId: string,
  category: DocumentCategory,
  type: DocumentType,
  fileName: string,
): string {
  const year = new Date().getFullYear().toString();
  const fileUuid = crypto.randomUUID().slice(0, 8);
  const cleanName = sanitizeFileName(fileName);
  return `${customerId}/${year}/${category}/${type}/${fileUuid}_${cleanName}`;
}

export function validateUploadFile(
  file: Express.Multer.File,
  customerId: string,
  category: DocumentCategory,
  type: DocumentType,
): ValidatedFileResult {
  if (!file) {
    throw new BadRequestException('No file payload was uploaded.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `File exceeds maximum permitted size of 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
    );
  }

  const verifiedMime = validateMagicBytes(file.buffer, file.mimetype);
  const sha256Checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const sanitizedName = sanitizeFileName(file.originalname);
  const storageKey = generateStorageKey(customerId, category, type, sanitizedName);

  return {
    buffer: file.buffer,
    originalName: file.originalname,
    sanitizedName,
    mimeType: verifiedMime,
    size: file.size,
    sha256Checksum,
    storageKey,
  };
}
