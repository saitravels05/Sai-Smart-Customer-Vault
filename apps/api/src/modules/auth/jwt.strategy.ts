import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { prisma } from '@sai/database';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  branchId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'changeme_generate_min_32_char_access_secret_key_12345678',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        staffProfile: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is deactivated or no longer exists');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked due to repeated failed logins');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      staffProfileId: user.staffProfile?.id,
      fullName: user.staffProfile?.fullName,
      designation: user.staffProfile?.designation,
      branchId: user.staffProfile?.branchId,
      branchCode: user.staffProfile?.branch?.code,
      branchName: user.staffProfile?.branch?.name,
    };
  }
}
