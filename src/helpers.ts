import chalk from "chalk";
import * as emoji from "node-emoji";
import { PokemonEncounters, ShallowLocations } from "./pokeapi.js";
import { type CLICommand, type CommandRegistry, Command } from "./state.js";

export function printLocations(locations: ShallowLocations) {
  console.log(chalk.bold.blue(`Locations: ${emoji.get("map")}`));
  console.log(chalk.gray("------------"));

  for (const location of locations.results) {
    console.log(`- ${chalk.cyan(location.name)}`);
  }

  console.log(chalk.gray("------------"));
}

export function printPokemons(pokemon_encounters: PokemonEncounters) {
  console.log(chalk.bold.blue(`Pokemons: ${emoji.get("hatched_chick")}`));
  console.log(chalk.gray("------------"));

  for (const pokemon of pokemon_encounters) {
    console.log(`- ${chalk.green(pokemon.pokemon.name)}`);
  }

  console.log(chalk.gray("------------"));
}

export function getTypedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function displayCommandHelp(command: CLICommand) {
  console.log(chalk.bold.blue(`\n${command.name}: ${command.description}`));
  console.log(chalk.yellow(`Usage: ${command.usage}`));

  if (command.arguments.length > 0) {
    console.log(chalk.green("\nArguments:"));
    command.arguments.forEach(arg => {
      console.log(`  ${chalk.cyan(arg.name)}${arg.required ? '' : chalk.gray('?')}: ${arg.description}`);
    });
  }

  if (command.options.length > 0) {
    console.log(chalk.green("\nOptions:"));
    command.options.forEach(opt => {
      console.log(`  --${chalk.cyan(opt.name)}${opt.alias ? `, -${opt.alias}` : ''}: ${opt.description} (type: ${opt.type}${opt.defaultValue !== undefined ? `, default: ${opt.defaultValue}` : ''})`);
    });
  }

  if (command.examples.length > 0) {
    console.log(chalk.green("\nExamples:"));
    command.examples.forEach(example => {
      console.log(`  ${chalk.magenta(example)}`);
    });
  }
  console.log();
}

export function displayGeneralHelp(commands: CommandRegistry) {
  console.log(chalk.bold.blue("\nAvailable commands:"));

  const categories: Record<string, CLICommand[]> = {
    "System": [],
    "Exploration": [],
    "Pokemon Management": [],
  };

  for (const cmdName in commands) {
    const cmd = commands[cmdName as Command];
    categories[cmd.category].push(cmd);
  }

  for (const [category, cmds] of Object.entries(categories)) {
    if (cmds.length > 0) {
      console.log(chalk.yellow(`\n${category}:`));
      cmds.forEach(cmd => {
        console.log(`  ${chalk.cyan(cmd.name)}: ${cmd.description}`);
      });
    }
  }

  console.log(chalk.gray("\nType 'help <command>' for more information on a specific command."));
  console.log(chalk.gray("Type 'exit' to quit the application.\n"));
}
