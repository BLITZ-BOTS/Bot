# <img src="./blitz_bot.png">


This bot is designed to load and manage plugins dynamically, handling their respective events and commands. It leverages the configuration values specified in `config.json` through the [BLITZ Config package](https://jsr.io/@blitz-bots/config) to enhance modularity and maintainability.

## Project Structure

The project is organized into a clear directory structure that separates the core bot code, configuration, and plugin functionality. Each plugin can define its own commands and events, making it easy to add or remove functionality as needed.

```
.
├── bot.ts                  # Main bot initialization and plugin loader
├── config.json             # Configuration file used by the bot
└── plugins                 # Directory containing all plugins
    └── plugin_1            # Example plugin folder
        ├── events          # Folder for plugin-specific events
        │   └── ready.ts    # Ready event handler for the plugin
        └── commands        # Folder for plugin-specific commands
            └── ping.ts     # Ping command handler for the plugin
```

### Explanation of Key Files and Directories

- **`bot.ts`**: The main entry point for the bot. This file is responsible for initializing the bot, loading configuration settings, and dynamically importing plugins along with their events and commands.
- **`config.json`**: Stores configuration values for the bot, such as API keys, command prefixes, and other settings. These values are accessed using the [BLITZ Config package](https://jsr.io/@blitz-bots/config).
- **`plugins/`**: Contains all plugins. Each plugin is organized into subdirectories for `events` and `commands`, which helps in managing individual plugin functionality independently.

---

### Example Plugin Structure

Each plugin follows a standardized structure within the `plugins/` folder. For example:

```
plugin_1
├── events
│   └── ready.ts            # Code for handling the "ready" event
└── commands
    └── ping.ts             # Code for the "ping" command
```

This structure helps keep the bot modular and scalable. Adding a new plugin is as simple as creating a new folder under `plugins` and adding corresponding event or command files.

### Getting Started

To run the bot:
1. Ensure `config.json` is populated with the necessary configuration values.
2. Run the bot by executing the main file, `bot.ts`.
