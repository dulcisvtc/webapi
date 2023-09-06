import type { Interaction } from "discord.js";
import handleAutocomplete from "../handlers/autocomplete";
import handleCommand from "../handlers/commands";

export default {
    execute: (interaction: Interaction<"cached">) => {
        if (interaction.isChatInputCommand()) return handleCommand(interaction);
        if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
    }
};