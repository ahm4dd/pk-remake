import { type State } from "./../state.js";
import { Pokemon } from "./../pokemon.js";

export async function commandRelease(state: State) {
  const { args: parsedArgs } = state.input;
  const pokemonIdentifier = parsedArgs[0];

  if (!pokemonIdentifier) {
    console.log("Please specify a Pokemon to release (by name or index).");
    return;
  }

  const playerPokemon = state.player.pokemon;
  let pokemonIndexToRelease = -1;

  // Try to find by index first
  const index = parseInt(pokemonIdentifier, 10);
  if (!isNaN(index) && index > 0 && index <= playerPokemon.length) {
    pokemonIndexToRelease = index - 1;
  } else {
    // If not a valid index, try to find by name (case-insensitive)
    pokemonIndexToRelease = playerPokemon.findIndex(
      (p) => p.name.toLowerCase() === pokemonIdentifier.toLowerCase()
    );
  }

  if (pokemonIndexToRelease === -1) {
    console.log(`Pokemon '${pokemonIdentifier}' not found in your party.`);
    return;
  }

  const releasedPokemon = playerPokemon.splice(pokemonIndexToRelease, 1)[0];
  console.log(`You released ${releasedPokemon.name}.`);
}
