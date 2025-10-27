import { type State } from "./../state.js";

export function commandHelp(state: State) {
  console.log("Welcome to the Pokedex!");
  console.log("Usage:\n");

  for (let command in state.commands) {
    console.log(`${command}: ${state.commands[command].description}`);
  }
}
