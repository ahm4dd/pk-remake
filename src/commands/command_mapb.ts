import chalk from "chalk";
import ora from "ora";
import { printLocations } from "./../helpers.js";
import { type State } from "./../state.js";

export async function commandMapb(state: State) {
  try {
    const spinner = ora(chalk.blue("Fetching previous locations...")).start();

    let locations = await state.pokeapi.fetchLocations(
      state.prevLocationsUrl !== "" || state.prevLocationsUrl !== undefined
        ? state.prevLocationsUrl
        : undefined
    );

    spinner.succeed(chalk.green("Previous locations loaded!"));
    printLocations(locations);

    state.nextLocationsUrl = locations.next ?? null;
    state.prevLocationsUrl = locations.previous ?? null;
  } catch (err: unknown) {
    console.error(chalk.red(`Error fetching previous locations: ${err}`));
  }
}
