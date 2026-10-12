import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReminderType, ReminderChannel, ReminderStatus } from '@sai/shared-types';

@Controller('v1/reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  async getReminders(
    @Query('status') status?: ReminderStatus,
    @Query('type') type?: ReminderType,
    @Query('channel') channel?: ReminderChannel,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: any,
  ) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const filters = {
      status,
      type,
      channel,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const reminders = await this.remindersService.getReminders(userContext, filters);
    return {
      success: true,
      data: reminders,
    };
  }

  @Get('stats')
  async getStats(@CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const stats = await this.remindersService.getReminderStats(userContext);
    return {
      success: true,
      data: stats,
    };
  }

  @Post('scan')
  async triggerScan() {
    const report = await this.remindersService.scanAndGenerateReminders();
    return {
      success: true,
      data: report,
    };
  }

  @Post(':id/acknowledge')
  async acknowledge(@Param('id') id: string, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const updated = await this.remindersService.acknowledgeReminder(id, userContext);
    return {
      success: true,
      data: updated,
    };
  }

  @Post(':id/dismiss')
  async dismiss(@Param('id') id: string, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    await this.remindersService.dismissReminder(id, userContext);
    return {
      success: true,
      message: 'Reminder dismissed successfully.',
    };
  }

  @Post(':id/dispatch')
  async dispatch(@Param('id') id: string, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const result = await this.remindersService.dispatchReminder(id, userContext);
    return {
      success: result.success,
      data: result,
    };
  }
}
