import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchTenantGuard } from '../auth/guards/branch-tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService, AuthenticatedUser } from './documents.service';
import { DocumentCategory, DocumentType } from '@sai/database';
import { DocumentQueryFilter } from './dto/upload-document.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchTenantGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single document (Max 10MB; PDF, JPEG, PNG)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('A file must be attached.');
    }
    if (!body.customerId) {
      throw new BadRequestException('customerId is required.');
    }
    if (!body.category || !body.type) {
      throw new BadRequestException('category and type are required.');
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Vault-Client';

    const tags = body.tags
      ? Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim())
        : []
      : [];

    const result = await this.documentsService.uploadDocument(
      file,
      {
        customerId: body.customerId,
        category: body.category as DocumentCategory,
        type: body.type as DocumentType,
        title: body.title || file.originalname,
        description: body.description,
        tags,
        replaceDocumentId: body.replaceDocumentId,
      },
      user,
      ip,
      userAgent,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Document successfully secured in vault.',
      data: result,
    };
  }

  @Post('upload-batch')
  @ApiOperation({ summary: 'Batch upload up to 5 documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file must be attached.');
    }
    if (!body.customerId) {
      throw new BadRequestException('customerId is required.');
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Vault-Client';

    const category = (body.category as DocumentCategory) || DocumentCategory.IDENTITY_DOCUMENT;
    const type = (body.type as DocumentType) || DocumentType.OTHER;

    const results = await this.documentsService.uploadBatchDocuments(
      files,
      body.customerId,
      category,
      type,
      user,
      ip,
      userAgent,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: `Batch upload of ${results.length} documents completed successfully.`,
      data: results,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter documents in vault' })
  async listDocuments(
    @Query() query: DocumentQueryFilter,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.documentsService.listDocuments(query, user);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and version history' })
  async getDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.documentsService.getDocument(id, user);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Stream download document with optional watermarking' })
  async downloadDocument(
    @Param('id') id: string,
    @Query('watermark') watermark: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Vault-Client';

    const applyWatermark = watermark === 'true' || watermark === '1';

    const { buffer, mimeType, fileName } = await this.documentsService.downloadDocument(
      id,
      { watermark: applyWatermark },
      user,
      ip,
      userAgent,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileName)}"`,
    );
    res.end(buffer);
  }

  @Post('bulk-download')
  @ApiOperation({ summary: 'Bulk download selected documents as a compressed ZIP' })
  async bulkDownloadZip(
    @Body('documentIds') documentIds: string[],
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Vault-Client';

    const { buffer, zipFileName } = await this.documentsService.bulkDownloadZip(
      documentIds,
      user,
      ip,
      userAgent,
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(zipFileName)}"`,
    );
    res.end(buffer);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get document access and view audit logs' })
  async getAccessLogs(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.documentsService.getDocumentAccessLogs(id, user);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a document' })
  async archiveDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.documentsService.archiveDocument(id, user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Document successfully archived.',
      data,
    };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived document' })
  async restoreDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.documentsService.restoreDocument(id, user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Document successfully restored to active vault.',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a document from active view' })
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.documentsService.deleteDocument(id, user);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
