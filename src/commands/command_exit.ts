import { type CommandRegistry } from "./index.js";

export function commandExit(commands: CommandRegistry) {
  console.log("Closing the Pokedex... Goodbye!");
  process.exit(0);
}
