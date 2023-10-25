import { Injectable, Logger } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server } from "socket.io";
import { getSessionInfo, getUserDocumentBySteamId } from "../../database";
import Permissions from "../../lib/Permissions";

@Injectable()
@WebSocketGateway({
  path: "/tasks",
  cors: {
    origin: "*",
  },
})
export class TasksGateway {
  constructor() {}

  @WebSocketServer()
  server!: Server;

  logger = new Logger(TasksGateway.name);

  afterInit() {
    this.logger.log("Initialized");

    this.server.on("connection", async (client) => {
      const token = client.handshake.query["token"] as string;
      if (!token) return client.disconnect();

      const session = await getSessionInfo(token);
      if (!session) return client.disconnect();

      const user = await getUserDocumentBySteamId(session.steamId);
      if (!user) return client.disconnect();

      const userPermissions = new Permissions(user.permissions);
      if (!userPermissions.has("ManageUsers")) return client.disconnect();

      return true;
    });
  }
}
