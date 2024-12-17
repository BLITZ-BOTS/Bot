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

import type { Command, Event, Plugin, PluginConfig } from "../Types/Plugin.ts";
import { parse } from "npm:yaml@2.6.1";
import { Validators } from "../Validators/Validators.ts";
import { ModuleLoader } from "./ModuleLoader.ts";

/**
 * PluginLoader
 *
 * This class dynamically loads plugins from the `plugins` directory.
 */
export class PluginLoader {
  private readonly PluginsDir = `${Deno.cwd()}/plugins`;

  /**
   * Load all plugins concurrently from the plugins directory.
   * @returns {Promise<Plugin[]>} - Array of successfully loaded plugins.
   */
  async LoadPlugins(): Promise<Plugin[]> {
    try {
      const pluginDirs = await this.GetPluginDirectories();
      const pluginPromises = pluginDirs.map((pluginDir) =>
        this.LoadPluginFiles(pluginDir)
      );
      const loadedPlugins = await Promise.all(pluginPromises);

      // Filter out null values (failed plugins)
      return loadedPlugins.filter((plugin): plugin is Plugin => plugin !== null);
    } catch (error) {
      console.error("Critical failure while loading plugins:", error);
      return [];
    }
  }

  /**
   * Retrieve all directories within the plugins folder.
   * @returns {Promise<string[]>} - Names of plugin directories.
   */
  private async GetPluginDirectories(): Promise<string[]> {
    const directories: string[] = [];

    try {
      for await (const dirEntry of Deno.readDir(this.PluginsDir)) {
        if (dirEntry.isDirectory) directories.push(dirEntry.name);
      }
    } catch (error) {
      console.error("Failed to read plugins directory:", error);
    }

    return directories;
  }

  /**
   * Load all plugin files: config, commands, and events.
   * @param {string} pluginName - Name of the plugin directory.
   * @returns {Promise<Plugin | null>} - Loaded Plugin or null on failure.
   */
  private async LoadPluginFiles(pluginName: string): Promise<Plugin | null> {
    const pluginPath = `${this.PluginsDir}/${pluginName}`;

    try {
      const config = await this.LoadPluginConfig(pluginPath);
      if (!config) {
        console.warn(`Skipping plugin "${pluginName}" due to invalid config.`);
        return null;
      }

      const commands = await this.LoadPluginModules<Command>(
        `${pluginPath}/commands`,
        Validators.isCommand,
        "commands",
      );

      const events = await this.LoadPluginModules<Event>(
        `${pluginPath}/events`,
        Validators.isEvent,
        "events",
      );

      console.info(
        `Successfully loaded plugin: ${config.name} v${config.version}`,
      );

      return { config, commands, events };
    } catch (error) {
      console.error(`Error loading plugin "${pluginName}":`, error);
      return null;
    }
  }

  /**
   * Load and validate the plugin configuration.
   * @param {string} pluginPath - Path to the plugin directory.
   * @returns {Promise<PluginConfig | null>} - Plugin configuration or null.
   */
  private async LoadPluginConfig(pluginPath: string): Promise<PluginConfig | null> {
    const configPath = `${pluginPath}/blitz.config.yaml`;

    try {
      const rawConfig = await Deno.readTextFile(configPath);
      const parsedConfig = await parse(rawConfig);

      if (!Validators.isPluginConfig(parsedConfig)) {
        console.error(
          `Invalid config format in "${configPath}". Skipping plugin.`,
        );
        return null;
      }

      return {
        name: parsedConfig.name ?? "unknown",
        version: parsedConfig.version ?? "unknown",
        description: parsedConfig.description ?? "No description provided",
        config: parsedConfig.config ?? {},
      };
    } catch (error) {
      console.warn(`No valid config found at "${configPath}":`, error.message);
      return null;
    }
  }

  /**
   * Load and validate modules (commands or events) from a given directory.
   * @param {string} modulePath - Path to the modules directory.
   * @param {Function} validator - Validator function for the module type.
   * @param {string} moduleType - "commands" or "events" (for logging).
   * @returns {Promise<T[]>} - Array of valid modules.
   */
  private async LoadPluginModules<T>(
    modulePath: string,
    validator: (module: unknown) => boolean,
    moduleType: string,
  ): Promise<T[]> {
    try {
      const stats = await Deno.lstat(modulePath);
      if (!stats.isDirectory) return [];
    } catch {
      // Silently ignore missing module directories
      return [];
    }

    try {
      return await ModuleLoader.loadModulesFromDirectory<T>(
        modulePath,
        validator,
      );
    } catch (error) {
      console.error(`Failed to load ${moduleType} from "${modulePath}":`, error);
      return [];
    }
  }
}

