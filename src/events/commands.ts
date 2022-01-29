import discord, { MessageEmbed } from "discord.js";
import createLogger, { discordLogger } from "../utils/logger";

import { commands } from "..";
import Event from "../structures/Event";


export default class CommandHandler extends Event {
    constructor() { super("Command", "interactionCreate"); }

    exec(interaction: discord.Interaction) {
        if (!interaction.isCommand()) return;

        const commandName = interaction.commandName;
        const commandData = commands.get(commandName.toLowerCase());

        if (!commandData) {
            discordLogger.warn("Missing command '" + commandName + "'.");
            return;
        }

        if (commandData.options?.requiredPermissions) {
            const userPermissions = interaction.memberPermissions;
            if (!userPermissions) {
                return interaction.reply({
                    embeds: [new MessageEmbed().setTitle("").setDescription("You cannot use that command here.")]
                });
            }

            const missing = userPermissions.missing(commandData.options.requiredPermissions);
            if (missing.length > 0) {
                return interaction.reply({
                    embeds: [new MessageEmbed().setTitle("").setDescription(`You are lacking the following permission${missing.length > 1 ? "s" : ""}: ` + missing.map(p => `\`${p}\``).join(", "))],
                    ephemeral: true
                });
            }
        }

        try {
            commandData.exec(interaction);
        } catch (error) {
            const cmdLogger = createLogger(commandData.name);
            cmdLogger.error(`Failed to run command ${commandData.name}:`, error);
            cmdLogger.error(`Command ran by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guild?.name ?? "Not in guild"} (${interaction.guild?.id ?? "N/A"})`);
            cmdLogger.error("Command options:", interaction.options.resolved);
        }
    }
}