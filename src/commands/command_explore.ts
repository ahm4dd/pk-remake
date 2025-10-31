import { printPokemons } from "./../helpers.js";
import { type State } from "./../state.js";
export async function commandExplore(state: State) {
  try {
    if (state.input.args.length <= 0) {
      throw new Error(
        "Insufficient number of arguments was provided. Type `help` for more information about your command."
      );
    }

    let locationInfo = await state.pokeapi.fetchLocation(state.input.args[0]);

    printPokemons(locationInfo.pokemon_encounters);
  } catch (err: unknown) {
    console.error(err);
  }
}
