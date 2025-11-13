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
import { commandTrade } from "./commands/command_trade.js";
import { commandDaily } from "./commands/command_daily.js";
import { commandLeaderboard } from "./commands/command_leaderboard.js";
import { commandShop } from "./commands/command_shop.js";
import { commandUse } from "./commands/command_use.js";
import { commandSave, commandLoad } from "./commands/command_save.js";
import { commandLanguage } from "./commands/command_language.js";
import { commandTheme } from "./commands/command_theme.js";
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
export type Command = "exit" | "help" | "map" | "mapb" | "explore" | "catch" | "pokedex" | "release" | "battle" | "evolve" | "learn" | "trade" | "daily" | "leaderboard" | "shop" | "use" | "save" | "load" | "language" | "theme";

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
  trade: {
    name: "trade",
    description: "Manage Pokemon trades with other users.",
    usage: "trade <subcommand> [args]",
    category: "Pokemon Management",
    arguments: [
      { name: "subcommand", description: "offer, list, accept, reject", required: true },
    ],
    options: [],
    examples: ["trade offer alice 1", "trade list", "trade accept 1 2"],
    callback: commandTrade,
  },
  daily: {
    name: "daily",
    description: "View and complete daily challenges for XP rewards.",
    usage: "daily",
    category: "Gamification",
    arguments: [],
    options: [],
    examples: ["daily"],
    callback: commandDaily,
  },
  leaderboard: {
    name: "leaderboard",
    description: "View the top players by XP.",
    usage: "leaderboard",
    category: "Social",
    arguments: [],
    options: [],
    examples: ["leaderboard"],
    callback: commandLeaderboard,
  },
  shop: {
    name: "shop",
    description: "Buy items with XP.",
    usage: "shop [buy <item_name>]",
    category: "Items",
    arguments: [
      { name: "subcommand", description: "buy", required: false },
      { name: "item_name", description: "Name of item to buy", required: false },
    ],
    options: [],
    examples: ["shop", "shop buy potion"],
    callback: commandShop,
  },
  use: {
    name: "use",
    description: "Use an item on a Pokemon.",
    usage: "use <item_name> <pokemon_index>",
    category: "Items",
    arguments: [
      { name: "item_name", description: "Name of item to use", required: true },
      { name: "pokemon_index", description: "Index of Pokemon", required: true },
    ],
    options: [],
    examples: ["use potion 1"],
    callback: commandUse,
  },
  save: {
    name: "save",
    description: "Save your profile to a file.",
    usage: "save",
    category: "System",
    arguments: [],
    options: [],
    examples: ["save"],
    callback: commandSave,
  },
  load: {
    name: "load",
    description: "Load a profile from a file.",
    usage: "load <filename>",
    category: "System",
    arguments: [
      { name: "filename", description: "Name of the file to load", required: true },
    ],
    options: [],
    examples: ["load profile.json"],
    callback: commandLoad,
  },
  language: {
    name: "language",
    description: "Set the language for the interface.",
    usage: "language <lang>",
    category: "System",
    arguments: [
      { name: "lang", description: "Language code (en, es)", required: true },
    ],
    options: [],
    examples: ["language es"],
    callback: commandLanguage,
  },
  theme: {
    name: "theme",
    description: "Set the theme for the interface.",
    usage: "theme <theme_name>",
    category: "System",
    arguments: [
      { name: "theme_name", description: "Theme name (default, dark, no-color)", required: true },
    ],
    options: [],
    examples: ["theme no-color"],
    callback: commandTheme,
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
