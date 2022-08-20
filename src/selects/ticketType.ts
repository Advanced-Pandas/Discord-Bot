import { Embed } from "@discordjs/builders";
import {
  Message,
  MessageActionRow,
  MessageButton,
  SelectMenuInteraction,
  TextChannel,
} from "discord.js";
import Select from "../structures/Select";
import { createTranscriptEntry } from "../utils/notion";

export default class TicketTypeSelect extends Select {
  constructor() {
    super("ticketType");
  }

  async exec(interaction: SelectMenuInteraction) {
    const transcript = {
      title: interaction.user.tag,
      category: interaction.values[0],
    };

    const notionPage = await createTranscriptEntry(transcript);
    const newTicketName = `${interaction.values[0]}-${
      interaction.user.id
    }-${notionPage.id.split("-").join("")}`;
    await (interaction.channel as TextChannel)?.setName(newTicketName);

    (interaction.message as Message).delete();

    // switch (interaction.values[0]) {
    //   case "python101":
    //     await interaction.channel.send("<@&935091117966385173>");
    //     break;
    //   case "other":
    //     break;
    // }

    (interaction.channel as TextChannel).permissionOverwrites.edit(
      interaction.user.id,
      {
        SEND_MESSAGES: true,
      }
    );

    interaction.channel.send({
      embeds: [
        new Embed()
          .setTitle("Steps For Requesting Help")
          .setDescription(
            `1. **Say what your question is**, or what you need help with. What don't you understand?
2. **Post a screenshot of your assignment**. We need to make sure you're not asking for help on an assessment.
3. **Ping one of the helper roles** according to your question. For example, ping math helpers if you have a question related to math.
4. Please **be patient**, you will receive a response as soon as one of our helpers is available! 😄`
          )
          .setFooter({ text: "APandas, A Rad Study Group" }),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId("ticketClose")
            .setLabel("Close Ticket")
            .setEmoji("❌")
            .setStyle("DANGER")
        ),
      ],
    });
  }
}
