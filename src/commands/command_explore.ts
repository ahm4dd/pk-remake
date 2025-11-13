import chalk from "chalk";
import ora from "ora";
import { printPokemons } from "./../helpers.js";
import { type State } from "./../state.js";
import { db } from "./../database.js";

export async function commandExplore(state: State) {
  try {
    if (state.input.args.length <= 0) {
      console.log(chalk.red("Insufficient number of arguments was provided. Type `help` for more information about your command."));
      return;
    }

    const locationName = state.input.args[0];
    const spinner = ora(chalk.blue(`Exploring ${locationName}...`)).start();

    let locationInfo = await state.pokeapi.fetchLocation(locationName);
    spinner.succeed(chalk.green(`Explored ${locationName}!`));

    printPokemons(locationInfo.pokemon_encounters);

    if (state.currentUser) {
      db.updateChallengeProgress(state.currentUser.id, 'explore');
    }
  } catch (err: unknown) {
    console.error(chalk.red(`Error exploring: ${err}`));
  }
}
