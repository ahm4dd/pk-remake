import chalk from "chalk";
import * as readline from "readline";
import { execSync } from "child_process";
import figlet from "figlet";
import { Commander } from "./commander.js";
import { initState } from "./state.js";
import { setTheme, getThemeColor, themes, currentTheme } from "./theme.js";
// Import command functions
import { commandExit } from "./commands/command_exit.js";
import { commandHelp } from "./commands/command_help.js";
import { commandMap } from "./commands/command_map.js";
import { commandMapb } from "./commands/command_mapb.js";
import { commandExplore } from "./commands/command_explore.js";
import { commandCatch } from "./commands/command_catch.js";
import { commandPokedex } from "./commands/command_pokedex.js";
import { commandRelease } from "./commands/command_release.js";
import { commandBattle } from "./commands/command_battle.js";
import { commandEvolve } from "./commands/command_evolve.js";
import { commandLearn } from "./commands/command_learn.js";

// Global error handlers for REPL stability
process.on('uncaughtException', (err) => {
  console.error(chalk.red('Uncaught error:'), err.message);
  resetTerminal();
  console.log(chalk.blue("REPL restarted due to error."));
  // Restart REPL if possible, but for now, exit
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled rejection at:'), promise, 'reason:', reason);
  resetTerminal();
  process.exit(1);
});

function resetTerminal() {
  try {
    execSync('stty sane', { stdio: 'inherit' });
  } catch {}
}

async function main() {
  console.log(chalk.bold.blue(figlet.textSync("Pokemon CLI", { horizontalLayout: 'full' })));
  console.log(chalk.yellow("🐾 Welcome to the Pokemon CLI! 🐾"));
  console.log(chalk.gray("Type 'help' for a list of commands or 'exit' to quit.\n"));

  const commander = new Commander();
  const state = initState();

  // Register commands
  commander.command('exit', 'Exits the Pokedex', 'System')
    .setAction(() => commandExit(state));

  commander.command('help', 'Displays a help message for all commands or a specific command.', 'System')
    .argument('command', 'The name of the command to get help for.', false)
    .setAction(async (args, options) => {
      if (args.length > 0) {
        const cmd = commander.getCommand(args[0]);
        if (cmd) {
          console.log(cmd.help());
        } else {
          console.log(chalk.red(`Command '${args[0]}' not found.`));
        }
      } else {
        commander.showHelp();
      }
    });

  commander.command('map', 'Show the next 20 locations in the Pokemon world.', 'Exploration')
    .setAction(async () => await commandMap(state));

  commander.command('mapb', 'Show the previous 20 locations in the Pokemon world.', 'Exploration')
    .setAction(async () => await commandMapb(state));

  commander.command('explore', 'Explore a location-area and display all encountered Pokemons.', 'Exploration')
    .argument('location_name', 'The name of the location area to explore.', true)
    .setAction(async (args) => {
      state.input.args = args;
      await commandExplore(state);
    });

  commander.command('catch', 'Tries to catch a Pokemon depending on a ball thrown. Available balls: pokeball (1x), greatball (1.5x), ultraball (2x).', 'Pokemon Management')
    .argument('pokemon_name', 'The name of the Pokemon to catch.', true)
    .argument('ball', 'The type of ball to use (pokeball, greatball, ultraball). Defaults to pokeball.', false)
    .option('balls', 'List all available ball types.', 'boolean')
    .setAction(async (args, options) => {
      state.input.args = args;
      state.input.options = options;
      await commandCatch(state);
    });

  commander.command('pokedex', 'Displays your caught Pokemon.', 'Pokemon Management')
    .option('sort', 'Sort by: index, name, level, exp.', 'string', 'index')
    .setAction(async (args, options) => {
      state.input.options = options;
      await commandPokedex(state);
    });

  commander.command('release', 'Releases a Pokemon from your party.', 'Pokemon Management')
    .argument('pokemon_name_or_index', 'The name or index of the Pokemon to release.', true)
    .setAction(async (args) => {
      state.input.args = args;
      await commandRelease(state);
    });

  commander.command('battle', 'Initiates a battle with a wild Pokemon.', 'Pokemon Management')
    .argument('pokemon_name', 'The name of the wild Pokemon to battle.', true)
    .setAction(async (args) => {
      state.input.args = args;
      await commandBattle(state);
    });

  commander.command('evolve', 'Evolves a Pokemon if it meets the criteria.', 'Pokemon Management')
    .argument('pokemon_name_or_index', 'The name or index of the Pokemon to evolve.', true)
    .setAction(async (args) => {
      state.input.args = args;
      await commandEvolve(state);
    });

  commander.command('learn', 'Teaches a move to a Pokemon.', 'Pokemon Management')
    .argument('pokemon_name_or_index', 'The name or index of the Pokemon.', true)
    .argument('move_name', 'The name of the move to learn.', true)
    .setAction(async (args) => {
      state.input.args = args;
      await commandLearn(state);
    });

  commander.command('theme', 'Changes the CLI theme.', 'System')
    .argument('theme_name', 'The theme to apply (default, pokemon, dark).', false)
    .setAction((args) => {
      const colorMap: Record<string, (text: string) => string> = {
        blue: chalk.blue,
        cyan: chalk.cyan,
        green: chalk.green,
        red: chalk.red,
        yellow: chalk.yellow,
        gray: chalk.gray,
        magenta: chalk.magenta,
        white: chalk.white,
      };

      const successColor = colorMap[getThemeColor('success')] || chalk.green;
      const errorColor = colorMap[getThemeColor('error')] || chalk.red;
      const infoColor = colorMap[getThemeColor('info')] || chalk.gray;

      if (args.length > 0) {
        if (setTheme(args[0])) {
          console.log(successColor(`Theme changed to ${args[0]}! 🎨`));
        } else {
          console.log(errorColor(`Unknown theme: ${args[0]}. Available: ${Object.keys(themes).join(', ')}`));
        }
      } else {
        const currentName = Object.keys(themes).find(t => themes[t] === currentTheme) || 'default';
        console.log(infoColor(`Current theme: ${currentName}`));
        console.log(infoColor(`Available themes: ${Object.keys(themes).join(', ')}`));
      }
    });

  const args = process.argv.slice(2);
  if (args.length > 0) {
    // Easter eggs
    if (args[0] === 'mewtwo') {
      console.log(chalk.magenta('🐾 Mewtwo appears! The legendary Pokemon watches silently... 🐾'));
      console.log(chalk.gray('Easter egg unlocked! 🎉'));
      process.exit(0);
    }
    if (args[0] === 'godmode') {
      console.log(chalk.yellow('🔥 God mode activated! All catches succeed! 🔥'));
      // Could set a flag, but for fun
      process.exit(0);
    }

    // Parse and execute command
    const { command, args: parsedArgs, options, help } = commander.parse(args);
    if (help && command) {
      console.log(command.help());
    } else if (command) {
      await command.action(parsedArgs, options);
    } else {
      console.log(chalk.red(`Unknown command: ${args[0]}`));
      commander.showHelp();
    }
    process.exit(0);
  } else {
    // Start REPL
    await startREPL(commander, state);
  }
}

