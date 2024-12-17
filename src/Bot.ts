import { Client, Collection, IntentsBitField } from "npm:discord.js@14.16.3";
import { REST } from "npm:@discordjs/rest@3.0.0-dev.1733443982-00dceb32b";
import { Routes } from "npm:discord-api-types@0.37.111-next.68e19d3.1733415378/v10";

import { PluginLoader } from "./Utils/PluginLoader.ts";
import type { Plugin, Command } from "./Types/Plugin.ts";

/**
 * Represents the main Bot class.
 * This class:
 * - Manages the bot client.
 * - Loads plugins dynamically.
 * - Registers commands/events.
 * - Interacts with Discord's API for slash commands.
 */
export class Bot {
  private client: Client;
  private readonly token: string;
  private plugins: Plugin[] = [];
  private commands: Collection<string, Command> = new Collection();

  constructor(token: string) {
    this.token = token;

    this.client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
      ],
    });

    this.client.once("ready", this.onReady.bind(this));
    this.client.on("interactionCreate", this.handleInteraction.bind(this));
  }

  /**
   * Starts the bot by logging in and loading plugins.
   */
  async start() {
    try {
      await this.loadPlugins();
      await this.registerCommands();
      await this.client.login(this.token);
    } catch (error) {
      console.error("❌ Failed to start the bot:", error);
    }
  }

  /**
   * Logs a success message when the bot is ready.
   */
  private onReady() {
    console.log(`✅ Bot is online as ${this.client.user?.tag}`);
  }

  /**
   * Loads plugins and registers their commands and events.
   */
  private async loadPlugins() {
    console.log("🔌 Loading plugins...");

    const loader = new PluginLoader();
    this.plugins = await loader.LoadPlugins();

    for (const plugin of this.plugins) {
      this.registerPluginCommands(plugin);
      this.registerPluginEvents(plugin);
    }

    console.log(`🔌 Successfully loaded ${this.plugins.length} plugins.`);
  }

  /**
   * Registers commands from a plugin into the bot's command collection.
   */
  private registerPluginCommands(plugin: Plugin) {
    for (const command of plugin.commands) {
      if (this.commands.has(command.data.name)) {
        console.warn(`⚠️ Command "${command.data.name}" is already registered.`);
        continue;
      }

      this.commands.set(command.data.name, command);
    }
  }

  /**
   * Registers events from a plugin into the bot's client.
   */
  private registerPluginEvents(plugin: Plugin) {
    for (const event of plugin.events) {
      const handler = (...args: unknown[]) => {
        event.action(this.client, plugin.config.config, ...args);
      };

      if (event.once) {
        this.client.once(event.event, handler);
      } else {
        this.client.on(event.event, handler);
      }
    }
  }

  /**
   * Registers slash commands with Discord's API.
   */
  private async registerCommands() {
    if (!this.client.user) {
      console.error("❌ Client is not ready. Aborting command registration.");
      return;
    }

    console.log("📜 Registering slash commands...");

    const rest = new REST({ version: "10" }).setToken(this.token);
    const commands = this.plugins.flatMap((plugin) =>
      plugin.commands.map((cmd) => cmd.data.toJSON())
    );

    try {
      await rest.put(Routes.applicationCommands(this.client.user.id), {
        body: commands,
      });
      console.log(`✅ Successfully registered ${commands.length} commands.`);
    } catch (error) {
      console.error("❌ Failed to register commands:", error);
    }
  }

  /**
   * Handles incoming interactions and executes the appropriate command.
   */
  private async handleInteraction(interaction: any) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`⚠️ Command "${interaction.commandName}" not found.`);
      return;
    }

    try {
      const plugin = this.plugins.find((p) =>
        p.commands.some((cmd) => cmd.data.name === interaction.commandName)
      );

      if (!plugin) throw new Error("Plugin not found.");

      await command.action(this.client, interaction, plugin.config.config);
    } catch (error) {
      console.error(
        `❌ Failed to execute command "${interaction.commandName}":`,
        error,
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "⚠️ There was an error executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "⚠️ There was an error executing this command!",
          ephemeral: true,
        });
      }
    }
  }
}
