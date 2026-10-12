import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LocalStorageService } from './storage/local-storage.service';
import { WatermarkService } from './watermark/watermark.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, LocalStorageService, WatermarkService],
  exports: [DocumentsService, LocalStorageService, WatermarkService],
})
export class DocumentsModule {}
