import Button from "../structures/Button";
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  TextChannel,
} from "discord.js";
import { ticketLogger } from "..";

export const staffButtons = new MessageActionRow().addComponents(
  new MessageButton()
    .setCustomId("ticketReopen")
    .setLabel("Re-Open Ticket")
    .setEmoji("🎟️")
    .setStyle("SUCCESS"),
  new MessageButton()
    .setCustomId("ticketSaveTranscript")
    .setLabel("Save Transcript")
    .setEmoji("💾")
    .setStyle("PRIMARY"),
  new MessageButton()
    .setCustomId("ticketDelete")
    .setLabel("Delete Ticket & Save Transcript")
    .setEmoji("🗑️")
    .setStyle("DANGER")
);

export default class TicketCloseButton extends Button {
  constructor() {
    super("ticketClose");
  }

  async exec(interaction: ButtonInteraction) {
    // if (interaction.message.embeds[0]?.footer?.text != interaction.user.tag)
    //   return interaction.reply({
    //     content: "You can't interact here.",
    //     ephemeral: true,
    //   });
    const channel = interaction.channel as TextChannel;

    await channel.permissionOverwrites.edit(
      await interaction.client.users.fetch(channel.name.split("-")[1]),
      {
        VIEW_CHANNEL: false,
      }
    );

    await interaction.reply({
      content: `${interaction.user} closed the ticket!`,
      components: [staffButtons],
    });

    // interaction.message.components.forEach((component) => {
    //   (component as MessageActionRow).components.forEach(
    //     (button: MessageButton) => {
    //       button.setDisabled();
    //     }
    //   );
    // });

    (interaction.message as Message).edit({
      components: interaction.message.components as MessageActionRow[],
    });

    ticketLogger.close(interaction.user);
  }
}
