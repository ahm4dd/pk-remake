import ReadLine from "node:readline";
import process from "node:process";
import { type State, type CLICommand, Command, type CommandRegistry } from "./state.js";

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

export async function startREPL(state: State) {
  let rl = state.rl;
  let commands = state.commands;
  rl.prompt();

  rl.on("line", async (input) => {
    const { command, parsedArgs, parsedOptions, error } = parseInput(input, commands);

    if (error) {
      console.log(`Error: ${error}`);
    } else if (command) {
      // Check for --help option
      if (parsedOptions.help || (command.name === 'help' && parsedArgs.length > 0)) {
        const helpCommandName = parsedArgs[0] || '';
        const helpCommand = commands[helpCommandName as Command] || undefined;
        if (helpCommand) {
          displayCommandHelp(helpCommand);
        } else {
          displayGeneralHelp(commands);
        }
      } else {
        state.input.command = command.name;
        state.input.args = parsedArgs;
        state.input.options = parsedOptions;
        await command.callback(state);
      }
    } else if (input.trim().length > 0) {
      // If no command was found but there was input, display general help
      displayGeneralHelp(commands);
    }

    rl.prompt();
  });
}
