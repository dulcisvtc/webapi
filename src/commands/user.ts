import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import ms from "ms";
import {
  createSession,
  destroyUserSessions,
  getUserDocumentByDiscordId,
  getUserDocumentBySteamId,
  type UserDocument,
} from "../database";
import Permissions from "../lib/Permissions";

export default {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Manage DB users.")
    .addSubcommand((s) =>
      s
        .setName("permissions")
        .setDescription("Manage user permissions.")
        .addUserOption((o) => o.setName("user").setDescription("Discord user."))
        .addStringOption((o) => o.setName("steamid").setDescription("SteamID."))
    )
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Create user in DB.")
        .addUserOption((o) => o.setName("user").setDescription("Discord user.").setRequired(true))
        .addStringOption((o) => o.setName("steamid").setDescription("SteamID.").setRequired(true))
        .addStringOption((o) => o.setName("username").setDescription("Username.").setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName("delete")
        .setDescription("Delete user from DB.")
        .addUserOption((o) => o.setName("user").setDescription("Discord user."))
        .addStringOption((o) => o.setName("steamid").setDescription("SteamID."))
    )
    .addSubcommand((s) =>
      s
        .setName("createsession")
        .setDescription("Create a session for a user.")
        .addUserOption((o) => o.setName("user").setDescription("Discord user."))
        .addStringOption((o) => o.setName("steamid").setDescription("SteamID."))
        .addStringOption((o) => o.setName("lifetime").setDescription("Session lifetime."))
    )
    .toJSON(),
  execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
    switch (interaction.options.getSubcommand()) {
      case "permissions": {
        const user = interaction.options.getUser("user");
        const steamid = interaction.options.getString("steamid");

        if (!user && !steamid)
          return interaction.reply({ content: "You must specify either a Discord user or a SteamID.", ephemeral: true });

        let document: UserDocument | null = null;
        if (user) document = await getUserDocumentByDiscordId(user.id);
        else if (steamid) document = await getUserDocumentBySteamId(steamid, true);

        if (!document) return interaction.reply({ content: "User not found.", ephemeral: true });

        const opts = Object.entries(Permissions.Flags).map(([key, value]) => ({
          label: key,
          value: value.toString(),
          description: `(${value})`,
          default: new Permissions(document!.permissions).has(value),
        }));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("permissions")
            .setPlaceholder("Select a permission level")
            .addOptions(opts)
            .setMaxValues(opts.length)
        );

        const m = await interaction.reply({ content: "Select a permission level.", components: [row] });

        const collector = m.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: ms("30s") });

        collector.on("collect", async (i) => {
          await i.deferUpdate();

          const numbers = i.values.reduce((prev, curr) => prev + parseInt(curr), 0);

          const oldPerms = new Permissions(document!.permissions);
          const newPerms = new Permissions(numbers);

          document!.permissions = numbers;
          await document!.save();

          const embed = new EmbedBuilder()
            .setTitle("Permissions updated")
            .setDescription(
              [`**Old permissions:** ${oldPerms.toArray()}`, `**New permissions:** ${newPerms.toArray()}`].join("\n")
            );

          await i.editReply({ content: null, embeds: [embed], components: [] });
          collector.stop();
        });

        collector.on("end", async (_, r) => {
          if (r === "time") await m.edit({ content: "Timed out.", components: [] });
        });

        break;
      }

      case "create": {
        const user = interaction.options.getUser("user", true);
        const steamId = interaction.options.getString("steamid", true);
        const username = interaction.options.getString("username", true);

        let document = await getUserDocumentBySteamId(steamId, true);
        if (document) return interaction.reply({ content: "User already exists.", ephemeral: true });

        document = await getUserDocumentBySteamId(steamId);
        document!.discord_id = user.id;
        document!.username = username;
        await document!.save();

        await interaction.reply({ content: "User created." });

        break;
      }

      case "delete": {
        const user = interaction.options.getUser("user");
        const steamId = interaction.options.getString("steamid");

        if (!user && !steamId)
          return interaction.reply({ content: "You must specify either a Discord user or a SteamID.", ephemeral: true });

        let document: UserDocument | null = null;
        if (user) document = await getUserDocumentByDiscordId(user.id);
        else if (steamId) document = await getUserDocumentBySteamId(steamId, true);

        if (!document) return interaction.reply({ content: "User not found.", ephemeral: true });

        await interaction.deferReply();

        await destroyUserSessions(document.steam_id);
        await document.deleteOne();

        await interaction.editReply({ content: "User deleted." });

        break;
      }

      case "createsession": {
        const user = interaction.options.getUser("user");
        const steamId = interaction.options.getString("steamid");
        const lifetime = interaction.options.getString("lifetime");

        if (!user && !steamId)
          return interaction.reply({ content: "You must specify either a Discord user or a SteamID.", ephemeral: true });

        let document: UserDocument | null = null;
        if (user) document = await getUserDocumentByDiscordId(user.id);
        else if (steamId) document = await getUserDocumentBySteamId(steamId, true);

        if (!document) return interaction.reply({ content: "User not found.", ephemeral: true });

        const session = await createSession(document.steam_id, "https://picsum.photos/128", lifetime ?? undefined);

        await interaction.reply({
          content: [
            `Session created.`,
            `Expires in ${ms(session.expiresAt - Date.now(), { long: true })}.`,
            `Token: ||${session.access_token}||`,
          ].join("\n"),
          ephemeral: true,
        });

        break;
      }
    }

    return;
  },
};
