import ReadLine from "node:readline";
import { commandExit } from "./commands/command_exit.js";
import { commandHelp } from "./commands/command_help.js";
import { PokeAPI } from "./pokeapi.js";
import { commandMap } from "./commands/command_map.js";
import { commandMapb } from "./commands/command_mapb.js";
import { commandExplore } from "./commands/command_explore.js";
import { commandCatch } from "./commands/command_catch.js";
import { commandPokedex } from "./commands/command_pokedex.js";
import { commandRelease } from "./commands/command_release.js";
import { commandBattle } from "./commands/command_battle.js";
import { commandEvolve } from "./commands/command_evolve.js";
import { commandLearn } from "./commands/command_learn.js";
import { Pokemon } from "./pokemon.js";

export type CLICommand = {
  name: string;
  description: string;
  usage: string;
  category: string;
  arguments: { name: string; description: string; required: boolean; variadic?: boolean }[];
  options: { name: string; description: string; alias?: string; type: 'boolean' | 'string' | 'number'; defaultValue?: any; }[];
  examples: string[];
  callback: (state: State) => void | Promise<void>;
};

export type CommandRegistry = Record<Command, CLICommand>;
export type CommandHandler = (state: State) => void | Promise<void>;
export type Command = "exit" | "help" | "map" | "mapb" | "explore" | "catch" | "pokedex" | "release" | "battle" | "evolve" | "learn";

const commands: CommandRegistry = {
  exit: {
    name: "exit",
    description: "Exits the Pokedex",
    usage: "exit",
    category: "System",
    arguments: [],
    options: [],
    examples: ["exit"],
    callback: commandExit,
  },
  help: {
    name: "help",
    description: "Displays a help message for all commands or a specific command.",
    usage: "help [command_name]",
    category: "System",
    arguments: [
      { name: "command_name", description: "The name of the command to get help for.", required: false },
    ],
    options: [],
    examples: ["help", "help catch"],
    callback: commandHelp,
  },
  map: {
    name: "map",
    description: "Show the next 20 locations in the Pokemon world.",
    usage: "map",
    category: "Exploration",
    arguments: [],
    options: [],
    examples: ["map"],
    callback: commandMap,
  },
  mapb: {
    name: "mapb",
    description: "Show the previous 20 locations in the Pokemon world.",
    usage: "mapb",
    category: "Exploration",
    arguments: [],
    options: [],
    examples: ["mapb"],
    callback: commandMapb,
  },
  explore: {
    name: "explore",
    description: "Explore a location-area and display all encountered Pokemons.",
    usage: "explore <location_name>",
    category: "Exploration",
    arguments: [
      { name: "location_name", description: "The name of the location area to explore.", required: true },
    ],
    options: [],
    examples: ["explore kanto"],
    callback: commandExplore,
  },
  catch: {
    name: "catch",
    description: "Tries to catch a Pokemon depending on a ball thrown.",
    usage: "catch <pokemon_name> [--ball <ball_type>]",
    category: "Pokemon Management",
    arguments: [
      { name: "pokemon_name", description: "The name of the Pokemon to catch.", required: true },
    ],
    options: [
      { name: "ball", description: "The type of ball to use (pokeball, greatball, ultraball).", alias: "b", type: "string", defaultValue: "pokeball" },
    ],
    examples: ["catch pikachu", "catch charmander --ball greatball"],
    callback: commandCatch,
  },
  pokedex: {
    name: "pokedex",
    description: "Displays your caught Pokemon.",
    usage: "pokedex",
    category: "Pokemon Management",
    arguments: [],
    options: [],
    examples: ["pokedex"],
    callback: commandPokedex,
  },
  release: {
    name: "release",
    description: "Releases a Pokemon from your party.",
    usage: "release <pokemon_name_or_index>",
    category: "Pokemon Management",
    arguments: [
      { name: "pokemon_name_or_index", description: "The name or index of the Pokemon to release.", required: true },
    ],
    options: [],
    examples: ["release pikachu", "release 1"],
    callback: commandRelease,
  },
  battle: {
    name: "battle",
    description: "Initiates a battle with a wild Pokemon.",
    usage: "battle <pokemon_name>",
    category: "Pokemon Management",
    arguments: [
      { name: "pokemon_name", description: "The name of the wild Pokemon to battle.", required: true },
    ],
    options: [],
    examples: ["battle pikachu"],
    callback: commandBattle,
  },
  evolve: {
    name: "evolve",
    description: "Evolves a Pokemon if it meets the criteria.",
    usage: "evolve <pokemon_name_or_index>",
    category: "Pokemon Management",
    arguments: [
      { name: "pokemon_name_or_index", description: "The name or index of the Pokemon to evolve.", required: true },
    ],
    options: [],
    examples: ["evolve pikachu", "evolve 1"],
    callback: commandEvolve,
  },
  learn: {
    name: "learn",
    description: "Teaches a move to a Pokemon.",
    usage: "learn <pokemon_name_or_index> <move_name>",
    category: "Pokemon Management",
    arguments: [
      { name: "pokemon_name_or_index", description: "The name or index of the Pokemon.", required: true },
      { name: "move_name", description: "The name of the move to learn.", required: true },
    ],
    options: [],
    examples: ["learn pikachu thunderbolt"],
    callback: commandLearn,
  },
} as const;

export type Input = {
  command: Command;
  args: string[];
  options: Record<string, any>;
};

export type Player = {
  pokemon: Pokemon[];
};

import { User } from './database.js';

export type State = {
  rl: ReadLine.Interface;
  commands: CommandRegistry;
  pokeapi: PokeAPI;
  currentUser: User | null;
  player: Player;
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
    currentUser: null,
    player: {
      pokemon: [],
    },
    input: {
      command: "help",
      args: [],
      options: {},
    },
  };
}
