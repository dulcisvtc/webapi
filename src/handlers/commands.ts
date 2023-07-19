import type { ChatInputCommandInteraction, Guild, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import driver from "../commands/driver";
import drivers from "../commands/drivers";
import echo from "../commands/echo";
import lookup from "../commands/lookup";
import ping from "../commands/ping";
import user from "../commands/user";
import warn from "../commands/warn";

export default function handleCommand(interaction: ChatInputCommandInteraction<"cached">) {
    const command = commands.find((c) => c.data.name === interaction.commandName);
    if (!command) return;

    command.execute(interaction);
};

export function registerCommands(guild: Guild) {
    return guild.commands.set(commands.map((c) => c.data));
};

const commands: {
    data: RESTPostAPIChatInputApplicationCommandsJSONBody;
    execute: (interaction: ChatInputCommandInteraction<"cached">) => Promise<any>;
}[] = [
        driver,
        drivers,
        echo,
        lookup,
        ping,
        user,
        warn
    ];