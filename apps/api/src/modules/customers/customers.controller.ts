import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateCustomerDto,
  createCustomerSchema,
  UpdateCustomerDto,
  updateCustomerSchema,
  CustomerFilterDto,
  customerFilterSchema,
  UserRole,
} from '@sai/shared-types';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('check-duplicate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if customer phone or name already exists in the system' })
  async checkDuplicate(
    @Body() body: { primaryPhone?: string; whatsappNumber?: string; fullName?: string },
  ) {
    const result = await this.customersService.checkDuplicate(body);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Register a new customer profile' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(
    @Body(new ZodValidationPipe(createCustomerSchema)) dto: CreateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const customer = await this.customersService.createCustomer(dto, user, ip, userAgent);
    return {
      success: true,
      message: 'Customer registered successfully',
      data: customer,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List and filter customers (scoped by branch clearance)' })
  @ApiResponse({ status: 200, description: 'Paginated customer list' })
  async list(
    @Query(new ZodValidationPipe(customerFilterSchema)) filter: CustomerFilterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.customersService.listCustomers(filter, user);
    return {
      success: true,
      data: result.customers,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve full customer profile details' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const customer = await this.customersService.getCustomerById(id, user);
    return {
      success: true,
      data: customer,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update customer details' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const customer = await this.customersService.updateCustomer(id, dto, user, ip, userAgent);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  @Post(':id/archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a customer record' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.customersService.archiveCustomer(id, user, ip, userAgent);
    return {
      success: true,
      message: 'Customer archived successfully',
      data: result,
    };
  }

  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived customer record' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.customersService.restoreCustomer(id, user, ip, userAgent);
    return {
      success: true,
      message: 'Customer restored to active status',
      data: result,
    };
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Retrieve chronological activity history of customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.customersService.getCustomerTimeline(id, user);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/relationships')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Link family member or group co-passenger' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async linkFamily(
    @Param('id') customerId: string,
    @Body() body: { relativeId: string; relationship: string; groupName?: string },
  ) {
    const rel = await this.customersService.linkRelationship(
      customerId,
      body.relativeId,
      body.relationship,
      body.groupName,
    );
    return {
      success: true,
      message: 'Relationship linked successfully',
      data: rel,
    };
  }
}
