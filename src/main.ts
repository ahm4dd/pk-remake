import chalk from "chalk";
import * as readline from "readline";
import { execSync } from "child_process";
import figlet from "figlet";
import { Commander } from "./commander.js";
import { initState } from "./state.js";
import { setTheme, getThemeColor, themes, currentTheme } from "./theme.js";
import { UserManager } from "./user.js";
import { db } from "./database.js";
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

  commander.command('catch', 'Tries to catch a Pokemon depending on a ball thrown. Use --balls to see all available balls.', 'Pokemon Management')
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

  commander.command('register', 'Create a new user account.', 'System')
    .argument('username', 'Your desired username.', true)
    .argument('password', 'Your password.', true)
    .setAction(async (args) => {
      try {
        const user = await UserManager.register(args[0], args[1]);
        if (user) {
          state.currentUser = user;
          console.log(chalk.green(`Welcome, ${user.username}! Account created successfully.`));
        }
      } catch (error) {
        console.log(chalk.red(`Registration failed: ${(error as Error).message}`));
      }
    });

  commander.command('login', 'Log in to your account.', 'System')
    .argument('username', 'Your username.', true)
    .argument('password', 'Your password.', true)
    .setAction(async (args) => {
      try {
        const user = await UserManager.login(args[0], args[1]);
        if (user) {
          state.currentUser = user;
          console.log(chalk.green(`Welcome back, ${user.username}!`));
        }
      } catch (error) {
        console.log(chalk.red(`Login failed: ${(error as Error).message}`));
      }
    });

  commander.command('logout', 'Log out of your account.', 'System')
    .setAction(() => {
      if (state.currentUser) {
        console.log(chalk.yellow(`Goodbye, ${state.currentUser.username}!`));
        state.currentUser = null;
        state.player.pokemon = [];
      } else {
        console.log(chalk.yellow('You are not logged in.'));
      }
    });

  commander.command('profile', 'View your profile and stats.', 'System')
    .setAction(() => {
      if (state.currentUser) {
        const user = state.currentUser;
        const pokemonCount = db.getUserPokemon(user.id).length;
        const achievements = db.getUserAchievements(user.id);
        console.log(chalk.bold.blue(`Profile: ${user.username}`));
        console.log(`Level: ${user.level} (${user.xp} XP)`);
        console.log(`Pokemon Caught: ${pokemonCount}`);
        console.log(`Achievements Unlocked: ${achievements.length}`);
        console.log(`Member Since: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`Next Level: ${((user.level) * 100) - user.xp} XP needed`);
      } else {
        console.log(chalk.yellow('Please log in to view your profile.'));
      }
    });

  commander.command('theme', 'Changes the CLI theme.', 'System')
    .argument('theme_name', 'The theme to apply (default, pokemon, dark).', false)
    .setAction((args) => {
      const successColor = (text: string) => (chalk as any)[getThemeColor('success')](text);
      const errorColor = (text: string) => (chalk as any)[getThemeColor('error')](text);
      const infoColor = (text: string) => (chalk as any)[getThemeColor('info')](text);

      if (args.length > 0) {
        if (setTheme(args[0])) {
          console.log(successColor(`Theme changed to ${args[0]}! 🎨`));
        } else {
          console.log(errorColor(`Unknown theme: ${args[0]}. Available: ${Object.keys(themes).join(', ')}`));
        }
      } else {
        const currentName = Object.keys(themes).find(t => (themes as any)[t] === currentTheme) || 'default';
        console.log(infoColor(`Current theme: ${currentName}`));
        console.log(infoColor(`Available themes: ${Object.keys(themes).join(', ')}`));
      }
    });

  commander.command('shop', 'Buy items with XP.', 'System')
    .argument('item', 'Item to buy (ball types).', true)
    .argument('quantity', 'Quantity to buy.', false)
    .setAction((args) => {
      if (!state.currentUser) {
        console.log(chalk.red('Please log in to access the shop.'));
        return;
      }

      const item = args[0];
      const quantity = parseInt(args[1] || '1');
      const costPerItem = 100; // XP cost
      const totalCost = costPerItem * quantity;

      if (state.currentUser.xp < totalCost) {
        console.log(chalk.red(`Not enough XP! Need ${totalCost}, have ${state.currentUser.xp}.`));
        return;
      }

      // Deduct XP
      UserManager.updateXP(state.currentUser.id, -totalCost);

      // Add to inventory
      const currentQty = db.getInventory(state.currentUser.id).find(i => i.item_type === 'ball' && i.item_name === item)?.quantity || 0;
      db.updateInventory(state.currentUser.id, 'ball', item, currentQty + quantity);

      console.log(chalk.green(`Bought ${quantity} ${item}(s) for ${totalCost} XP!`));
    });

  commander.command('achievements', 'View your unlocked achievements.', 'System')
    .setAction(() => {
      if (!state.currentUser) {
        console.log(chalk.red('Please log in to view achievements.'));
        return;
      }

      const achievements = db.getUserAchievements(state.currentUser.id);
      if (achievements.length === 0) {
        console.log(chalk.yellow('No achievements unlocked yet. Keep playing!'));
      } else {
        console.log(chalk.bold.blue('🏆 Your Achievements:'));
        achievements.forEach(ach => {
          console.log(`- ${ach.achievement_name}`);
        });
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

  // Interactive mode: Simple loop with echo control
  const prompt = chalk.bold.green("Pokedex > ");
  let isEchoDisabled = false;

  // Try to disable terminal echo
  try {
    execSync('stty -echo', { stdio: 'inherit' });
    isEchoDisabled = true;
  } catch (error) {
    console.warn(chalk.yellow('Warning: Terminal echo could not be disabled. Input may appear doubled.'));
    isEchoDisabled = false;
  }

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

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const runCommand = async () => {
    try {
      rl.question(prompt, async (input) => {
        const trimmed = input.trim();
        if (trimmed === 'exit') {
          console.log(chalk.blue("Goodbye!"));
          rl.close();
          cleanup();
          return;
        }

        if (trimmed) {
          const args = trimmed.split(/\s+/);
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

        // Recurse for next command
        runCommand();
      });
    } catch (error) {
      console.error(chalk.red(`REPL error: ${(error as Error).message}`));
      cleanup();
      process.exit(1);
    }
  };

  runCommand();
}

main();
