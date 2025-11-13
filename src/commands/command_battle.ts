import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
// @ts-ignore
import cliProgress from "cli-progress";
import { Pokemon, POKEBALLS, getPokemonCatchProbability, mapPokemonStats, mapPokemonTypes, Move, Stat, StatusCondition, getTypeEffectiveness } from "./../pokemon.js";
import { PokeAPI } from "./../pokeapi.js";
import ReadLine from "node:readline";

// Helper function to display HP bar
function displayHpBar(name: string, currentHp: number, maxHp: number) {
  const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = percentage > 50 ? chalk.green : percentage > 25 ? chalk.yellow : chalk.red;
  console.log(`${name}: ${color(bar)} ${currentHp}/${maxHp} (${percentage.toFixed(1)}%)`);
}

// Type Effectiveness Chart (simplified)
// Represents multipliers: 2 = super effective, 0.5 = not very effective, 1 = normal
const typeChart: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, dragon: 0.5, fairy: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, rock: 2, 'dark': 2, flying: 0.5, psychic: 0.5, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, rock: 0.5, flying: 0, bug: 0.5 },
  flying: { electric: 0.5, rock: 0.5, fight: 2, grass: 2, bug: 2, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, 'dark': 0.5 },
  bug: { fire: 0.5, fighting: 0.5, flying: 0.5, rock: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { normal: 2, fire: 2, water: 0.5, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, 'dark': 0.5, ghost: 2, psychic: 2 },
  dragon: { fire: 2, water: 2, electric: 2, grass: 0.5, ice: 2, dragon: 2, fairy: 0.5 },
  dark: { fighting: 0.5, dark: 0.5, fairy: 0.5, ghost: 2 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fighting: 2, poison: 0.5, fire: 0.5, 'dark': 2, dragon: 2, steel: 0.5 },
};

// Helper function to get a specific stat value
function getStatByName(stats: Stat[], statName: string): number {
  const stat = stats.find(s => s.name === statName);
  return stat ? stat.value : 0; // Default to 0 if stat not found
}

// Simplified damage calculation formula (inspired by Pokemon games)
function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move
): number {
  if (!move.power) return 0; // Status moves do no direct damage

  const level = attacker.level;
  const attackStat = move.category === "physical" ? getStatByName(attacker.stats, "attack") : getStatByName(attacker.stats, "special-attack");
  const defenseStat = move.category === "physical" ? getStatByName(defender.stats, "defense") : getStatByName(defender.stats, "special-defense");

  // STAB (Same-Type Attack Bonus)
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;

  // Type effectiveness
  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);

  // Base damage calculation
  let damage = ((((2 * level / 5 + 2) * move.power * (attackStat / defenseStat)) / 50) + 2) * stab * typeEffectiveness;

  // Critical Hit Check
  const baseCritChance = 1/16; // Base critical hit chance (1/16)
  const critRoll = Math.random();
  let isCriticalHit = critRoll < baseCritChance;

  // Apply critical hit multiplier
  if (isCriticalHit) {
    damage *= 1.5; // Critical hits deal 1.5x damage
    console.log("A critical hit!");
  }

  // Random factor (0.85 to 1.00)
  damage *= Math.random() * 0.15 + 0.85;

  // Round down to nearest integer
  return Math.floor(damage);
}

// Function to check if a move hits
function doesMoveHit(move: Move): boolean {
  if (move.accuracy === null) return true; // Moves with no accuracy value always hit
  const hitRoll = Math.random() * 100;
  return hitRoll < move.accuracy;
}

