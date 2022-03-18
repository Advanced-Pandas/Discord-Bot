import SlashCommand from "../structures/Command";
import {
  CommandInteraction,
  GuildMember,
  MessageEmbed,
  User,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { moderationLogger } from "..";
import ms from "ms";
import Ban from "../models/ban";

export default class BanCommand extends SlashCommand {
  constructor() {
    super(
      new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bans the specified user from the server.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to ban.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription(
              "The duration of the ban. EX: (2 days, 1d, 10h, 2.5 hrs, 1m, 5s, 1y)"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the ban.")
            .setRequired(false)
        ),
      [
        {
          // moderator role
          id: "953053708994875526",
          type: "ROLE",
          permission: true,
        },
      ]
    );
  }

  async exec(interaction: CommandInteraction) {
    const userToBan = await interaction.guild.members.fetch(
      interaction.options.getUser("user")
    );

    const durationOption = interaction.options.getString("duration");
    const duration = durationOption ? ms(durationOption) : null;

    const reason =
      interaction.options.getString("reason") ?? "No reason given.";

    if (!userToBan) {
      return interaction.reply({
        content:
          "User is not in the server. Please try again with a valid user.",
        ephemeral: true,
      });
    }

    if (userToBan.id === (interaction.member as GuildMember).id) {
      return interaction.reply({
        content: "You can't ban yourself.",
        ephemeral: true,
      });
    }

    if (userToBan.id === interaction.client.user.id) {
      return interaction.reply({
        content: "I can't ban myself.",
        ephemeral: true,
      });
    }

    if (userToBan.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: "I can't ban the server owner.",
        ephemeral: true,
      });
    }

    if (
      userToBan.roles.highest.position >=
      (interaction.member as GuildMember).roles.highest.position
    ) {
      return interaction.reply({
        content: "You can't ban someone with a higher or equal role than you.",
        ephemeral: true,
      });
    }

    // store the user ban timer

    userToBan
      .ban({ reason })
      .then(async () => {
        const ban = await Ban.create({
          user: userToBan.id,
          moderator: (interaction.member as GuildMember).id,
          duration,
          reason,
        });

        await ban.save();

        if (duration)
          setTimeout(() => {
            interaction.guild.members.unban(userToBan);
          }, duration);

        await userToBan.send({
          embeds: [
            new MessageEmbed()
              .setTitle("You have been banned from APandas.")
              .setDescription(
                "To appeal, join the support server: https://discord.gg/VDTdzAaTjE\n" +
                  ban.duration &&
                  `You will be unbanned on ${new Date(
                    ban.createdAt + ban.duration
                  ).toUTCString()}`
              )
              .setFields([
                {
                  name: "Moderator",
                  value: interaction.user.tag,
                  inline: true,
                },
                {
                  name: "Reason",
                  value: reason,
                  inline: true,
                },
                {
                  name: "Duration",
                  value: ban.duration ? durationOption : "Permanent",
                  inline: true,
                },
              ]),
          ],
        });

        moderationLogger.ban(userToBan, interaction.user, reason);

        interaction.reply({
          embeds: [
            new MessageEmbed().setTitle("User Baned.").setFields([
              {
                name: "User",
                value: userToBan.toString(),
                inline: true,
              },
              {
                name: "Reason",
                value: reason,
                inline: true,
              },
              {
                name: "Duration",
                value: (duration && `${duration}ms`) ?? "Permanent",
                inline: true,
              },
            ]),
          ],
          ephemeral: true,
        });
      })
      .catch((e) => {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle("Ban Failed.")
              .setDescription(
                `${userToBan.displayName} could not be baned. ${e}`
              ),
          ],
          ephemeral: true,
        });
      });
  }
}
