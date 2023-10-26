import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { redisStore } from "cache-manager-redis-yet";
import type { RedisClientOptions } from "redis";
import config from "../../config";
import { PermissionsGuard } from "../guards/auth.guard";
import { ThrottlerBehindProxyGuard } from "../guards/throttle.guard";
import { AuthModule } from "./auth.module";
import { DownloadsModule } from "./downlods.module";
import { EventsModule } from "./events.module";
import { LeaderboardModule } from "./leaderboard.module";
import { RootModule } from "./root.module";
import { SlotsModule } from "./slots.module";
import { StaffModule } from "./staff.module";
import { TasksModule } from "./tasks.module";
import { TMPModule } from "./tmp.module";
import { UsersModule } from "./users.module";
import { WebhookModule } from "./webhook.module";

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      isGlobal: true,
      ttl: 1,
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 4,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    DownloadsModule,
    EventsModule,
    LeaderboardModule,
    RootModule,
    ScheduleModule.forRoot(),
    SlotsModule,
    StaffModule,
    TasksModule,
    TMPModule,
    UsersModule,
    WebhookModule,
  ],
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}
