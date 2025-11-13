import chalk from "chalk";
import ora from "ora";
import { printLocations } from "./../helpers.js";
import { type State } from "./../state.js";

export async function commandMapb(state: State) {
  try {
    if (!state.prevLocationsUrl) {
      console.log(chalk.yellow("No previous page available. Use 'map' to load locations first."));
      return;
    }

    const spinner = ora(chalk.blue("Fetching previous locations...")).start();

    let locations = await state.pokeapi.fetchLocations(state.prevLocationsUrl);

    spinner.succeed(chalk.green("Previous locations loaded!"));
    printLocations(locations);

    state.nextLocationsUrl = locations.next ?? null;
    state.prevLocationsUrl = locations.previous ?? null;
  } catch (err: unknown) {
    console.error(chalk.red(`Error fetching previous locations: ${err}`));
  }
}
