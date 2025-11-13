import { type State } from "./../state.js";
import { Pokemon, mapPokemonStats, mapPokemonTypes, mapPokemonMoves } from "./../pokemon.js";
import { PokeAPI } from "./../pokeapi.js";

// Helper function to find a specific evolution in the chain
function findEvolution(
  currentPokemonName: string,
  currentLevel: number,
  evolutions: {
    from: string;
    to: string;
    minLevel: number | null;
    trigger: string;
  }[],
): {
  evolvedName: string;
  evolutionTrigger: string;
} | null {
  for (const evolution of evolutions) {
    if (
      evolution.from === currentPokemonName &&
      evolution.trigger === "level-up" && // Only consider level-up evolutions for now
      evolution.minLevel !== null &&
      currentLevel >= evolution.minLevel
    ) {
      return { evolvedName: evolution.to, evolutionTrigger: evolution.trigger };
    }
  }
  return null;
}

export async function commandEvolve(state: State) {
  const { args: parsedArgs } = state.input;
  const pokemonIdentifier = parsedArgs[0];

  if (!pokemonIdentifier) {
    console.log("Please specify a Pokemon to evolve (by name or index).");
    return;
  }

  const playerPokemon = state.player.pokemon;
  let pokemonIndexToEvolve = -1;

  // Try to find by index first
  const index = parseInt(pokemonIdentifier, 10);
  if (!isNaN(index) && index > 0 && index <= playerPokemon.length) {
    pokemonIndexToEvolve = index - 1;
  } else {
    // If not a valid index, try to find by name (case-insensitive)
    pokemonIndexToEvolve = playerPokemon.findIndex(
      (p) => p.name.toLowerCase() === pokemonIdentifier.toLowerCase()
    );
  }

  if (pokemonIndexToEvolve === -1) {
    console.log(`Pokemon '${pokemonIdentifier}' not found in your party.`);
    return;
  }

  const pokemonToEvolve = playerPokemon[pokemonIndexToEvolve];
  const pokeApi = state.pokeapi;

  try {
    // 1. Fetch Pokemon species data to get the evolution chain URL
    const speciesData = await pokeApi.getPokemonSpecies(pokemonToEvolve.name);
    if (!speciesData.evolution_chain) {
      console.log(`${pokemonToEvolve.name} does not have an evolution chain.`);
      return;
    }

    // 2. Fetch the evolution chain data
    const evolutionChainData = await pokeApi.getEvolutionChain(speciesData.evolution_chain.url);

    // 3. Find the next evolution based on current level
    const evolutionInfo = findEvolution(
      pokemonToEvolve.name,
      pokemonToEvolve.level,
      evolutionChainData.chain
    );

    if (!evolutionInfo) {
      console.log(`${pokemonToEvolve.name} cannot evolve at this time (check level or evolution criteria).`);
      return;
    }

    // 4. Fetch data for the evolved Pokemon
    const evolvedPokemonData = await pokeApi.getPokemonData(evolutionInfo.evolvedName);
    const evolvedPokemonSpecies = await pokeApi.getPokemonSpecies(evolutionInfo.evolvedName);

    if (!evolvedPokemonData || !evolvedPokemonSpecies) {
      console.log(`Could not fetch data for the evolved form: ${evolutionInfo.evolvedName}`);
      return;
    }

    // Fetch moves for the evolved Pokemon (simplified: get first 4 moves)
    const evolvedPokemonMoves = await Promise.all(
      evolvedPokemonData.moves.slice(0, 4).map(async (m: any) => {
        const moveData = await pokeApi.getMoveData(m.move.name);
        return {
          name: moveData.name,
          power: moveData.power || 0,
          type: moveData.type.name,
          category: moveData.damage_class.name as any,
          accuracy: moveData.accuracy || 100,
        };
      })
    );

    // 5. Create the evolved Pokemon object
    const evolvedPokemon: Pokemon = {
      name: evolutionInfo.evolvedName,
      experience: pokemonToEvolve.experience, // Keep current experience, or reset/adjust as needed
      baseCatchRate: evolvedPokemonSpecies.capture_rate,
      level: pokemonToEvolve.level, // Keep current level
      status: pokemonToEvolve.status, // Keep current status
      statusDuration: pokemonToEvolve.statusDuration, // Keep current status duration
      stats: mapPokemonStats(evolvedPokemonData.stats),
      types: mapPokemonTypes(evolvedPokemonData.types),
      moves: evolvedPokemonMoves,
    };

    // 6. Replace the old Pokemon with the evolved one
    playerPokemon[pokemonIndexToEvolve] = evolvedPokemon;
    console.log(`Your ${pokemonToEvolve.name} evolved into ${evolvedPokemon.name}!`);

  } catch (error) {
    console.error(`An error occurred during evolution for ${pokemonToEvolve.name}:`, error);
  }
}
