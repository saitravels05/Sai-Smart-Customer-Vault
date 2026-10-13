import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { prisma } from '@sai/database';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('System Health & Observability')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API and service health status' })
  @ApiResponse({ status: 200, description: 'System health diagnostic payload' })
  async checkHealth() {
    const mem = process.memoryUsage();
    return {
      success: true,
      data: {
        service: 'SAI SMART CUSTOMER VAULT API',
        organization: 'SAI TOURS & TRAVELS',
        headOffice: 'Madurai (+91 9894821561)',
        branchOffice: 'Trichy (+91 9894619921)',
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'production',
        nodeVersion: process.version,
        memoryUsage: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
      },
    };
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes/Container liveness probe' })
  checkLiveness() {
    return {
      status: 'ALIVE',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Deep readiness probe evaluating DB and Storage' })
  async checkReadiness() {
    let dbStatus = 'DISCONNECTED';
    let dbLatencyMs = 0;
    const startDb = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'CONNECTED';
      dbLatencyMs = Date.now() - startDb;
    } catch {
      dbStatus = 'DEGRADED';
    }

    let storageStatus = 'AVAILABLE';
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const testFile = path.join(uploadDir, '.probe_write_test');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      storageStatus = 'WRITABLE';
    } catch {
      storageStatus = 'READ_ONLY_OR_UNAVAILABLE';
    }

    const isReady = dbStatus === 'CONNECTED' && storageStatus === 'WRITABLE';

    return {
      status: isReady ? 'READY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          engine: 'PostgreSQL (Prisma + pgvector)',
        },
        vaultStorage: {
          status: storageStatus,
          directory: uploadDir,
          encryption: 'AES-256-GCM',
        },
        aiEngine: {
          status: 'CONFIGURED',
          model: 'Google Gemini 1.5 Flash + pgvector embeddings',
        },
        complianceEngine: {
          status: 'ACTIVE',
          dpdpa: 'v2023.1',
          uidaiMasking: 'ENFORCED',
        },
      },
    };
  }
}

