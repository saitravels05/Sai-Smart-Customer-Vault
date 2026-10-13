import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ComplianceService, AuthenticatedUser } from './compliance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateConsentDto,
  createConsentSchema,
  RevokeConsentDto,
  revokeConsentSchema,
  AnonymizeCustomerDto,
  anonymizeCustomerSchema,
  AuditLogQueryDto,
  auditLogQuerySchema,
} from '@sai/shared-types';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('customers/:id/consents')
  async recordConsent(
    @Param('id') customerId: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: any,
  ): Promise<any> {
    const parsed = createConsentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid consent payload');
    }
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const consent = await this.complianceService.recordConsent(
      customerId,
      parsed.data,
      user,
      ipAddress,
    );
    return {
      success: true,
      data: consent,
    };
  }

  @Get('customers/:id/consents')
  async getConsents(
    @Param('id') customerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const consents = await this.complianceService.getConsents(customerId, user);
    return {
      success: true,
      data: consents,
    };
  }

  @Post('customers/:id/consents/:consentId/revoke')
  async revokeConsent(
    @Param('id') customerId: string,
    @Param('consentId') consentId: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: any,
  ): Promise<any> {
    const parsed = revokeConsentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid revocation payload');
    }
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await this.complianceService.revokeConsent(
      customerId,
      consentId,
      parsed.data,
      user,
      ipAddress,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('customers/:id/anonymize')
  async anonymizeCustomer(
    @Param('id') customerId: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: any,
  ): Promise<any> {
    const parsed = anonymizeCustomerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid anonymize payload');
    }
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await this.complianceService.anonymizeCustomer(
      customerId,
      parsed.data,
      user,
      ipAddress,
    );
    return result;
  }

  @Get('audit-logs')
  async queryAuditLogs(
    @Query() query: any,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const parsed = auditLogQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || 'Invalid audit query parameters');
    }
    const result = await this.complianceService.queryAuditLogs(parsed.data, user);
    return {
      success: true,
      data: result,
    };
  }

  @Get('audit-logs/verify-integrity')
  async verifyAuditTrailIntegrity(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const result = await this.complianceService.verifyAuditTrailIntegrity(user);
    return {
      success: true,
      data: result,
    };
  }
}
