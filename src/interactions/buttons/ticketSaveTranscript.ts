import { ButtonInteraction, MessageAttachment } from "discord.js";
import { createTranscript } from "../../lib/transcripts";


export default async function (interaction: ButtonInteraction) {
	const transcriptFile = await createTranscript(interaction.channel) as MessageAttachment;

	interaction.reply({
		content: "Transcript has been saved.",
		files: [transcriptFile]
	});
}