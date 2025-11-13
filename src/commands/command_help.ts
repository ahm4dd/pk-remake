import { displayGeneralHelp } from "./../helpers.js";
import { type State } from "./../state.js";

export function commandHelp(state: State) {
  displayGeneralHelp(state.commands);
}
