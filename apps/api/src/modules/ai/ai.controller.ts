import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchTenantGuard } from '../../common/guards/branch-tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService, AuthenticatedUser } from './ai.service';
import { VerifyAiResultDto, verifyAiResultSchema } from '@sai/shared-types';

@ApiTags('AI Document Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchTenantGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract/:documentId')
  @ApiOperation({ summary: 'Queue and trigger AI document intelligence extraction job' })
  async triggerExtraction(
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const result = await this.aiService.triggerExtraction(documentId, user);
    return {
      statusCode: HttpStatus.OK,
      message: 'AI document intelligence extraction completed successfully.',
      data: result,
    };
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get AI extraction result and confidence scores by job ID' })
  async getJobResult(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const result = await this.aiService.getExtractionByJobId(jobId, user);
    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Get('document/:documentId')
  @ApiOperation({ summary: 'Get latest AI extraction result for a specific document' })
  async getLatestExtraction(
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const result = await this.aiService.getLatestExtractionForDocument(documentId, user);
    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify extracted AI data and auto-populate customer profile' })
  async verifyAndApply(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const parsed = verifyAiResultSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid verification payload.');
    }

    const result = await this.aiService.verifyAndApply(parsed.data, user);
    return {
      statusCode: HttpStatus.OK,
      ...result,
    };
  }
}
