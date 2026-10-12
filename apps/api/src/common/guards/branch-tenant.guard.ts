import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@sai/shared-types';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

export const REQUIRE_BRANCH_ACCESS_KEY = 'require_branch_access';
export const RequireBranchAccess = () => SetMetadata(REQUIRE_BRANCH_ACCESS_KEY, true);

@Injectable()
export class BranchTenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isEnforced = this.reflector.getAllAndOverride<boolean>(REQUIRE_BRANCH_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isEnforced) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Super Admin has multi-branch clearance across Madurai & Trichy
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Determine target branch from request params, query, body, or header
    const targetBranchId =
      request.params?.branchId ||
      request.query?.branchId ||
      request.body?.branchId ||
      request.headers['x-branch-id'];

    if (targetBranchId && user.branchId && targetBranchId !== user.branchId) {
      throw new ForbiddenException({
        message: 'Cross-branch data access denied. You are restricted to your assigned branch.',
        code: 'ERR_CROSS_BRANCH_FORBIDDEN',
        userBranch: user.branchName || user.branchId,
        targetBranch: targetBranchId,
      });
    }

    return true;
  }
}
