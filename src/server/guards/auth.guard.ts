import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import Permissions, { type PermissionResolvable } from "../../lib/Permissions";
import { getUserFromRequest } from "../util";
import { PERMISSIONS_KEY } from "../decorators/auth.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<PermissionResolvable[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass()
        ])?.reduce((prev, curr) => Permissions.resolve(prev) + Permissions.resolve(curr), 0) as number ?? 0;
        if (!requiredPermissions) return true;

        const req = context.switchToHttp().getRequest<Request>();
        const user = await getUserFromRequest(req);
        if (!user) return false;

        const userPermissions = new Permissions(user.permissions);

        return userPermissions.has(requiredPermissions);
    };
};