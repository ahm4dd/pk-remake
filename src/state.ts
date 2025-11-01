import ReadLine from "node:readline";
import { commandExit } from "./commands/command_exit.js";
import { commandHelp } from "./commands/command_help.js";
import { PokeAPI } from "./pokeapi.js";
import { commandMap } from "./commands/command_map.js";
import { commandMapb } from "./commands/command_mapb.js";
import { commandExplore } from "./commands/command_explore.js";
import { commandCatch } from "./commands/command_catch.js";

export type CLICommand = {
  name: string;
  description: string;
  callback: CommandHandler;
  minNumbOfArgs: number;
  maxNumbOfArgs?: number;
};
export type CommandRegistry = Record<Command, CLICommand>;
export type CommandHandler = (state: State) => void;
export type Command = "exit" | "help" | "map" | "mapb" | "explore" | "catch";

const commands: CommandRegistry = {
  exit: {
    name: "exit",
    description: "Exits the Pokedex",
    callback: commandExit,
    minNumbOfArgs: 0,
    maxNumbOfArgs: 0,
  },
  help: {
    name: "help",
    description: "Displays a help message",
    callback: commandHelp,
    minNumbOfArgs: 0,
    maxNumbOfArgs: 0,
  },
  map: {
    name: "map",
    description: "Show the next 20 locations in the Pokemon world.",
    callback: commandMap,
    minNumbOfArgs: 0,
    maxNumbOfArgs: 0,
  },
  mapb: {
    name: "mapb",
    description: "Show the previous 20 locations in the Pokemon world.",
    callback: commandMapb,
    minNumbOfArgs: 0,
    maxNumbOfArgs: 0,
  },
  explore: {
    name: "explore",
    description:
      "Explore a location-area and display all encountered Pokemons. Expects at least 1 argument (The location of the area to explore)",
    callback: commandExplore,
    minNumbOfArgs: 1,
    maxNumbOfArgs: 1,
  },
  catch: {
    name: "catch",
    description:
      "Tries to catch a Pokemon depending on a ball thrown. Expects at least 1 argument (The Pokemon's name), \nand takes 1 optional argument (The ball thrown).\nYou can display the ball types by using the `catch --balls` command",
    callback: commandCatch,
    minNumbOfArgs: 1,
    maxNumbOfArgs: 2,
  },
} as const;

export type Input = {
  command: Command;
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
      command: "help",
      args: [],
    },
  };
}
