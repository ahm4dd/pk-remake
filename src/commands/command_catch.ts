import { type State } from "./../state.js";
import { type Pokemon, type Pokeball, POKEBALLS, getPokemonCatchProbability, StatusCondition } from "./../pokemon.js";
import { PokeAPI } from "./../pokeapi.js";

export async function commandCatch(state: State) {
  const { command, args: parsedArgs, options } = state.input;
  const pokemonName = parsedArgs[0];
  const ballType = options.ball || "pokeball";

  if (options.balls) {
    console.log("Available ball types:");
    console.log("-------------------------");
    for (const ballName in POKEBALLS) {
      const ball = POKEBALLS[ballName];
      console.log(`- ${ball.name}: ${ball.description || 'Standard effectiveness'} (Modifier: ${ball.catchRateModifier})`);
    }
    console.log("-------------------------");
    return;
  }

  if (!pokemonName) {
    console.log("Please specify a Pokemon to catch.");
    return;
  }

  const selectedBall = POKEBALLS[ballType];
  if (!selectedBall) {
    console.log(`Unknown ball type: ${ballType}. Use --balls to see available types.`);
    return;
  }

  try {
    // Fetch Pokemon data from PokeAPI
    const pokeApi = state.pokeapi;
    const pokemonSpecies = await pokeApi.getPokemonSpecies(pokemonName);
    const pokemonData = await pokeApi.getPokemonData(pokemonName);

    if (!pokemonSpecies || !pokemonData) {
      console.log(`Could not find data for Pokemon: ${pokemonName}`);
      return;
    }

    // Mock status condition for demonstration purposes
    const mockStatus: StatusCondition = Math.random() < 0.2 ? "paralyzed" : null;

    // Extract relevant data for catch calculation
    const pokemon: Pokemon = {
      name: pokemonName,
      experience: pokemonSpecies.base_happiness * 10, // Using base_happiness as a proxy for experience, scaled up
      baseCatchRate: pokemonSpecies.capture_rate,
      level: Math.floor(Math.random() * 10) + 1, // Mock level between 1 and 10
      status: mockStatus,
    };

    const catchProbability = getPokemonCatchProbability(pokemon, selectedBall);
    const randomValue = Math.random() * 255;

    if (randomValue < catchProbability) {
      console.log(`You caught a ${pokemon.name} (Level ${pokemon.level})${pokemon.status ? ` (${pokemon.status})` : ''}!`);
      state.player.pokemon.push(pokemon);
    } else {
      console.log(`Aww, ${pokemon.name} got away!`);
    }
  } catch (error) {
    console.error(`An error occurred during the catch attempt for ${pokemonName}:`, error);
  }
}
