import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  AddPassportDto,
  addPassportSchema,
  AddVisaDto,
  addVisaSchema,
  AddBookingDto,
  addBookingSchema,
  AddNoteDto,
  addNoteSchema,
  MergeCustomersDto,
  mergeCustomersSchema,
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

  @Get('bookings/all')
  @ApiOperation({ summary: 'List all travel bookings across customers with tenant scoping' })
  async listAllBookings(@CurrentUser() user: AuthenticatedUser) {
    const bookings = await this.customersService.listAllBookings(user);
    return {
      success: true,
      data: bookings,
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

  @Delete(':id/relationships/:relId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Remove relationship link' })
  async deleteRelationship(
    @Param('id') customerId: string,
    @Param('relId') relId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.customersService.deleteRelationship(customerId, relId, user);
    return {
      success: true,
      message: 'Relationship removed successfully',
      data: res,
    };
  }

  @Post(':id/passports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add passport to customer profile' })
  async addPassport(
    @Param('id') customerId: string,
    @Body(new ZodValidationPipe(addPassportSchema)) dto: AddPassportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const passport = await this.customersService.addPassport(customerId, dto, user);
    return {
      success: true,
      message: 'Passport added successfully',
      data: passport,
    };
  }

  @Delete(':id/passports/:passportId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete passport from customer profile' })
  async deletePassport(
    @Param('id') customerId: string,
    @Param('passportId') passportId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.customersService.deletePassport(customerId, passportId, user);
    return {
      success: true,
      message: 'Passport removed successfully',
      data: res,
    };
  }

  @Post(':id/visas')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add visa to customer profile' })
  async addVisa(
    @Param('id') customerId: string,
    @Body(new ZodValidationPipe(addVisaSchema)) dto: AddVisaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const visa = await this.customersService.addVisa(customerId, dto, user);
    return {
      success: true,
      message: 'Visa added successfully',
      data: visa,
    };
  }

  @Delete(':id/visas/:visaId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete visa from customer profile' })
  async deleteVisa(
    @Param('id') customerId: string,
    @Param('visaId') visaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.customersService.deleteVisa(customerId, visaId, user);
    return {
      success: true,
      message: 'Visa removed successfully',
      data: res,
    };
  }

  @Post(':id/bookings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add travel booking (flight/hotel) to customer' })
  async addBooking(
    @Param('id') customerId: string,
    @Body(new ZodValidationPipe(addBookingSchema)) dto: AddBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const booking = await this.customersService.addBooking(customerId, dto, user);
    return {
      success: true,
      message: 'Travel booking added successfully',
      data: booking,
    };
  }

  @Delete(':id/bookings/:bookingId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete travel booking' })
  async deleteBooking(
    @Param('id') customerId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.customersService.deleteBooking(customerId, bookingId, user);
    return {
      success: true,
      message: 'Booking removed successfully',
      data: res,
    };
  }

  @Post(':id/notes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add staff note to customer record' })
  async addNote(
    @Param('id') customerId: string,
    @Body(new ZodValidationPipe(addNoteSchema)) dto: AddNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.customersService.addCustomerNote(customerId, dto, user);
    return {
      success: true,
      message: 'Staff note added successfully',
      data: res,
    };
  }

  @Get(':id/duplicates')
  @ApiOperation({ summary: 'Find potential duplicate customer profiles' })
  async getDuplicates(
    @Param('id') customerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const duplicates = await this.customersService.getDuplicates(customerId, user);
    return {
      success: true,
      data: duplicates,
    };
  }

  @Post(':id/merge')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Merge duplicate customer into target profile' })
  async mergeCustomer(
    @Param('id') targetCustomerId: string,
    @Body(new ZodValidationPipe(mergeCustomersSchema)) dto: MergeCustomersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.customersService.mergeCustomers(targetCustomerId, dto, user);
    return {
      success: true,
      message: res.message,
      data: res,
    };
  }
}

