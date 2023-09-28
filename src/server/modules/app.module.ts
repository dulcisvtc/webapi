import { CacheInterceptor, CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { redisStore } from "cache-manager-redis-yet";
import type { RedisClientOptions } from "redis";
import config from "../../config";
import { PermissionsGuard } from "../guards/auth.guard";
import { AuthModule } from "./auth.module";
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
        AuthModule,
        CacheModule.register<RedisClientOptions>({
            store: redisStore,
            socket: {
                host: config.redis.host,
                port: config.redis.port
            },
            password: config.redis.password,
            isGlobal: true
        }),
        EventsModule,
        LeaderboardModule,
        RootModule,
        ScheduleModule.forRoot(),
        SlotsModule,
        StaffModule,
        TasksModule,
        TMPModule,
        UsersModule,
        WebhookModule
    ],
    providers: [{
        provide: APP_INTERCEPTOR,
        useClass: CacheInterceptor,
    }, {
        provide: APP_GUARD,
        useClass: PermissionsGuard
    }]
})
export class AppModule { };