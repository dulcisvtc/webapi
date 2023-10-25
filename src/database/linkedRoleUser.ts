import { LinkedRoleUser, LinkedRoleUserDocument } from ".";
//import { getLogger } from "../logger";

//const dbLogger = getLogger("database", true);

export async function getLinkedRoleUsers() {
  const linkedRoleUsers = await LinkedRoleUser.find().lean();
  if (!linkedRoleUsers) return null;

  return linkedRoleUsers;
}

export async function updateOrCreateLinkedRoleUser(
  discord_id: string,
  access_token: string,
  refresh_token: string
): Promise<LinkedRoleUserDocument> {
  const linkedRoleUser = await LinkedRoleUser.findOne({ discord_id });
  if (!linkedRoleUser) {
    const newLinkedRoleUser = new LinkedRoleUser({
      discord_id,
      access_token,
      refresh_token,
      lastRefreshed: new Date(),
    });

    await newLinkedRoleUser.save();

    return newLinkedRoleUser;
  } else {
    linkedRoleUser.access_token = access_token;
    linkedRoleUser.refresh_token = refresh_token;
    linkedRoleUser.lastRefreshed = new Date();

    await linkedRoleUser.save();

    return linkedRoleUser;
  }
}

export async function destroyLinkedRoleUser(discord_id: string): Promise<boolean> {
  const result = await LinkedRoleUser.deleteOne({ discord_id });

  return result.deletedCount === 1;
}