export async function commandBattle(state: State) {
  const { args: parsedArgs, options } = state.input;
  const wildPokemonName = parsedArgs[0];

  if (!wildPokemonName) {
    console.log("Please specify a wild Pokemon to battle.");
    return;
  }

   console.log(`Initiating battle with a wild ${wildPokemonName}...`);

   // Progress bar for battle preparation
   const progressBar = new cliProgress.SingleBar({
     format: 'Preparing Battle |' + chalk.cyan('{bar}') + '| {percentage}%',
     barCompleteChar: '\u2588',
     barIncompleteChar: '\u2591',
     hideCursor: true
   });
   progressBar.start(100, 0);

   for (let i = 0; i <= 100; i += 20) {
     progressBar.update(i);
     await new Promise(resolve => setTimeout(resolve, 100));
   }
   progressBar.stop();

   try {
    const pokeApi = state.pokeapi;
    const pokemonSpecies = await pokeApi.getPokemonSpecies(wildPokemonName);
    const pokemonData = await pokeApi.getPokemonData(wildPokemonName);

    if (!pokemonSpecies || !pokemonData) {
      console.log(`Could not find data for wild Pokemon: ${wildPokemonName}`);
      return;
    }

    // Fetch moves for the wild Pokemon (simplified: get first 4 moves)
    const wildPokemonMoves = await Promise.all(
      (pokemonData.moves || []).slice(0, 4).map(async (m: any) => {
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

    // Mock status condition for demonstration purposes
    const mockStatus: StatusCondition = Math.random() < 0.2 ? "paralyzed" : null;
    const mockStatusDuration = mockStatus ? Math.floor(Math.random() * 3) + 1 : undefined; // 1-3 turns

    const wildPokemon: Pokemon = {
      name: wildPokemonName,
      experience: pokemonSpecies.base_happiness * 10, 
      baseCatchRate: pokemonSpecies.capture_rate,
      level: Math.floor(Math.random() * 10) + 1, 
      status: mockStatus,
      statusDuration: mockStatusDuration,
      stats: mapPokemonStats(pokemonData.stats),
      types: mapPokemonTypes(pokemonData.types),
      moves: wildPokemonMoves,
    };

    console.log(`A wild ${wildPokemon.name} (Level ${wildPokemon.level})${wildPokemon.status ? ` (${wildPokemon.status})` : ''} appeared!`);

    if (state.player.pokemon.length === 0) {
      console.log("You have no Pokemon to battle with!");
      return;
    }

    const playerPokemon = state.player.pokemon[0]; // Using the first Pokemon for simplicity
    console.log(`You send out ${playerPokemon.name}!`);

    let playerPokemonHP = getStatByName(playerPokemon.stats, "hp");
    let wildPokemonHP = getStatByName(wildPokemon.stats, "hp");
    const maxPlayerPokemonHP = playerPokemonHP;
    const maxWildPokemonHP = wildPokemonHP;

    // Battle loop
    for (let turn = 1; ; turn++) {
      console.log(`\n--- Turn ${turn} ---`);
      console.log(`${playerPokemon.name} (HP: ${playerPokemonHP}/${maxPlayerPokemonHP}) vs ${wildPokemon.name} (HP: ${wildPokemonHP}/${maxWildPokemonHP})${wildPokemon.status ? ` [${wildPokemon.status}]` : ''}`);

      // Apply status effects at the start of the turn
      if (playerPokemon.status) {
        if (playerPokemon.status === "paralyzed" && Math.random() < 0.25) {
          console.log(`${playerPokemon.name} is paralyzed and cannot move!`);
        } else {
          if (playerPokemon.status === "poisoned") {
            const poisonDamage = Math.floor(maxPlayerPokemonHP * 0.125);
            playerPokemonHP -= poisonDamage;
            console.log(`${playerPokemon.name} is hurt by poison! It took ${poisonDamage} damage.`);
          } else if (playerPokemon.status === "burned") {
            const burnDamage = Math.floor(maxPlayerPokemonHP * 0.0625);
            playerPokemonHP -= burnDamage;
            console.log(`${playerPokemon.name} is hurt by its burn! It took ${burnDamage} damage.`);
          }
        }
        // Decrement status duration and remove if expired
        if (playerPokemon.statusDuration) {
          playerPokemon.statusDuration--;
          if (playerPokemon.statusDuration === 0) {
            console.log(`${playerPokemon.name} is no longer affected by ${playerPokemon.status}!`);
            playerPokemon.status = null;
            playerPokemon.statusDuration = undefined;
          }
        }
        if (playerPokemonHP <= 0) {
          console.log(`${playerPokemon.name} fainted!`);
          break;
        }
      }

      if (wildPokemon.status) {
        if (wildPokemon.status === "paralyzed" && Math.random() < 0.25) {
          console.log(`${wildPokemon.name} is paralyzed and cannot move!`);
        } else {
          if (wildPokemon.status === "poisoned") {
            const poisonDamage = Math.floor(maxWildPokemonHP * 0.125);
            wildPokemonHP -= poisonDamage;
            console.log(`${wildPokemon.name} is hurt by poison! It took ${poisonDamage} damage.`);
          } else if (wildPokemon.status === "burned") {
            const burnDamage = Math.floor(maxWildPokemonHP * 0.0625);
            wildPokemonHP -= burnDamage;
            console.log(`${wildPokemon.name} is hurt by its burn! It took ${burnDamage} damage.`);
          }
        }
        // Decrement status duration and remove if expired
        if (wildPokemon.statusDuration) {
          wildPokemon.statusDuration--;
          if (wildPokemon.statusDuration === 0) {
            console.log(`${wildPokemon.name} is no longer affected by ${wildPokemon.status}!`);
            wildPokemon.status = null;
            wildPokemon.statusDuration = undefined;
          }
        }
        if (wildPokemonHP <= 0) {
          console.log(`The wild ${wildPokemon.name} fainted!`);
          break;
        }
      }

      // Player's turn - Move Selection
      console.log("Your moves:");
      playerPokemon.moves.forEach((move, index) => {
        console.log(`${index + 1}. ${move.name} (Type: ${move.type}, Power: ${move.power || '-'}, Category: ${move.category})`);
      });

      let selectedMove: Move | undefined;
      while (!selectedMove) {
        const moveInput = await new Promise<string>(resolve => state.rl.question('Choose a move (enter number): ', resolve));
        const moveIndex = parseInt(moveInput, 10) - 1;

        if (moveIndex >= 0 && moveIndex < playerPokemon.moves.length) {
          selectedMove = playerPokemon.moves[moveIndex];
        } else {
          console.log("Invalid move selection. Please try again.");
        }
      }

      if (selectedMove) {
        // Check move accuracy
        if (doesMoveHit(selectedMove)) {
          const damageDealt = calculateDamage(playerPokemon, wildPokemon, selectedMove);
          wildPokemonHP -= damageDealt;
          console.log(`${playerPokemon.name} used ${selectedMove.name}! It dealt ${damageDealt} damage.`);
          if (wildPokemonHP <= 0) {
            console.log(`The wild ${wildPokemon.name} fainted!`);
            break; // Wild Pokemon fainted
          }
        } else {
          console.log(`${selectedMove.name} missed!`);
        }
      }

      // Wild Pokemon's turn
      const wildMove = wildPokemon.moves.find(m => m.power && m.power > 0);
      if (wildMove) {
        // Check wild Pokemon move accuracy
        if (doesMoveHit(wildMove)) {
          const damageDealt = calculateDamage(wildPokemon, playerPokemon, wildMove);
          playerPokemonHP -= damageDealt;
          console.log(`${wildPokemon.name} used ${wildMove.name}! It dealt ${damageDealt} damage.`);
          if (playerPokemonHP <= 0) {
            console.log(`${playerPokemon.name} fainted!`);
            break; // Player Pokemon fainted
          }
        } else {
          console.log(`${wildMove.name} missed!`);
        }
      }
    }

    console.log("\nBattle ended.");
    if (wildPokemonHP > 0) {
      console.log(`The wild ${wildPokemon.name} is weakened! You have a chance to catch it.`);
      // Prompt for catch attempt
      const catchInput = await new Promise<string>(resolve => state.rl.question('Attempt to catch? (yes/no): ', resolve));
      if (catchInput.toLowerCase() === 'yes') {
        // Prompt for ball selection
        console.log("Available ball types:");
        console.log("-------------------------");
        for (const ballName in POKEBALLS) {
          const ball = POKEBALLS[ballName];
          console.log(`- ${ball.name}: ${ball.description || 'Standard effectiveness'} (Modifier: ${ball.catchRateModifier})`);
        }
        console.log("-------------------------");
        let selectedBallType: string | undefined;
        while (!selectedBallType) {
          const ballInput = await new Promise<string>(resolve => state.rl.question('Choose a ball (enter name): ', resolve));
          if (POKEBALLS[ballInput.toLowerCase()]) {
            selectedBallType = ballInput.toLowerCase();
          } else {
            console.log("Invalid ball type. Please choose from the list.");
          }
        }

        // Prepare Pokemon data for catch attempt (using current HP, level, etc.)
        // Note: The catch logic might need adjustment for weakened Pokemon.
        const pokemonToCatch: Pokemon = {
          name: wildPokemon.name,
          experience: wildPokemon.experience, // Use fetched experience
          baseCatchRate: wildPokemon.baseCatchRate, // Use fetched baseCatchRate
          level: wildPokemon.level, // Use current level
          status: wildPokemon.status, // Use current status
          statusDuration: wildPokemon.statusDuration, // Pass status duration
          stats: wildPokemon.stats, // Pass stats for potential catch logic adjustments
          types: wildPokemon.types,
          moves: wildPokemon.moves, // Pass moves for potential catch logic adjustments
        };

        const selectedBall = POKEBALLS[selectedBallType!];
        const catchProbability = getPokemonCatchProbability(pokemonToCatch, selectedBall);
        const randomValue = Math.random() * 255;

        if (randomValue < catchProbability) {
          console.log(`You caught the ${pokemonToCatch.name}!`);
          state.player.pokemon.push(pokemonToCatch);
        } else {
          console.log(`Aww, the ${pokemonToCatch.name} broke free!`);
        }
      } else {
        console.log(`The wild ${wildPokemon.name} escaped!`);
      }
    } else {
      console.log(`You defeated the wild ${wildPokemon.name}!`);
    }

  } catch (error) {
    console.error(`An error occurred during the battle with ${wildPokemonName}:`, error);
  }
}
