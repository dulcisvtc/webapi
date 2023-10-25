import type { Request } from "express";
import { UserDocument, getSessionInfo, getUserDocumentBySteamId } from "../database";

export const getUserFromRequest = async (request: Request): Promise<UserDocument | null> => {
  const access_token = request.headers.authorization?.split(" ")[1];
  if (!access_token) return null;

  const session = await getSessionInfo(access_token);
  if (!session) return null;

  const user = await getUserDocumentBySteamId(session.steamId);

  return user;
};
