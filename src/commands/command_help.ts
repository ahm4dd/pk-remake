import { getTypedKeys } from "./../helpers.js";
import { CommandRegistry, type State } from "./../state.js";

export function commandHelp(state: State) {
  console.log("Welcome to the Pokedex!");
  console.log("Usage:\n");

  for (let command of getTypedKeys(state.commands)) {
    console.log(`${command}: ${state.commands[command].description}`);
  }
}
