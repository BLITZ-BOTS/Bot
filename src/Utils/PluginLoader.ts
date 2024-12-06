import type { Command, Event, Plugin, PluginConfig } from "../Types/Plugin.ts";
import { parse } from "npm:yaml@2.6.1";
import { Validators } from "../Validators/Validators.ts";
import { ModuleLoader } from "./ModuleLoader.ts";

/**
 * @module PluginLoader
 *
 * This module defines the `PluginLoader` class, responsible for dynamically loading plugins in a structured manner.
 * Each plugin can include a configuration file, commands, and events, which are loaded and validated before being added to the bot.
 *
 * Key Features:
 * - **Plugin Discovery**: Scans a dedicated `plugins` directory to discover and load plugins.
 * - **Configuration Parsing**: Reads and validates YAML-based plugin configuration files.
 * - **Dynamic Command and Event Loading**: Loads and validates command and event modules within each plugin.
 * - **Error Logging**: Provides detailed error messages for debugging when loading fails.
 *
 * Usage:
 * Create an instance of the `PluginLoader` and use its `LoadPlugins` method to retrieve all valid plugins.
 *
 * @example
 * ```typescript
 * import { PluginLoader } from './Utils/PluginLoader';
 *
 * const pluginLoader = new PluginLoader();
 * const plugins = await pluginLoader.LoadPlugins();
 * console.log('Loaded Plugins:', plugins);
 * ```
 *
 * Structure:
 * - **Public Methods**:
 *   - `LoadPlugins(): Promise<Plugin[]>`: Loads all plugins from the `plugins` directory and returns them as an array.
 *
 * - **Private Methods**:
 *   - `LoadPluginFiles(PluginName: string): Promise<Plugin | null>`:
 *     Loads and validates a specific plugin's files (configuration, commands, and events).
 *   - `LoadPluginConfig(PluginPath: string): Promise<PluginConfig | null>`:
 *     Reads and validates a plugin's `blitz.config.yaml` file for metadata and configuration.
 *   - `LoadPluginCommands(PluginPath: string): Promise<Command[]>`:
 *     Dynamically loads and validates all command modules in the plugin's `commands` directory.
 *   - `LoadPluginEvents(PluginPath: string): Promise<Event[]>`:
 *     Dynamically loads and validates all event modules in the plugin's `events` directory.
 *
 * Implementation Details:
 * - **Plugins Directory**: The loader assumes all plugins reside in a `plugins` directory at the root of the application.
 * - **File Formats**: Configuration files must be in YAML format (`blitz.config.yaml`), while commands and events are TypeScript modules.
 * - **Validation**: Uses the `Validators` module to ensure that configurations, commands, and events conform to the expected types.
 *
 * Error Handling:
 * - Logs meaningful error messages for each stage of the plugin loading process (configuration, commands, events).
 * - Skips invalid or incomplete plugins without terminating the overall process.
 *
 * Dependencies:
 * - `Deno.readDir` and `Deno.readTextFile`: For directory and file operations.
 * - `yaml`: For parsing YAML configuration files.
 * - `Validators`: For validating loaded modules against expected types.
 * - `ModuleLoader`: For dynamically importing commands and events.
 */

export class PluginLoader {
  private readonly PluginsDir = `${Deno.cwd()}/plugins`;

  async LoadPlugins(): Promise<Plugin[]> {
    const Plugins: Plugin[] = [];

    try {
      for await (const dirEntry of Deno.readDir(this.PluginsDir)) {
        if (dirEntry.isDirectory) {
          const Plugin = await this.LoadPluginFiles(dirEntry.name);
          if (Plugin) {
            Plugins.push(Plugin);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load plugins directory", error as Error);
    }
    return Plugins;
  }

  private async LoadPluginFiles(PluginName: string): Promise<Plugin | null> {
    try {
      const PluginPath = `${this.PluginsDir}/${PluginName}`;

      // Load the configuration, falling back to defaults for name and version
      const PluginConfigRaw = await this.LoadPluginConfig(PluginPath);
      const PluginConfig: PluginConfig = {
        name: PluginConfigRaw?.name ?? PluginName, // Use the folder name if missing
        version: PluginConfigRaw?.version ?? "unknown", // Default version
        description: PluginConfigRaw?.description ?? "No description provided",
        config: PluginConfigRaw?.config ?? {}, // Default empty object
      };

      if (!PluginConfig.name || !PluginConfig.version) {
        console.error(
          `Plugin ${PluginName} is missing mandatory fields: 'name' and/or 'version'. Skipping.`,
        );
        return null;
      }

      const PluginCommands = await this.LoadPluginCommands(PluginPath);
      const PluginEvents = await this.LoadPluginEvents(PluginPath);

      console.info(
        `Successfully loaded plugin: ${PluginConfig.name} v${PluginConfig.version}`,
      );

      return {
        config: PluginConfig,
        commands: PluginCommands,
        events: PluginEvents,
      };
    } catch (error) {
      console.error(
        `Failed to load plugin ${PluginName}`,
        error as Error,
      );
      return null;
    }
  }

  private async LoadPluginConfig(
    PluginPath: string,
  ): Promise<Partial<PluginConfig> | null> {
    try {
      const PluginConfigPath = `${PluginPath}/blitz.config.yaml`;
      const PluginConfigRAW = await Deno.readTextFile(PluginConfigPath);
      const PluginConfig = await parse(PluginConfigRAW);

      if (!Validators.isPluginConfig(PluginConfig)) {
        console.warn(
          "Invalid plugin configuration format; skipping validation.",
        );
        return null;
      }

      return PluginConfig;
    } catch (error) {
      console.warn(
        "No valid configuration file found; proceeding without config.",
        error as Error,
      );
      return null;
    }
  }

  private async LoadPluginCommands(PluginPath: string): Promise<Command[]> {
    const PluginCommandPath = `${PluginPath}/commands`;

    try {
      const stats = await Deno.lstat(PluginCommandPath);
      if (!stats.isDirectory) {
        return [];
      }
      return await ModuleLoader.loadModulesFromDirectory<Command>(
        PluginCommandPath,
        Validators.isCommand,
      );
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Silently return an empty array if the directory does not exist
        return [];
      }
      console.error(
        `Failed to load commands from: ${PluginCommandPath}`,
        error,
      );
      return [];
    }
  }

  private async LoadPluginEvents(PluginPath: string): Promise<Event[]> {
    const PluginEventPath = `${PluginPath}/events`;

    try {
      const stats = await Deno.lstat(PluginEventPath);
      if (!stats.isDirectory) {
        return [];
      }
      return await ModuleLoader.loadModulesFromDirectory<Event>(
        PluginEventPath,
        Validators.isEvent,
      );
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Silently return an empty array if the directory does not exist
        return [];
      }
      console.error(`Failed to load events from: ${PluginEventPath}`, error);
      return [];
    }
  }
}
