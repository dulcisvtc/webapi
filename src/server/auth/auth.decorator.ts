import { SetMetadata } from "@nestjs/common";
import type { PermissionResolvable } from "../../lib/Permissions";

export const PERMISSIONS_KEY = "permissions";
export const RequirePermissions = (...permissions: PermissionResolvable[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);