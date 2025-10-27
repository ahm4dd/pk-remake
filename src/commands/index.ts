import { commandExit } from "./command_exit.js";
import { commandHelp } from "./command_help.js";

export type CLICommand = {
  name: string;
  description: string;
  callback: (commands: CommandRegistry) => void;
};
export type CommandRegistry = Record<string, CLICommand>;

export const commands: CommandRegistry = {
  exit: {
    name: "exit",
    description: "Exits the Pokedex",
    callback: commandExit,
  },
  help: {
    name: "help",
    description: "Displays a help message",
    callback: commandHelp,
  },
};

export function getCommands(): CommandRegistry {
  return commands;
}
