import { Bot } from "@blitz-bots/bot";
import { IntentsBitField } from "npm:discord.js@^14.16.3";

const token = Deno.env.get("DISCORD_TOKEN");

if (!token) {
  console.error("DISCORD_TOKEN is not defined in the environment variables.");
  Deno.exit(1);
}

const customIntents = [
  IntentsBitField.Flags.Guilds,
  IntentsBitField.Flags.GuildMessages,
  IntentsBitField.Flags.MessageContent,
];

const bot = new Bot(token, customIntents);

try {
  await bot.start();
} catch (error) {
  console.error("Failed to start the bot:", error);
}
