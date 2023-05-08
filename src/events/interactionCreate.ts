import type { Interaction } from "discord.js";
import handleCommand from "../handlers/commands";

export default {
    execute: (interaction: Interaction<"cached">) => {
        if (interaction.isChatInputCommand()) return handleCommand(interaction);
    }
};