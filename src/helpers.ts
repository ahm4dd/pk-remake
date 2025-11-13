import { PokemonEncounters, ShallowLocations } from "./pokeapi.js";
import { type CLICommand, type CommandRegistry } from "./state.js";

export function printLocations(locations: ShallowLocations) {
  console.log("Locations: ");
  console.log("------------");

  for (const location of locations.results) {
    console.log(`- ${location.name}`);
  }

  console.log("------------");
}

export function printPokemons(pokemon_encounters: PokemonEncounters) {
  console.log("Pokemons: ");
  console.log("------------");

  for (const pokemon of pokemon_encounters) {
    console.log(`- ${pokemon.pokemon.name}`);
  }

  console.log("------------");
}

export function getTypedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function displayCommandHelp(command: CLICommand) {
  console.log(`
${command.name}: ${command.description}`);
  console.log(`Usage: ${command.usage}`);

  if (command.arguments.length > 0) {
    console.log("\nArguments:");
    command.arguments.forEach(arg => {
      console.log(`  ${arg.name}${arg.required ? '' : '?'}: ${arg.description}`);
    });
  }

  if (command.options.length > 0) {
    console.log("\nOptions:");
    command.options.forEach(opt => {
      console.log(`  --${opt.name}${opt.alias ? `, -${opt.alias}` : ''}: ${opt.description} (type: ${opt.type}${opt.defaultValue !== undefined ? `, default: ${opt.defaultValue}` : ''})`);
    });
  }

  if (command.examples.length > 0) {
    console.log("\nExamples:");
    command.examples.forEach(example => {
      console.log(`  ${example}`);
    });
  }
  console.log("\n");
}

export function displayGeneralHelp(commands: CommandRegistry) {
  console.log("\nAvailable Commands:");
  console.log("---------------------");
  for (const commandName in commands) {
    const command = commands[commandName as keyof CommandRegistry];
    console.log(`  ${command.name}: ${command.description}`);
  }
  console.log("---------------------");
  console.log("Use '<command> --help' for more details on a specific command.\n");
}
