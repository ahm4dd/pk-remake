import chalk from "chalk";
import Table from "cli-table3";
import { type State } from "./../state.js";

export async function commandPokedex(state: State) {
  const caughtPokemon = state.player.pokemon;
  const sortBy = state.input.options?.sort || 'index';

  if (caughtPokemon.length === 0) {
    console.log(chalk.yellow("You haven't caught any Pokemon yet! 🐾"));
    return;
  }

  // Sort Pokemon
  let sortedPokemon = [...caughtPokemon];
  if (sortBy === 'name') {
    sortedPokemon.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'level') {
    sortedPokemon.sort((a, b) => {
      const levelA = Math.floor(a.experience / 100) + 1;
      const levelB = Math.floor(b.experience / 100) + 1;
      return levelB - levelA; // Descending
    });
  } else if (sortBy === 'exp') {
    sortedPokemon.sort((a, b) => b.experience - a.experience);
  }
  // Default: by index (caught order)

  const table = new Table({
    head: [
      chalk.bold("Index"),
      chalk.bold("Name"),
      chalk.bold("Level"),
      chalk.bold("Exp"),
      chalk.bold("Catch Rate"),
      chalk.bold("Status"),
    ],
    colWidths: [8, 15, 8, 10, 12, 10],
    style: {
      head: ["cyan"],
      border: ["gray"],
    },
  });

  sortedPokemon.forEach((pokemon, index) => {
    const level = Math.floor(pokemon.experience / 100) + 1; // Simple level calc
    const status = pokemon.status ? pokemon.status : "Healthy";
    const originalIndex = caughtPokemon.indexOf(pokemon) + 1;
    table.push([
      chalk.cyan(originalIndex.toString()),
      chalk.green(pokemon.name),
      chalk.yellow(level.toString()),
      chalk.magenta(pokemon.experience.toFixed(2)),
      chalk.blue(pokemon.baseCatchRate.toFixed(2)),
      pokemon.status ? chalk.red(status) : chalk.green(status),
    ]);
  });

  console.log(chalk.bold.blue("\nYour Pokedex: 🐾"));
  console.log(chalk.gray(`Sorted by: ${sortBy}`));
  console.log(table.toString());
  console.log(chalk.gray(`Total Pokemon: ${caughtPokemon.length}`));
}
