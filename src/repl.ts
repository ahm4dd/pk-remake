import ReadLine from "node:readline";
import process from "node:process";
import chalk from "chalk";
import { type State, type CLICommand, Command, type CommandRegistry } from "./state.js";

// Helper functions for displaying help
function displayCommandHelp(command: CLICommand) {
  console.log(chalk.bold.blue(`\nCommand: ${command.name}`));
  console.log(chalk.yellow(`Usage: ${command.usage}`));
  console.log(chalk.white(command.description));
  if (command.arguments.length > 0) {
    console.log(chalk.green("Arguments:"));
    command.arguments.forEach(arg => {
      console.log(`  - ${chalk.cyan(arg.name)}: ${arg.description} ${arg.required ? chalk.red('(required)') : chalk.gray('(optional)')}`);
    });
  }
  if (command.options.length > 0) {
    console.log(chalk.green("Options:"));
    command.options.forEach(option => {
      console.log(`  - ${chalk.cyan(option.name)}: ${option.description}`);
    });
  }
  console.log(chalk.green("Examples:"));
  command.examples.forEach(example => {
    console.log(`  - ${chalk.magenta(example)}`);
  });
  console.log();
}

function displayGeneralHelp(commands: CommandRegistry) {
  console.log(chalk.bold.blue("\nAvailable commands:"));

  const categories: Record<string, { emoji: string; cmds: CLICommand[] }> = {
    "System": { emoji: "⚙️", cmds: [] },
    "Exploration": { emoji: "🗺️", cmds: [] },
    "Pokemon Management": { emoji: "🐾", cmds: [] },
  };

  for (const cmdName in commands) {
    const cmd = commands[cmdName as Command];
    categories[cmd.category].cmds.push(cmd);
  }

  for (const [category, { emoji, cmds }] of Object.entries(categories)) {
    if (cmds.length > 0) {
      console.log(chalk.yellow(`\n${emoji} ${category}:`));
      cmds.forEach(cmd => {
        console.log(`  ${chalk.cyan(cmd.name)}: ${cmd.description}`);
      });
    }
  }

  console.log(chalk.gray("\nType 'help <command>' for more information on a specific command."));
  console.log(chalk.gray("Type 'exit' to quit the application.\n"));
}

export function cleanInput(input: string): string[] {
  return input
    .toLowerCase()
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
}

export function parseInput(input: string, commandRegistry: CommandRegistry): { command: CLICommand | undefined; parsedArgs: string[]; parsedOptions: Record<string, any>; error?: string } {
  const cleanedInput = cleanInput(input);
  if (cleanedInput.length === 0) {
    return { command: undefined, parsedArgs: [], parsedOptions: {}, error: "No input provided." };
  }

  const commandName = cleanedInput[0] as Command;
  const command = commandRegistry[commandName];

  if (!command) {
    return { command: undefined, parsedArgs: [], parsedOptions: {}, error: `Unknown command: ${commandName}` };
  }

  const rawArgs = cleanedInput.slice(1);
  const parsedArgs: string[] = [];
  const parsedOptions: Record<string, any> = {};

  // Apply default values for options
  for (const option of command.options) {
    if (option.defaultValue !== undefined) {
      parsedOptions[option.name] = option.defaultValue;
    }
  }

  let i = 0;
  while (i < rawArgs.length) {
    const arg = rawArgs[i];
    let matchedOption = false;

    // Check for options
    for (const option of command.options) {
      if (arg === `--${option.name}` || (option.alias && arg === `-${option.alias}`)) {
        if (option.type === 'boolean') {
          parsedOptions[option.name] = true;
        } else if (option.type === 'string' || option.type === 'number') {
          const value = rawArgs[i + 1];
          if (value === undefined) {
            return { command, parsedArgs, parsedOptions, error: `Option --${option.name} requires a value.` };
          }
          parsedOptions[option.name] = option.type === 'number' ? parseFloat(value) : value;
          i++; // Skip the next argument as it's the option's value
        }
        matchedOption = true;
        break;
      }
    }

    // If it's not an option, treat it as an argument
    if (!matchedOption) {
      parsedArgs.push(arg);
    }
    i++;
  }

  // Validate arguments count
  const requiredArgsCount = command.arguments.filter(arg => arg.required).length;
  const optionalArgsCount = command.arguments.length - requiredArgsCount;
  const variadicArgs = command.arguments.filter(arg => arg.variadic);

  if (parsedArgs.length < requiredArgsCount || parsedArgs.length > requiredArgsCount + optionalArgsCount && variadicArgs.length === 0) {
    return { command, parsedArgs, parsedOptions, error: `Invalid number of arguments for command ${commandName}. Expected ${requiredArgsCount} required arguments.` };
  }

  // TODO: Add type validation for arguments and options

  return { command, parsedArgs, parsedOptions };
}

export async function executeCommand(state: State, input: string) {
  const { command, parsedArgs, parsedOptions, error } = parseInput(input, state.commands);

  if (error) {
    console.log(`Error: ${error}`);
    return;
  }

  if (!command) {
    if (parsedArgs.length > 0) {
      console.log(chalk.red(`Unknown command: ${parsedArgs[0]}`));
    } else if (input.trim().length > 0) {
      console.log(chalk.red(`Invalid input: ${input}`));
    }
    return;
  }

  if (command) {
    // Check for --help option
    if (parsedOptions.help || (command.name === 'help' && parsedArgs.length > 0)) {
      const helpCommandName = parsedArgs[0] || '';
      const helpCommand = state.commands[helpCommandName as Command] || undefined;
      if (helpCommand) {
        displayCommandHelp(helpCommand);
      } else {
        displayGeneralHelp(state.commands);
      }
    } else {
      state.input.command = command.name as Command;
      state.input.args = parsedArgs;
      state.input.options = parsedOptions;
      await command.callback(state);
    }
  } else if (input.trim().length > 0) {
    // If no command was found but there was input, display general help
    displayGeneralHelp(state.commands);
  }
}

export async function startREPL(state: State) {
  let rl = state.rl;
  rl.setPrompt(chalk.bold.green("Pokedex > "));
  rl.prompt();

  rl.on("line", async (input) => {
    await executeCommand(state, input);
    rl.prompt();
  });
}
