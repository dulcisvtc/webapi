import type { APICompany, APIGameEvent, APIPlayer } from "@truckersmp_official/api-types/v2";
import axios from "axios";
import crypto from "crypto";
import type { GuildTextBasedChannel, Message, TextChannel } from "discord.js";

const bulks = new Map<string, Message[]>();
export function queueDelete(messages: Message[]): void {
  if (!messages.length) return;
  const channel = messages[0]!.channel as GuildTextBasedChannel;

  const bulk = bulks.get(channel.id);
  if (!bulk && messages.length === 1) {
    void messages[0]!.delete();
    bulks.set(channel.id, []);
  } else if (bulk) return void bulk.push(...messages);
  else bulks.set(channel.id, messages);

  return void setTimeout(() => bulkDelete(channel), 3500);
}

function bulkDelete(channel: GuildTextBasedChannel): void {
  const bulk = bulks.get(channel.id);
  if (!bulk?.length) return void bulks.delete(channel.id);

  if (bulk.length > 1) void channel.bulkDelete(bulk.slice(0, 100));
  else void bulk[0]!.delete();

  const newBulk = bulk.slice(100);
  if (!newBulk.length) return void bulks.delete(channel.id);

  bulks.set(channel.id, newBulk);
  return void setTimeout(() => bulkDelete(channel), 3500);
}

export async function getWebhook(channel: TextChannel, name: string) {
  const webhooks = await channel.fetchWebhooks();

  let webhook = webhooks.find((w) => w.name === name);
  if (!webhook)
    webhook = await channel.createWebhook({
      name,
      avatar: channel.client.user.displayAvatarURL(),
    });

  return webhook;
}

export const paginate = <T>(arr: T[], itemsPerPage: number): T[][] => {
  return arr.reduce<T[][]>((acc, val, i) => {
    const idx = Math.floor(i / itemsPerPage);
    const page = acc[idx] || (acc[idx] = []);
    page.push(val);

    return acc;
  }, []);
};

export const generateId = (length: number): string => {
  if (length < 1) return "";

  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

export const latestFromMap = <T>(map: Map<string, T>): [string, T | null] => {
  const keys = Array.from(map.keys());
  if (!keys.length) return ["", null];

  const latest = keys[keys.length - 1]!;

  return [latest, map.get(latest)!];
};

export const getTMPEvent = async (eventId: number): Promise<APIGameEvent> => {
  const res = await axios.get(`https://api.truckersmp.com/v2/events/${eventId}`, { retry: 3 });
  return res.data.response;
};

export const getTMPPlayer = async (tmpIdOrSteamId: string | number): Promise<APIPlayer> => {
  const res = await axios.get(`https://api.truckersmp.com/v2/player/${tmpIdOrSteamId}`, { retry: 3 });
  return res.data.response;
};

export const getTMPVTC = async (vtcId: number): Promise<APICompany> => {
  const res = await axios.get(`https://api.truckersmp.com/v2/vtc/${vtcId}`, { retry: 3 });
  return res.data.response;
};
