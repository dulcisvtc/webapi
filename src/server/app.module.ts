import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PermissionsGuard } from "./auth/auth.guard";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { RootModule } from "./root/root.module";
import { SlotsModule } from "./slots/slots.module";
import { StaffModule } from "./staff/staff.module";
import { TMPModule } from "./tmp/tmp.module";
import { UserModule } from "./user/user.module";
import { UsersModule } from "./users/users.module";
import { WebhookModule } from "./webhook/webhook.module";

@Module({
    imports: [
        AuthModule,
        EventsModule,
        RootModule,
        SlotsModule,
        StaffModule,
        TMPModule,
        UserModule,
        UsersModule,
        WebhookModule
    ],
    providers: [{
        provide: APP_GUARD,
        useClass: PermissionsGuard
    }]
})
export class AppModule { };