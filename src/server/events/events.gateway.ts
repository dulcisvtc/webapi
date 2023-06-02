import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { EventsService } from "./events.service";

@Injectable()
@WebSocketGateway({
    path: "/events",
    cors: {
        origin: "*"
    }
})
export class EventsGateway {
    constructor(
        @Inject(forwardRef(() => EventsService))
        private readonly eventsService: EventsService
    ) { };

    @WebSocketServer()
    server!: Server;

    logger = new Logger(EventsGateway.name);

    // store = new Map<string, StoreData>();

    afterInit() {
        this.logger.log("Initialized");
    };

    // handleConnection(
    //     @ConnectedSocket() client: Socket
    // ) {
    //     const userId = client.handshake.query["userId"] as string;

    //     this.store.set(userId, {
    //         socket: client,
    //         userId,
    //         hello: false
    //     });
    // };

    // handleDisconnect(
    //     @ConnectedSocket() client: Socket
    // ) {
    //     const userId = client.handshake.query["userId"] as string;
    //     this.store.delete(userId);
    // };

    @SubscribeMessage("get events")
    async getEvents(
        @ConnectedSocket() client: Socket
    ) {
        const events = await this.eventsService.getEvents();

        const promises = events.map(async (event) => {
            const TMPEvent = await this.eventsService.getTMPEvent(event.id);

            const wsEvent = {
                id: event.id,
                name: TMPEvent.name,
                banner: TMPEvent.banner,
                location: event.location,
                destination: event.destination,
                meetup: event.meetup,
                departure: event.departure,
                slot_id: event.slotId,
                slot_image: event.slotImage
            };

            client.emit("get events", wsEvent);
        });

        await Promise.all(promises);
    };
};

// interface StoreData {
//     socket: Socket;
//     userId: string;
//     hello: boolean;
// };