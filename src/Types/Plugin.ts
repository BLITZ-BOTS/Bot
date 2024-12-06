import type { ChatInputCommandInteraction, Client } from "discord.js";

/**
 * @module PluginTypes
 *
 * This module defines TypeScript interfaces for the plugin architecture of the Discord bot framework.
 * These interfaces ensure that plugins, commands, and events follow a consistent and predictable structure,
 * enabling dynamic loading and integration.
 *
 * Interfaces:
 * - **PluginConfig**: Represents metadata and configuration options for a plugin.
 * - **Command**: Defines the structure and behavior of slash commands.
 * - **Event**: Describes custom or Discord events that plugins can handle.
 * - **Plugin**: Encapsulates a complete plugin, including its configuration, commands, and event handlers.
 *
 * Usage:
 * Import the required types for implementing plugins, commands, or event handlers.
 * These interfaces are essential for type-checking during plugin development and validation at runtime.
 *
 * @example - Command Implementation:
 * ```typescript
 * import type { Command } from '../Types/PluginTypes';
 *
 * const greetCommand: Command = {
 *     name: 'greet',
 *     description: 'Sends a friendly greeting!',
 *     action: async (interaction, config) => {
 *         await interaction.reply(`Hello, ${interaction.user.username}!`);
 *     },
 * };
 * ```
 *

 *
 * Interface Details:
 * - **PluginConfig**:
 *   - `name`: The name of the plugin.
 *   - `description`: A brief description of the plugin's functionality.
 *   - `version`: The version of the plugin.
 *   - `config`: A dictionary of plugin-specific configuration options.
 *
 * - **Command**:
 *   - `name`: The name of the slash command.
 *   - `description`: A brief description of the command's purpose.
 *   - `action`: A function that executes when the command is invoked.
 *     Receives the interaction and plugin configuration as arguments.
 *
 * - **Event**:
 *   - `event`: The name of the Discord event (e.g., `messageCreate`, `guildMemberAdd`).
 *   - `once` (optional): Whether the event should only fire once.
 *   - `action`: A function that executes when the event is triggered.
 *     Receives the client instance, plugin configuration, and event-specific arguments.
 *
 * - **Plugin**:
 *   - `config`: A `PluginConfig` object containing the plugin's metadata.
 *   - `commands`: An array of `Command` objects defining the plugin's slash commands.
 *   - `events`: An array of `Event` objects defining the plugin's event handlers.
 *
 * Purpose:
 * These interfaces are critical for ensuring a robust and modular plugin ecosystem within the bot framework.
 * By enforcing structure, they enable seamless integration of plugins and reduce runtime errors.
 */

export interface PluginConfig {
  name: string;
  description: string;
  version: string;
  config: Record<string, unknown>;
}

export interface Command {
  name: string;
  description: string;
  action: (
    client: Client,
    interaction: ChatInputCommandInteraction,
    config: Record<string, unknown>,
  ) => Promise<void>;
}

export interface Event {
  event: string;
  once?: boolean;
  action: (
    client: Client,
    config: Record<string, unknown>,
    ...args: unknown[]
  ) => Promise<void>;
}

export interface Plugin {
  config: PluginConfig;
  commands: Command[];
  events: Event[];
}
