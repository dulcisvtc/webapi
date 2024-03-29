import { Injectable, NotFoundException, NotImplementedException, UnauthorizedException } from "@nestjs/common";
import OAuth from "discord-oauth2";
import type { Request } from "express";
import config from "../../config";
import {
  createSession,
  destroySession,
  getSessionInfo,
  getUserDocumentByDiscordId,
  getUserDocumentBySteamId,
  updateOrCreateLinkedRoleUser,
} from "../../database";
import type { PostAuthLoginResponse, PostAuthLogoutResponse, SessionInfoResponse, UserInfoResponse } from "../types/auth";
import { UsersService } from "./users.service";

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  discordOauth = new OAuth({
    clientId: config.discordOauth.clientId,
    clientSecret: config.discordOauth.clientSecret,
    redirectUri: config.discordOauth.redirectUri,
  });

  async loginWithDiscord(code: string, scope: string): Promise<PostAuthLoginResponse> {
    const token = await this.discordOauth.tokenRequest({
      code,
      scope,
      grantType: "authorization_code",
    });
    const discordUser = await this.discordOauth.getUser(token.access_token);

    const document = await getUserDocumentByDiscordId(discordUser.id);
    if (!document) throw new NotFoundException("User not found");

    document.avatar = discordUser.avatar;
    await document.save();

    const avatar_url = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;
    const session = await createSession(document.steam_id, avatar_url);
    await updateOrCreateLinkedRoleUser(discordUser.id, token.access_token, token.refresh_token);
    await this.usersService.updateUserMetadata(document.discord_id);

    return {
      access_token: session.access_token,
    };
  }

  async loginWithSteam(req: Request, code: string): Promise<PostAuthLoginResponse> {
    req;
    code;

    throw new NotImplementedException();

    // return { access_token: "steam" };
  }

  async logout(access_token: string): Promise<PostAuthLogoutResponse> {
    const isDeleted = await destroySession(access_token);

    return { message: isDeleted ? "logout" : "not logged in" };
  }

  async getSessionInfo(access_token: string): Promise<SessionInfoResponse> {
    const session = await getSessionInfo(access_token);

    if (!session) throw new UnauthorizedException();

    return {
      access_token: session.access_token,
      steamId: session.steamId,
      avatarUrl: session.avatarUrl,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  async getUserInfo(access_token: string): Promise<UserInfoResponse> {
    const session = await getSessionInfo(access_token);

    if (!session) throw new UnauthorizedException();

    const document = await getUserDocumentBySteamId(session.steamId, true);
    if (!document) throw new NotFoundException("User not found");

    return {
      steamId: document.steam_id,
      discordId: document.discord_id,
      username: document.username,
      avatarUrl: session.avatarUrl,
      permissions: document.permissions,
    };
  }

  async getUserDocument(access_token: string) {
    const session = await getSessionInfo(access_token);

    if (!session) throw new UnauthorizedException();

    const document = await getUserDocumentBySteamId(session.steamId);
    if (!document) throw new NotFoundException("User not found");

    return document;
  }
}
