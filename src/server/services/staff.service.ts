import { Injectable } from "@nestjs/common";
import { client } from "../..";
import { getGlobalDocument } from "../../database";

@Injectable()
export class StaffService {
  async getStaff(): Promise<Staff[]> {
    const document = await getGlobalDocument();

    const staff = await Promise.all(
      [...document.staff.values()].map(async (r) => ({
        name: r.name,
        color: r.color,
        members: await Promise.all(
          [...r.members.values()].map(async (m) => {
            const user = await client.users.fetch(m.id);

            return {
              name: m.name ?? user.username,
              avatar: user.displayAvatarURL({ extension: "png" }),
            };
          })
        ),
      }))
    );

    return staff;
  }
}

export interface Staff {
  name: string;
  color: string;
  members: {
    name: string;
    avatar: string;
  }[];
}
