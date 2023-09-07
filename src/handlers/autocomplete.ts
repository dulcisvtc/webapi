import type { AutocompleteInteraction } from "discord.js";
import { commands } from "./commands";

export default function handleAutocomplete(interaction: AutocompleteInteraction<"cached">) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    if (command.autocomplete) command.autocomplete(interaction);
};