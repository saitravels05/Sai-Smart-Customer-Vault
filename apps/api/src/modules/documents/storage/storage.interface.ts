export interface StorageFile {
  key: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  checksum: string;
}

export interface IStorageService {
  saveFile(key: string, buffer: Buffer, mimeType: string): Promise<{ key: string; size: number; checksum: string }>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
}
