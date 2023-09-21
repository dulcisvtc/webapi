import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { getSessionInfo, getUserDocumentBySteamId } from "../../database";
import Permissions from "../../lib/Permissions";
import { TMPService } from "../services/tmp.service";
import { EventsService } from "../services/events.service";

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
        private eventsService: EventsService,
        private tmpService: TMPService
    ) { };

    @WebSocketServer()
    server!: Server;

    logger = new Logger(EventsGateway.name);

    afterInit() {
        this.logger.log("Initialized");
    };

    @SubscribeMessage("get events")
    async getEvents(
        @ConnectedSocket() client: Socket
    ) {
        const access_token = client.handshake.headers.authorization?.split(" ")[1];
        if (!access_token) throw new WsException("Unauthorized");

        const session = await getSessionInfo(access_token);
        if (!session) throw new WsException("Unauthorized");

        const user = await getUserDocumentBySteamId(session.steamId);
        if (!user) throw new WsException("Unauthorized");

        const userPermissions = new Permissions(user.permissions);

        if (!userPermissions.has("ManageEvents")) throw new WsException("Unauthorized");

        const events = await this.eventsService.getEvents();

        const promises = events.map(async (event) => {
            const TMPEvent = (await this.tmpService.getEvent(event.id)).response;

            const wsEvent = {
                id: event.id,
                name: TMPEvent.name,
                banner: TMPEvent.banner,
                location: event.location,
                destination: event.destination,
                meetup: event.meetup,
                departure: event.departure,
                slot_id: event.slotId,
                slot_image: event.slotImage,
                notes: event.notes
            };

            client.emit("new event", wsEvent);
        });

        await Promise.all(promises);
    };
};