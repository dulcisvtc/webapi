import type { ChatInputCommandInteraction, Guild, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import type { Command } from "../../types";

export const commands = new Map<string, Command>();

export default function handleCommand(interaction: ChatInputCommandInteraction<"cached">) {
    const commandFile = require(`../commands/${interaction.commandName}`).default;

    commandFile.execute(interaction);
};

export function registerCommands(guild: Guild) {
    loadCommands();

    const cmds: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    for (const command of commands.values()) cmds.push(command.data);

    return guild.commands.set(cmds);
};

function loadCommands() {
    const commandFileNames = readdirSync(join(__dirname, "..", "commands")).filter((name) => name.endsWith(".js"));

    commandFileNames.map((name) => {
        const command = require(`../commands/${name}`).default as Command;

        commands.set(command.data.name, command);
    });
}