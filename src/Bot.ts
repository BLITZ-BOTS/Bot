/**
 * @module Bot
 *
 * This module defines the `Bot` class, which implements a modular, plugin-based Discord bot.
 * It manages the bot's lifecycle, event handling, and dynamic plugin and command registration.
 *
 * Key Features:
 * - **Plugin System**: Loads plugins dynamically to extend the bot's functionality.
 * - **Command Registration**: Registers slash commands to Discord's API.
 * - **Event Handling**: Supports both built-in and custom event handling through plugins.
 * - **Customizable Intents**: Users can specify custom intents during bot initialization to tailor the bot's functionality to their needs.
 *
 * Dependencies:
 * - discord.js: Used for interacting with the Discord API.
 * - @discordjs/rest: Utilized for RESTful interactions with Discord endpoints.
 * - PluginLoader: A custom utility class for loading plugins dynamically.
 * - Types/Plugin.ts: Defines the structure of plugins and commands.
 *
 * Usage:
 * Import and instantiate the `Bot` class, providing a Discord bot token.
 * Optionally, pass an array of custom intents to modify the bot's scope of operations.
 * Call the `start()` method to initialize and run the bot.
 *
 * @example
 * ```typescript
 * import { Bot } from './Bot';
 * import { IntentsBitField } from 'discord.js';
 *
 * // Using default intents
 * const bot = new Bot('your-discord-bot-token');
 * bot.start();
 *
 * // Using custom intents and custom plugin directory
 * const customIntents = [
 *     IntentsBitField.Flags.Guilds,
 *     IntentsBitField.Flags.GuildMessages,
 * ];
 * const customBot = new Bot({
 *     token: 'your-discord-bot-token',
 *     intents: customIntents,
 *     pluginsDir: './custom_plugins',
 * });
 * customBot.start();
 * ```
 *
 * Also, use `deno fmt` to format the files for consistent formatting.
 */

import {
  Client,
  IntentsBitField,
  Collection,
  REST,
  Routes,
  Interaction,
} from "npm:discord.js";
import { PluginLoader } from "./Utils/PluginLoader.ts";
import { Plugin, Command } from "./Types/Plugin.ts";

export class Bot {
  private readonly client: Client;
  private readonly token: string;
  private plugins: Plugin[] = [];
  private readonly commands: Collection<string, Command> = new Collection();
  private pluginsDir: string;

  constructor({
    token,
    intents,
    pluginsDir = `${Deno.cwd()}/plugins`,
  }: {
    token: string;
    intents?: IntentsBitField[];
    pluginsDir?: string;
  }) {
    this.token = token;
    this.pluginsDir = pluginsDir;

    const defaultIntents = [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildMembers,
    ];

    this.client = new Client({
      intents: intents || defaultIntents,
    });

    this.client.once("ready", () => {
      if (this.client.user) {
        console.log(`${this.client.user.username} is online!`);
      }
    });
  }

  async start() {
    await this.loadPlugins();
    this.registerEventHandlers();

    this.client.once("ready", async () => {
      await this.registerCommands();
    });

    await this.client.login(this.token);
    (this.client as any).token = undefined;
  }

  private async loadPlugins() {
    const pluginLoader = new PluginLoader(this.pluginsDir);
    this.plugins = await pluginLoader.LoadPlugins();

    for (const plugin of this.plugins) {
      for (const command of plugin.commands) {
        this.commands.set(command.data.name, command);
      }
    }
    console.info(
      `Loaded ${this.plugins.length} plugins with ${this.commands.size} commands`,
    );
  }

  private async registerCommands() {
    if (!this.client.user) {
      console.error(
        "Client user is not available. Commands registration aborted.",
      );
      return;
    }

    const rest = new REST({ version: "10" }).setToken(this.token);
    const commands = this.plugins.flatMap((plugin) =>
      plugin.commands.map((cmd) => cmd.data.toJSON())
    );

    try {
      await rest.put(Routes.applicationCommands(this.client.user.id), {
        body: commands,
      });
      console.info("Successfully registered application commands");
    } catch (error) {
      console.error("Failed to register application commands", error);
    }
  }

  private registerEventHandlers() {
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`Command ${interaction.commandName} not found.`);
        return;
      }

      try {
        const plugin = this.plugins.find((p) =>
          p.commands.some((cmd) => cmd.data.name === interaction.commandName)
        );
        if (!plugin) return;

        await command.action(this.client, interaction, plugin.config.config);
      } catch (error) {
        console.error(
          `Error executing command ${interaction.commandName}`,
          error,
        );
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error executing this command!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "There was an error executing this command!",
            ephemeral: true,
          });
        }
      }
    });

    for (const plugin of this.plugins) {
      for (const event of plugin.events) {
        const handler = (...args: unknown[]) =>
          event.action(this.client, plugin.config.config, ...args);
        if (event.once) {
          this.client.once(event.event, handler);
        } else {
          this.client.on(event.event, handler);
        }
      }
    }
  }
}