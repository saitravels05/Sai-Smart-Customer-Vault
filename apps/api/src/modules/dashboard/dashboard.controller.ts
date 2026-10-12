import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const kpis = await this.dashboardService.getExecutiveKpis(userContext);
    return {
      success: true,
      data: kpis,
    };
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };

    const analytics = await this.dashboardService.getDashboardAnalytics(userContext);
    return {
      success: true,
      data: analytics,
    };
  }
}
