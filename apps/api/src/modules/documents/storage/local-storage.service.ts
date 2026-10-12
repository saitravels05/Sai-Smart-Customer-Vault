import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { IStorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly rootDirectory: string;

  constructor() {
    this.rootDirectory = process.env.STORAGE_LOCAL_ROOT
      ? path.resolve(process.env.STORAGE_LOCAL_ROOT)
      : path.resolve(process.cwd(), 'vault_storage');
  }

  private resolveSafePath(key: string): string {
    // Prevent path traversal
    const safeKey = key.replace(/\.\./g, '').replace(/^[/\\]+/, '');
    return path.join(this.rootDirectory, safeKey);
  }

  async saveFile(
    key: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<{ key: string; size: number; checksum: string }> {
    const fullPath = this.resolveSafePath(key);
    const directory = path.dirname(fullPath);

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    this.logger.log(`Stored document file at ${fullPath} (${buffer.length} bytes, SHA-256: ${checksum.slice(0, 10)}...)`);

    return {
      key,
      size: buffer.length,
      checksum,
    };
  }

  async getFile(key: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(key);
    try {
      return await fs.readFile(fullPath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(`File not found in vault storage: ${key}`);
      }
      throw err;
    }
  }

  async deleteFile(key: string): Promise<void> {
    const fullPath = this.resolveSafePath(key);
    try {
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async fileExists(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
