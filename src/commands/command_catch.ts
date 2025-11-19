import { type State } from "./../state.js";
import chalk from "chalk";
import ora from "ora";
import { getPokemonAscii } from "./../ascii.js";
import { db } from "./../database.js";
import { GamificationManager } from "./../gamify.js";
import { QuestManager } from "./../quests.js";
import { type Pokemon, type Pokeball, POKEBALLS, getPokemonCatchProbability, StatusCondition, mapPokemonStats, mapPokemonTypes, mapPokemonMoves } from "./../pokemon.js";
import { PokeAPI } from "./../pokeapi.js";

const tips = [
  "💡 Use 'pokedex' to view all your caught Pokemon!",
  "💡 Try 'explore' to discover new areas and Pokemon!",
  "💡 Evolving Pokemon makes them stronger – use 'evolve' when ready!",
  "💡 Different Pokeballs have different catch rates – experiment!",
  "💡 Use 'theme pokemon' for a fun color scheme!",
  "💡 Battles can be tough – train your Pokemon first!",
  "💡 Check 'help <command>' for detailed usage info.",
];

export async function commandCatch(state: State) {
  const { command, args: parsedArgs, options } = state.input;
  const pokemonName = parsedArgs[0];
  const ballType = parsedArgs[1] || options.ball || "pokeball";

  // Check inventory if logged in
  if (state.currentUser) {
    const inventory = db.getInventory(state.currentUser.id);
    const ballItem = inventory.find(item => item.item_type === 'ball' && item.item_name === ballType);
    if (!ballItem || ballItem.quantity <= 0) {
      console.log(chalk.red(`You don't have any ${ballType}s!`));
      return;
    }
    // Consume ball
    db.updateInventory(state.currentUser.id, 'ball', ballType, ballItem.quantity - 1);
  }

  if (options.balls) {
    console.log(chalk.bold.blue("Available Pokeballs:"));
    console.log(chalk.gray("-------------------------"));
    for (const ballName in POKEBALLS) {
      const ball = POKEBALLS[ballName];
      console.log(`- ${chalk.cyan(ball.name)}: ${ball.description || 'Standard effectiveness'} (Catch Rate Modifier: ${chalk.yellow('x' + ball.catchRateModifier)})`);
    }
    console.log(chalk.gray("-------------------------"));
    console.log(chalk.gray("Usage: catch <pokemon> [ball]"));
    console.log(chalk.gray("Example: catch pikachu greatball"));
    return;
  }

  if (!pokemonName) {
    console.log(chalk.red("Please specify a Pokemon to catch."));
    return;
  }

  const selectedBall = POKEBALLS[ballType];
  if (!selectedBall) {
    console.log(chalk.red(`Unknown ball type: ${ballType}. Use --balls to see available types.`));
    return;
  }

  const pokeApi = state.pokeapi;

  try {
    const spinner = ora(chalk.blue(`Searching for ${pokemonName}...`)).start();
    const pokemonSpecies = await pokeApi.getPokemonSpecies(pokemonName);
    if (!pokemonSpecies) {
      spinner.fail(chalk.red(`Could not find data for Pokemon: ${pokemonName}`));
      return;
    }

    const pokemonData = await pokeApi.getPokemonData(pokemonName);
    if (!pokemonData) {
      spinner.fail(chalk.red(`Could not find data for Pokemon: ${pokemonName}`));
      return;
    }
    spinner.succeed(chalk.green(`Found ${pokemonName}!`));

    // Mock status condition for demonstration purposes
    const mockStatus: StatusCondition = Math.random() < 0.2 ? "paralyzed" : null;

    // Extract relevant data for catch calculation
    const stats = mapPokemonStats(pokemonData.stats);
    const hpStat = stats.find(s => s.name === 'hp');
    const maxHp = hpStat ? hpStat.value : 100;

    const pokemon: Pokemon = {
      name: pokemonName,
      experience: pokemonSpecies.base_happiness * 10, // Using base_happiness as a proxy for experience, scaled up
      baseCatchRate: pokemonSpecies.capture_rate,
      level: Math.floor(Math.random() * 10) + 1, // Mock level between 1 and 10
      status: mockStatus,
      stats: stats,
      types: mapPokemonTypes(pokemonData.types),
      moves: mapPokemonMoves(pokemonData.moves?.slice(0, 4) || []), // First 4 moves
      currentHp: maxHp,
    };

    const catchProbability = getPokemonCatchProbability(pokemon, selectedBall);
    const randomValue = Math.random() * 255;

    if (randomValue < catchProbability) {
      console.log(chalk.green(`You caught a ${pokemon.name} (Level ${pokemon.level})${pokemon.status ? ` (${pokemon.status})` : ''}!`));
      console.log(getPokemonAscii(pokemon.name));

      // Save to DB if logged in
      if (state.currentUser) {
        db.savePokemon(state.currentUser.id, {
          name: pokemon.name,
          level: pokemon.level,
          experience: pokemon.experience,
          stats: JSON.stringify(pokemon.stats),
          types: JSON.stringify(pokemon.types),
          moves: JSON.stringify(pokemon.moves),
          current_hp: pokemon.currentHp || 100,
        });
        GamificationManager.onCatch(state.currentUser.id, pokemon.name);
        db.updateChallengeProgress(state.currentUser.id, 'catch');
        QuestManager.checkProgress(state.currentUser.id, 'catch');
        console.log(chalk.gray("💡 Pokemon saved to your collection!"));
      } else {
        state.player.pokemon.push(pokemon);
        console.log(chalk.gray("💡 Tip: Register an account to save your Pokemon permanently!"));
      }

      console.log(chalk.gray("💡 Tip: Use 'pokedex' to view your caught Pokemon!"));
    } else {
      console.log(chalk.red(`Aww, ${pokemon.name} got away!`));
      console.log(chalk.gray("💡 Tip: Try using a better ball like 'greatball' for higher catch rates!"));
    }
    // Show random tip
    if (Math.random() < 0.3) { // 30% chance
      console.log(chalk.gray(tips[Math.floor(Math.random() * tips.length)]));
    }
    // Show random tip
    if (Math.random() < 0.3) { // 30% chance
      console.log(chalk.gray(tips[Math.floor(Math.random() * tips.length)]));
    }
  } catch (error) {
    console.error(`An error occurred during the catch attempt for ${pokemonName}:`, error);
  }
}
