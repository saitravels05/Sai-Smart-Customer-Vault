import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchIntentParser } from './search-intent-parser';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SmartSearchQueryDto, DocumentType, ServiceCategory } from '@sai/shared-types';

@Controller('v1/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') q: string,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('documentType') documentType?: DocumentType,
    @Query('serviceCategory') serviceCategory?: ServiceCategory,
    @Query('expiresWithinDays') expiresWithinDays?: string,
    @CurrentUser() user?: any,
  ) {
    const dto: SmartSearchQueryDto = {
      q: q || '',
      branchId,
      limit: limit ? parseInt(limit, 10) : 25,
      offset: offset ? parseInt(offset, 10) : 0,
      documentType,
      serviceCategory,
      expiresWithinDays: expiresWithinDays ? parseInt(expiresWithinDays, 10) : undefined,
    };

    const userContext = {
      userId: user?.id || user?.userId || 'system-searcher',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const results = await this.searchService.executeSmartSearch(dto, userContext);
    return {
      success: true,
      data: results,
    };
  }

  @Post('interpret')
  async interpret(@Body('q') q: string) {
    const intent = SearchIntentParser.parse(q || '');
    return {
      success: true,
      data: intent,
    };
  }
}
