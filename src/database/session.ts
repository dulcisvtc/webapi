import crypto from "crypto";
import ms from "ms";
import { Session, SessionDocument } from ".";
import { getLogger } from "../logger";

const dbLogger = getLogger("database", true);

export async function getSessionInfo(access_token: string) {
  const now = Date.now();

  const session = await Session.findOne({ access_token, expiresAt: { $gt: now } }).lean();
  if (!session) return null;

  return {
    access_token: session.access_token,
    steamId: session.steamId,
    avatarUrl: session.avatarUrl,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

export async function createSession(steamId: string, avatarUrl: string, lifetime?: string): Promise<SessionDocument> {
  const now = Date.now();

  const session = new Session({
    access_token: crypto.randomBytes(16).toString("hex"),
    steamId,
    avatarUrl,
    createdAt: now,
    expiresAt: now + ms(lifetime || "1d"),
  });

  await session.save();

  return session;
}

export async function destroySession(access_token: string): Promise<boolean> {
  const result = await Session.deleteOne({ access_token });

  return result.deletedCount === 1;
}

export async function destroyUserSessions(steamId: string): Promise<void> {
  const result = await Session.deleteMany({ steamId });

  dbLogger.debug(`Destroyed ${result.deletedCount} sessions for user ${steamId}`);
}
