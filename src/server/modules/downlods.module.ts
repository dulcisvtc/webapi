import { Module } from "@nestjs/common";
import { DownloadsController } from "../controllers/downlods.controller";
import { DownloadsService } from "../services/downloads.service";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [DownloadsController],
  providers: [DownloadsService],
})
export class DownloadsModule {}
