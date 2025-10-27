import ReadLine from "node:readline";
import { commandExit } from "./commands/command_exit.js";
import { commandHelp } from "./commands/command_help.js";

export type CLICommand = {
  name: string;
  description: string;
  callback: (state: State) => void;
};
export type CommandRegistry = Record<string, CLICommand>;

export type State = {
  rl: ReadLine.Interface;
  commands: CommandRegistry;
};

export function initState(): State {
  const rl = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Pokedex > ",
  });

  const commands: CommandRegistry = {
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

  return {
    rl,
    commands,
  };
}
