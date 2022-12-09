import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("echo")
        .setDescription("Send a message.")
        .addStringOption((o) =>
            o.setName("message").setDescription("Message you want to send.").setMaxLength(2000).setRequired(true)
        )
        .addChannelOption((o) =>
            o.setName("channel").setDescription("Channel you want to send the message in.")
        )
        .setDefaultMemberPermissions(8)
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        const message = interaction.options.getString("message", true);
        const channel = interaction.options.getChannel("channel") ?? interaction.channel!;

        if (!channel.isTextBased() || channel.isDMBased()) return interaction.reply({
            content: "Can't send messages " + (channel.id === interaction.channelId ? "here." : "there."),
            ephemeral: true
        });

        await channel.send(message);

        return interaction.reply({
            content: `Sent the message to ${channel}.`,
            ephemeral: true
        });
    }
};