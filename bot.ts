import { Config } from '@blitz-bots/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();
const commandRegistry: { [key: string]: string[] } = {};
const prefix = Config("prefix") || "!";

async function loadPlugins() {
  const pluginsPath = './plugins';

  for await (const folder of Deno.readDir(pluginsPath)) {
    if (folder.isDirectory) {
      const pluginPath = `${pluginsPath}/${folder.name}`;
      let pluginLoaded = true;

      const commandsPath = `${pluginPath}/commands`;
      try {
        for await (const file of Deno.readDir(commandsPath)) {
          if (file.isFile && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
            const commandModule = await import(`./${commandsPath}/${file.name}`);
            const command = commandModule.default;

            if (command && command.name) {
              if (command.name === "help") {
                console.warn(`Command "help" is restricted and will not be loaded from plugin ${folder.name}.`);
                continue;
              }

              if (commandRegistry[command.name]) {
                commandRegistry[command.name].push(folder.name);
                console.warn(`Duplicate command "${command.name}" found in plugins: ${commandRegistry[command.name].join(', ')}`);
              } else {
                commandRegistry[command.name] = [folder.name];
              }

              client.commands.set(command.name, command);
            } else {
              pluginLoaded = false;
              console.error(`Failed to load command in file ${file.name} from plugin ${folder.name}`);
            }
          }
        }
      } catch (e) {
        pluginLoaded = false;
        console.error(`Failed to load commands in ${folder.name}`, e);
      }

      const eventsPath = `${pluginPath}/events`;
      try {
        for await (const file of Deno.readDir(eventsPath)) {
          if (file.isFile && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
            const eventModule = await import(`./${eventsPath}/${file.name}`);
            const event = eventModule.default;

            if (event && event.event && event.action) {
              client.on(event.event, event.action.bind(null, client));
            } else {
              pluginLoaded = false;
              console.error(`Failed to load event in file ${file.name} from plugin ${folder.name}`);
            }
          }
        }
      } catch (e) {
        pluginLoaded = false;
        console.error(`Failed to load events in ${folder.name}`, e);
      }

      pluginLoaded
        ? console.log(`Loaded plugin: ${folder.name}`)
        : console.error(`Plugin ${folder.name} could not be loaded properly.`);
    }
  }
}

client.on('messageCreate', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);
  try {
    command.action(message, args);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
  }
});

await loadPlugins();
client.login(Config("token"));
