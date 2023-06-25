import crypto from "crypto";
import ms from "ms";
import { Session } from ".";
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
        expiresAt: session.expiresAt
    };
};

export async function createSession(steamId: string, avatarUrl: string): Promise<string> {
    const now = Date.now();

    const session = new Session({
        access_token: crypto.randomBytes(16).toString("hex"),
        steamId,
        avatarUrl,
        createdAt: now,
        expiresAt: now + ms("1m")
    });

    await session.save();

    return session.access_token;
};

export async function destroySession(access_token: string): Promise<boolean> {
    const result = await Session.deleteOne({ access_token });

    return result.deletedCount === 1;
};

export async function destroySessions(...userIds: string[]): Promise<void> {
    dbLogger.debug(`Destroying sessions for ${userIds.length} users`);

    await Session.deleteMany({ steamId: { $in: userIds } });
};