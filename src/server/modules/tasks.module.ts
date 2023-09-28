import { Module } from "@nestjs/common";
import { TasksGateway } from "../gateways/tasks.gateway";
import { TasksService } from "../services/tasks.service";

@Module({
    providers: [
        TasksGateway,
        TasksService
    ]
})
export class TasksModule { };