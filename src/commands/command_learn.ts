import { type State } from "./../state.js";
import chalk from "chalk";
import { Pokemon, mapPokemonStats, mapPokemonTypes, mapPokemonMoves, Move, Stat } from "./../pokemon.js";
import { PokeAPI } from "./../pokeapi.js";
import ReadLine from "node:readline";

// Helper function to get a specific stat value
function getStatByName(stats: Stat[], statName: string): number {
  const stat = stats.find(s => s.name === statName);
  return stat ? stat.value : 0; // Default to 0 if stat not found
}

export async function commandLearn(state: State) {
  const { args: parsedArgs } = state.input;
  const pokemonIdentifier = parsedArgs[0];
  const moveName = parsedArgs[1];

  if (!pokemonIdentifier || !moveName) {
    console.log(chalk.red("Please specify a Pokemon and a move to learn (e.g., 'learn pikachu thunderbolt')."));
    return;
  }

  const playerPokemon = state.player.pokemon;
  let pokemonIndexToLearn = -1;

  // Try to find by index first
  const index = parseInt(pokemonIdentifier, 10);
  if (!isNaN(index) && index > 0 && index <= playerPokemon.length) {
    pokemonIndexToLearn = index - 1;
  } else {
    // If not a valid index, try to find by name (case-insensitive)
    pokemonIndexToLearn = playerPokemon.findIndex(
      (p) => p.name.toLowerCase() === pokemonIdentifier.toLowerCase()
    );
  }

  if (pokemonIndexToLearn === -1) {
    console.log(chalk.red(`Pokemon '${pokemonIdentifier}' not found in your party.`));
    return;
  }

  const pokemon = playerPokemon[pokemonIndexToLearn];
  const pokeApi = state.pokeapi;

  try {
    // Fetch move data from PokeAPI
    const moveData = await pokeApi.getMoveData(moveName);
    if (!moveData) {
      console.log(chalk.red(`Could not find data for move: ${moveName}`));
      return;
    }

    const newMove: Move = {
      name: moveData.name,
      power: moveData.power || 0,
      type: moveData.type.name,
      category: moveData.damage_class.name as any,
      accuracy: moveData.accuracy || 100,
    };

    // Manage Pokemon's move set (limit to 4 moves)
    if (pokemon.moves.length < 4) {
      pokemon.moves.push(newMove);
      console.log(chalk.green(`${pokemon.name} learned ${newMove.name}!`));
    } else {
      // If Pokemon already has 4 moves, ask which one to forget
      console.log(chalk.yellow(`${pokemon.name} already knows 4 moves. Which move would you like to forget?`));
      pokemon.moves.forEach((move, index) => {
        console.log(`${index + 1}. ${chalk.cyan(move.name)}`);
      });

      let moveIndexToForget = -1;
      while (moveIndexToForget === -1) {
        const forgetInput = await new Promise<string>(resolve => state.rl.question('Enter the number of the move to forget (or 0 to cancel): ', resolve));
        const forgetIndex = parseInt(forgetInput, 10) - 1;

        if (forgetInput === '0') {
          console.log(chalk.red('Did not learn the move.'));
          return;
        } else if (forgetIndex >= 0 && forgetIndex < pokemon.moves.length) {
          moveIndexToForget = forgetIndex;
        } else {
          console.log(chalk.red('Invalid input. Please enter a number from the list or 0.'));
        }
      }

      // Replace the forgotten move with the new move
      const forgottenMove = pokemon.moves[moveIndexToForget];
      pokemon.moves[moveIndexToForget] = newMove;
      console.log(chalk.green(`${pokemon.name} forgot ${forgottenMove.name} and learned ${newMove.name}!`));
    }

  } catch (error) {
    console.error(`An error occurred while trying to learn ${moveName}:`, error);
  }
}
