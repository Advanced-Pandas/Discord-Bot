import Button from "../structures/Button";
import {
  ButtonInteraction,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
} from "discord.js";
import { configIds, ticketLogger } from "..";

export default class TicketOpenButton extends Button {
  constructor() {
    super("ticketOpen");
  }

  async exec(interaction: ButtonInteraction) {
    const channel = await interaction.guild.channels.create(
      `ticket-${interaction.user.id}`,
      {
        type: "GUILD_TEXT",
        parent: configIds.ticketCategory,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
          },
          {
            id: configIds.tutorRole,
            allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
          },
          {
            id: interaction.guild.id,
            deny: ["VIEW_CHANNEL", "SEND_MESSAGES"],
          },
        ],
      }
    );

    channel.permissionOverwrites.edit(interaction.user.id, {
      VIEW_CHANNEL: true,
    });

    const embed = new MessageEmbed()
      .setTitle("Select a ticket type")
      .setDescription(
        "Please choose the course that corresponds with your inquiry (choose other if this doesn't apply to you)."
      )
      .setColor(0xa020f0);

    const select = new MessageSelectMenu()
      .setCustomId("ticketType")
      .setPlaceholder("Select a ticket type")
      .setOptions([
        { label: "Math", value: "math" },
        { label: "Science", value: "science" },
        { label: "Language", value: "language" },
        { label: "Humanities", value: "humanities" },
        { label: "Other", value: "other" },
      ]);

    channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [embed],
      components: [new MessageActionRow().addComponents(select)],
    });

    interaction.reply({
      content: `${interaction.user} Ticket created! <#${channel.id}>`,
      ephemeral: true,
    });

    ticketLogger.open(interaction.user);
  }
}
