import { printLocations } from "./../helpers.js";
import { type State } from "./../state.js";

export async function commandMapb(state: State) {
  try {
    let locations = await state.pokeapi.fetchLocations(
      state.prevLocationsUrl !== "" || state.prevLocationsUrl !== undefined
        ? state.prevLocationsUrl
        : undefined
    );

    printLocations(locations);

    state.nextLocationsUrl = locations.next ?? null;
    state.prevLocationsUrl = locations.previous ?? null;
  } catch (err: unknown) {
    console.error(err);
  }
}
