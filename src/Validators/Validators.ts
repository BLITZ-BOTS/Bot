import { SlashCommandBuilder } from "npm:discord.js@14.16.3";
import type { Command, Event, PluginConfig } from "../Types/Plugin.ts";

/**
 * @module Validators
 * 
 * This module provides static methods for validating the structure and type conformity of various entities.
 */
export class Validators {
  /**
   * Validates if the provided module is a Command.
   * @param module - The object to validate.
   * @returns True if the module is a Command, otherwise false.
   */
  static isCommand(module: unknown): module is Command {
    return (
      module !== null &&
      typeof module === "object" &&
      module.hasOwnProperty("data") &&
      module.hasOwnProperty("action") &&
      (module as Command).data instanceof SlashCommandBuilder &&
      typeof (module as Command).action === "function"
    );
  }

  /**
   * Validates if the provided module is an Event.
   * @param module - The object to validate.
   * @returns True if the module is an Event, otherwise false.
   */
  static isEvent(module: unknown): module is Event {
    if (module === null || typeof module !== "object") {
      return false;
    }

    const typedModule = module as Event;
    return (
      typeof typedModule.event === "string" &&
      (typeof typedModule.once === "boolean" || typedModule.once === undefined) &&
      typeof typedModule.action === "function"
    );
  }

  /**
   * Validates if the provided config is a PluginConfig.
   * @param config - The object to validate.
   * @returns True if the config is a PluginConfig, otherwise false.
   */
  static isPluginConfig(config: unknown): config is PluginConfig {
    if (config === null || typeof config !== "object") {
      return false;
    }

    const typedConfig = config as PluginConfig;
    const requiredFields = ["name", "version"];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in typedConfig)) {
        return false;
      }
    }

    if (
      typeof typedConfig.name !== "string" ||
      typeof typedConfig.version !== "string"
    ) {
      return false;
    }

    // Check optional fields
    const descriptionIsValid =
      typeof typedConfig.description === "undefined" ||
      typeof typedConfig.description === "string";
    const configIsValid =
      typeof typedConfig.config === "undefined" ||
      (typedConfig.config !== null && typeof typedConfig.config === "object");

    return descriptionIsValid && configIsValid;
  }
}
