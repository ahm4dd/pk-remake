import { type CommandRegistry, commands } from "./index.js";

export function commandHelp(commands: CommandRegistry) {
  console.log("Welcome to the Pokedex!");
  console.log("Usage:\n");

  for (let command in commands) {
    console.log(`${command}: ${commands[command].description}`);
  }
}
