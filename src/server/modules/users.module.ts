import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { UsersController } from "../controllers/users.controller";
import { UsersProcessor } from "../processors/users.processor";
import { UsersService } from "../services/users.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "users",
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersProcessor],
})
export class UsersModule {}
