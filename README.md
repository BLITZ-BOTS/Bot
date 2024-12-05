# <img src="./blitz_bot.png">

This bot is designed to load and manage plugins dynamically, handling their
respective events and commands.

## Project Structure

The project is organized into a clear directory structure that separates the
core bot code, configuration, and plugin functionality. Each plugin can define
its own commands and events, making it easy to add or remove functionality as
needed.

```
.
├── bot.ts                  
└── plugins                
    └── plugin_1
        ├── blitz.config.yaml           
        ├── events          
        │   └── ready.ts    
        └── commands        
            └── ping.ts
```

### Explanation of Key Files and Directories

- **`bot.ts`**: The main entry point for the bot. This file is responsible for
  initializing the bot, loading configuration settings, and dynamically
  importing plugins along with their events and commands.
- **`plugins/`**: Contains all plugins. Each plugin is organized into
  subdirectories for `events` and `commands`, which helps in managing individual
  plugin functionality independently. Each plugin contains a `blitz.config.yaml`
  file which contains all metadata and config for a plugin.

---

### Example Plugin Structure

Each plugin follows a standardized structure within the `plugins/` folder. For
example:

```
plugin_1
├── blitz.config.yaml
├── events
│   └── ready.ts            
└── commands
    └── ping.ts
```

This structure helps keep the bot modular and scalable. Adding a new plugin is
as simple as creating a new folder under `plugins` and adding corresponding
event or command files.