async function startREPL(commander: Commander, state: any) {
  if (!process.stdin.isTTY) {
    // Piped input
    process.stdin.on('data', async (chunk) => {
      const input = chunk.toString().trim();
      if (input) {
        const args = input.split(/\s+/);
        const { command, args: parsedArgs, options, help } = commander.parse(args);

        try {
          if (help && command) {
            console.log(command.help());
          } else if (command) {
            await command.action(parsedArgs, options);
          } else {
            console.log(chalk.red(`Unknown command: ${args[0]}`));
            commander.showHelp();
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${(error as Error).message}`));
        }
      }
      process.exit(0);
    });
    return;
  }

  // Interactive mode with full control
  let currentLine = '';
  const prompt = chalk.bold.green("Pokedex > ");
  let isEchoDisabled = false;

  // Try to disable terminal echo
  try {
    execSync('stty -echo', { stdio: 'inherit' });
    isEchoDisabled = true;
  } catch (error) {
    console.warn(chalk.yellow('Warning: Terminal echo could not be disabled. Input may appear doubled. Try using a different terminal or run `stty -echo` manually.'));
    isEchoDisabled = false;
  }

  const redraw = () => {
    process.stdout.write('\r\x1b[K' + prompt + currentLine);
  };

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const cleanup = () => {
    if (isEchoDisabled) {
      try {
        execSync('stty echo', { stdio: 'inherit' });
      } catch {}
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.stdin.on('data', async (chunk) => {
    try {
      const char = chunk.toString();

      if (char === '\r' || char === '\n') {
        process.stdout.write('\n');
        const input = currentLine.trim();
        currentLine = '';

        if (input) {
          const args = input.split(/\s+/);
          const { command, args: parsedArgs, options, help } = commander.parse(args);

          try {
            if (help && command) {
              console.log(command.help());
            } else if (command) {
              await command.action(parsedArgs, options);
            } else {
              console.log(chalk.red(`Unknown command: ${args[0]}`));
              commander.showHelp();
            }
          } catch (error) {
            console.error(chalk.red(`Command error: ${(error as Error).message}`));
          }
        }

        process.stdout.write(prompt);
      } else if (char === '\u0003') { // Ctrl+C
        process.stdout.write('\n' + chalk.blue("Goodbye!") + '\n');
        cleanup();
        process.exit(0);
      } else if (char === '\u007f') { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          redraw();
        }
      } else if (char >= ' ' && char <= '~') { // Printable characters
        if (currentLine.length < 500) { // Prevent overflow
          currentLine += char;
          redraw();
        }
      }
    } catch (error) {
      console.error(chalk.red(`REPL error: ${(error as Error).message}`));
      resetTerminal();
      process.stdout.write(prompt);
      currentLine = '';
    }
  });
}

main();
