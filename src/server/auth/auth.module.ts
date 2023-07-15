import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { PermissionsGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

@Module({
    controllers: [AuthController],
    providers: [
        AuthService,
        PermissionsGuard
    ],
    exports: [
        AuthService,
        PermissionsGuard
    ]
})
export class AuthModule { };