import { /* CacheInterceptor, */ CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
// import { APP_INTERCEPTOR } from "@nestjs/core";
import ms from "ms";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { RootModule } from "./root/root.module";
import { StaffModule } from "./staff/staff.module";
import { TMPModule } from "./tmp/tmp.module";
import { UserModule } from "./user/user.module";
import { UsersModule } from "./users/users.module";
import { WebhookModule } from "./webhook/webhook.module";

@Module({
    imports: [
        CacheModule.register({
            ttl: ms("1s"),
            isGlobal: true
        }),
        AuthModule,
        EventsModule,
        RootModule,
        StaffModule,
        TMPModule,
        UserModule,
        UsersModule,
        WebhookModule
    ],
    // providers: [{
    //     provide: APP_INTERCEPTOR,
    //     useClass: CacheInterceptor
    // }],
})
export class AppModule { };