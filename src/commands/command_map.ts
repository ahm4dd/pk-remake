import chalk from "chalk";
import ora from "ora";
import { printLocations } from "./../helpers.js";
import { type State } from "./../state.js";

export async function commandMap(state: State) {
  try {
    const spinner = ora(chalk.blue("Fetching locations...")).start();

    let locations = await state.pokeapi.fetchLocations(
      state.nextLocationsUrl !== "" || state.nextLocationsUrl !== undefined
        ? state.nextLocationsUrl
        : undefined
    );

    spinner.succeed(chalk.green("Locations loaded!"));
    printLocations(locations);

    state.nextLocationsUrl = locations.next ?? null;
    state.prevLocationsUrl = locations.previous ?? null;
  } catch (err: unknown) {
    console.error(chalk.red(`Error fetching locations: ${err}`));
  }
}
