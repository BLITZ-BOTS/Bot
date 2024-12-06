import type { Command, Event, PluginConfig } from "../Types/Plugin.ts";

/**
 * @module Validators
 *
 * This module provides a set of static methods to validate the structure and type conformity
 * of various entities used in the plugin-based Discord bot framework.
 * The validations ensure that commands, events, and plugin configurations adhere to their
 * defined TypeScript interfaces.
 *
 * Key Features:
 * - **Command Validation**: Ensures objects conform to the `Command` type.
 * - **Event Validation**: Ensures objects conform to the `Event` type.
 * - **Plugin Configuration Validation**: Verifies that plugin configuration objects are properly structured.
 *
 * Usage:
 * Import the `Validators` class and use its static methods to validate unknown objects before
 * processing them as `Command`, `Event`, or `PluginConfig` types.
 *
 * @example
 * ```typescript
 * import { Validators } from './Utils/Validators';
 *
 * const unknownObject: unknown = getObject();
 * if (Validators.isCommand(unknownObject)) {
 *     console.log('Valid Command:', unknownObject.name);
 * }
 * ```
 *
 * Structure:
 * - **Static Methods**:
 *   - `isCommand(module: unknown): boolean`: Checks if the given object is a valid `Command`.
 *   - `isEvent(module: unknown): boolean`: Checks if the given object is a valid `Event`.
 *   - `isPluginConfig(config: unknown): boolean`: Verifies if the given object is a proper `PluginConfig`.
 *
 * Error Prevention:
 * Using these validators helps prevent runtime errors by ensuring objects are properly typed before usage.
 *
 * Type Definitions:
 * The `Command`, `Event`, and `PluginConfig` types are imported from the `../Types/Plugin.ts` module
 * and define the structure of these entities.
 */

export class Validators {
  static isCommand(module: unknown): module is Command {
    return !!(
      module &&
      typeof module === "object" &&
      "name" in module &&
      "description" in module &&
      "action" in module &&
      typeof (module as any).action === "function"
    );
  }

  static isEvent(module: unknown): module is Event {
    return !!(
      module &&
      typeof module === "object" &&
      module !== null &&
      typeof (module as Event).event === "string" &&
      (typeof (module as Event).once === "boolean" ||
        typeof (module as Event).once === "undefined") &&
      typeof (module as Event).action === "function"
    );
  }

  static isPluginConfig(config: unknown): config is PluginConfig {
    if (!config || typeof config !== "object") {
      return false;
    }

    const requiredFields = ["name", "version"];
    for (const field of requiredFields) {
      if (!(field in config)) {
        return false;
      }
    }

    const typedConfig = config as PluginConfig;

    // Validate required fields
    if (
      typeof typedConfig.name !== "string" ||
      typeof typedConfig.version !== "string"
    ) {
      return false;
    }

    // Optional fields: description and config
    const descriptionIsValid = typeof typedConfig.description === "string" ||
      typeof typedConfig.description === "undefined";
    const configIsValid = typeof typedConfig.config === "object" ||
      typeof typedConfig.config === "undefined";

    return descriptionIsValid && configIsValid;
  }
}
