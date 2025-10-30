import ReadLine from "node:readline";
import { commandExit } from "./commands/command_exit.js";
import { commandHelp } from "./commands/command_help.js";
import { PokeAPI } from "./pokeapi.js";
import { commandMap } from "./commands/command_map.js";
import { commandMapb } from "./commands/command_mapb.js";

export type CLICommand = {
  name: string;
  description: string;
  callback: CommandHandler;
};
export type CommandRegistry = Record<Command, CLICommand>;
export type CommandHandler = (state: State) => void;
export type Command = keyof typeof commands;

const commands = {
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
  map: {
    name: "map",
    description: "Show the next 20 locations in the Pokemon world.",
    callback: commandMap,
  },

  mapb: {
    name: "mapb",
    description: "Show the previous 20 locations in the Pokemon world.",
    callback: commandMapb,
  },
} as const;

export type Input = {
  command: string;
  args: string[];
};

export type State = {
  rl: ReadLine.Interface;
  commands: CommandRegistry;
  pokeapi: PokeAPI;
  nextLocationsUrl?: string;
  prevLocationsUrl?: string;
  input: Input;
};

export function initState(): State {
  const rl = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Pokedex > ",
  });

  return {
    rl,
    commands,
    pokeapi: new PokeAPI(),
    input: {
      command: "",
      args: [],
    },
  };
}
