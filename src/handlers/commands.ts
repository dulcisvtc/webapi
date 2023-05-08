import type { ChatInputCommandInteraction, Guild } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

export default function handleCommand(interaction: ChatInputCommandInteraction<"cached">) {
    const commandFile = require(`../commands/${interaction.commandName}`).default;

    commandFile.execute(interaction);
};

export function registerCommands(guild: Guild) {
    const commandFileNames = readdirSync(join(__dirname, "..", "commands")).filter((name) => name.endsWith(".js"));

    const commands = commandFileNames.map((name) => {
        const commandFile = require(`../commands/${name}`).default;

        return commandFile.data;
    });

    return guild.commands.set(commands);
};