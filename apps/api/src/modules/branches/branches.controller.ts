import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBranchDto, CreateStaffDto } from '@sai/shared-types';

@Controller('v1')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get('branches')
  async getAllBranches(@CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };
    const branches = await this.branchesService.getAllBranches(userContext);
    return {
      success: true,
      data: branches,
    };
  }

  @Post('branches')
  async createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };
    const branch = await this.branchesService.createBranch(dto, userContext);
    return {
      success: true,
      data: branch,
    };
  }

  @Get('branches/:id')
  async getBranchById(@Param('id') id: string, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };
    const branch = await this.branchesService.getBranchById(id, userContext);
    return {
      success: true,
      data: branch,
    };
  }

  @Get('branches/:id/staff')
  async getBranchStaff(@Param('id') branchId: string, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };
    const staff = await this.branchesService.getStaffMembers(branchId, userContext);
    return {
      success: true,
      data: staff,
    };
  }

  @Get('staff')
  async getAllStaff(@Query('branchId') branchId?: string, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };
    const staff = await this.branchesService.getStaffMembers(branchId, userContext);
    return {
      success: true,
      data: staff,
    };
  }

  @Post('staff')
  async createStaff(@Body() dto: CreateStaffDto, @CurrentUser() user?: any) {
    const userContext = {
      userId: user?.id || user?.userId || 'system-staff',
      role: user?.role || 'STAFF',
      branchId: user?.branchId || 'default-branch',
    };
    const staff = await this.branchesService.createStaffMember(dto, userContext);
    return {
      success: true,
      data: staff,
    };
  }
}
