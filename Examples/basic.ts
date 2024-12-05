import { Bot } from "@blitz-bots/bot";

const token = Deno.env.get("DISCORD_TOKEN");

if (!token) {
  console.error("DISCORD_TOKEN is not defined in the environment variables.");
  Deno.exit(1);
}

const bot = new Bot(token);

try {
  await bot.start();
} catch (error) {
  console.error("Failed to start the bot:", error);
}
