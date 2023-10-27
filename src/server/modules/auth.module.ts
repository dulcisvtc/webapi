import { Module } from "@nestjs/common";
import { AuthController } from "../controllers/auth.controller";
import { PermissionsGuard } from "../guards/auth.guard";
import { AuthService } from "../services/auth.service";
import { UsersService } from "../services/users.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PermissionsGuard],
  exports: [AuthService, PermissionsGuard, UsersService],
})
export class AuthModule {}
