import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { TotpService } from './totp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BranchTenantGuard } from '../../common/guards/branch-tenant.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'changeme_generate_min_32_char_access_secret_key_12345678',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TotpService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    BranchTenantGuard,
  ],
  exports: [
    AuthService,
    TotpService,
    JwtAuthGuard,
    RolesGuard,
    BranchTenantGuard,
  ],
})
export class AuthModule {}
