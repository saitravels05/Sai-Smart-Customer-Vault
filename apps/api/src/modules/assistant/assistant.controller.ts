import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AskAssistantDto } from '@sai/shared-types';

@Controller('v1/assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  async chat(@Body() dto: AskAssistantDto, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const response = await this.assistantService.askAssistant(dto, userContext);
    return {
      success: true,
      data: response,
    };
  }

  @Get('suggestions')
  async getSuggestions() {
    return {
      success: true,
      data: [
        'Show customers whose passports expire within 90 days',
        'Find Singapore visa customers from Madurai',
        'Show all flight tickets booked last month',
        'Find customer documents uploaded yesterday',
        'Show customers who travelled to Malaysia',
        'Summarize recent passport applications',
      ],
    };
  }
}
