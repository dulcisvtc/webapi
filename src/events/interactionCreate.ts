import type { Interaction } from "discord.js";
import handleCommand from "../handlers/commands";

export default {
    execute: (interaction: Interaction) => {
        if (interaction.isChatInputCommand()) return handleCommand(interaction as any);
    }
};