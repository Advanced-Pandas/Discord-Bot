import { client, commands, configIds } from "..";
import Event from "../structures/Event";
import { discordLogger, mongoLogger } from "../utils/logger";
import mongoose from "mongoose";
import Bans from "../models/bans";
import Mutes from "../models/mutes";

export default class ReadyEvent extends Event {
  constructor() {
    super("Ready", "ready");
  }

  async exec() {
    mongoose
      .connect(process.env.MONGO, {
        keepAlive: true,
      })
      .then(() => {
        mongoLogger.info("Connected to MongoDB");
      })
      .catch((err) => {
        mongoLogger.error("Failed to connect to MongoDB:", err);
      });

    discordLogger.info(`🤖 Logged in as ${client?.user?.tag}!`);
    const guild = await client.guilds.fetch(configIds.guild);

    {
      Bans.find().then((bans) => {
        bans.forEach((ban) => {
          if (Date.parse(ban.createdAt) + ban.duration <= Date.now()) return;
          setTimeout(async () => {
            await guild.members.unban(ban.user);
          }, new Date(ban.createdAt).getTime() - Date.now() + ban.duration);
        });
      });

      Mutes.find().then((mutes) => {
        mutes.forEach((mute) => {
          if (Date.parse(mute.createdAt) + mute.duration <= Date.now()) return;
          setTimeout(async () => {
            await guild.members.cache
              .get(mute.user)
              .roles.remove(configIds.mutedRole);
          }, new Date(mute.createdAt).getTime() - Date.now() + mute.duration);
        });
      });
    }

    {
      if ("deploy".includes(process.argv[2])) {
        discordLogger.debug("Fetching application...");
        await guild.commands.fetch();
        discordLogger.debug(`Fetched ${guild.commands.cache.size} commands.`);
      }

      if (process.argv[2] === "deploy") {
        discordLogger.info("Deleting old commands...");
        await Promise.all(
          Array.from(guild.commands.cache.values()).map(async (command) => {
            return command.delete();
          })
        );
        discordLogger.info("Deleted old commands.");

        discordLogger.info(
          `Deploying ${commands.size} command${commands.size > 1 ? "s" : ""}...`
        );
        for (const command of commands.values()) {
          if (command.metaData.name === "example") continue;
          discordLogger.debug(`Deploying command ${command.metaData.name}...`);
          const guildCommand = await guild.commands.create(
            command.build(client)
          );
          console.log(guildCommand.permissions);
          if (command.userPermissions)
            await guildCommand.permissions.set({
              permissions: command.userPermissions,
            });
          discordLogger.debug(`Deployed command ${command.metaData.name}.`);
        }

        discordLogger.info(
          `Deployed ${commands.size} command${commands.size > 1 ? "s" : ""}.`
        );
      }
    }
  }
}
