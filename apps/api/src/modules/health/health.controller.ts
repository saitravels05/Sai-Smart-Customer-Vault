import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API and service health status' })
  @ApiResponse({ status: 200, description: 'System health diagnostic payload' })
  checkHealth() {
    return {
      success: true,
      data: {
        service: 'SAI SMART CUSTOMER VAULT API',
        organization: 'SAI TOURS & TRAVELS',
        headOffice: 'Madurai, Tamil Nadu',
        branchOffice: 'Trichy, Tamil Nadu',
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptimeSeconds: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      },
    };
  }
}
