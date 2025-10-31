import { printLocations } from "./../helpers.js";
import { type State } from "./../state.js";

export async function commandMap(state: State) {
  try {
    // TODO: add a way to read the number of maps to skip and skip maps
    // let numberOfLocationsSkipped: number | undefined = 0;
    // if (state.input.args.length > 0) {
    //   numberOfLocationsSkipped = Number.parseInt(state.input.args[0]);
    // }

    let locations = await state.pokeapi.fetchLocations(
      state.nextLocationsUrl !== "" || state.nextLocationsUrl !== undefined
        ? state.nextLocationsUrl
        : undefined
    );

    printLocations(locations);

    state.nextLocationsUrl = locations.next ?? null;
    state.prevLocationsUrl = locations.previous ?? null;
  } catch (err: unknown) {
    console.error(err);
  }
}
