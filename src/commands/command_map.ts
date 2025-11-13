import chalk from "chalk";
import ora from "ora";
import { printLocations } from "./../helpers.js";
import { type State } from "./../state.js";

export async function commandMap(state: State) {
  try {
    const spinner = ora(chalk.blue("Fetching locations...")).start();

    let locations = await state.pokeapi.fetchLocations(
      state.nextLocationsUrl !== "" && state.nextLocationsUrl !== undefined
        ? state.nextLocationsUrl
        : undefined
    );

    spinner.succeed(chalk.green("Locations loaded!"));

    // Paginate: Show only first 20 to prevent overload
    const pageSize = 20;
    const results = locations.results.slice(0, pageSize);
    const paginatedLocations = { ...locations, results };

    printLocations(paginatedLocations);

    if (locations.results.length > pageSize) {
      console.log(chalk.gray(`Showing first ${pageSize} locations. Use 'map' again for next page.`));
    }

    state.nextLocationsUrl = locations.next ?? null;
    state.prevLocationsUrl = locations.previous ?? null;
  } catch (err: unknown) {
    console.error(chalk.red(`Error fetching locations: ${err}`));
  }
}
