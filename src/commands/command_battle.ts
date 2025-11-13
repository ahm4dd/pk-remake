import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import cliProgress from "cli-progress";
import { BattleSystem } from "./../battle.js";
import { Pokemon, POKEBALLS, getPokemonCatchProbability, mapPokemonStats, mapPokemonTypes, Move, Stat, StatusCondition, getTypeEffectiveness } from "./../pokemon.js";
import { PokeAPI } from "./../pokeapi.js";
import ReadLine from "node:readline";
import { db } from "./../database.js";

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
  try {
    if (state.input.args.length <= 0) {
      throw new Error("Insufficient number of arguments was provided. Type `help` for more information about your command.");
    }

    const wildPokemonName = state.input.args[0];

    // Check if user has Pokemon
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to battle."));
      return;
    }

    const userPokemon = state.player.pokemon[0]; // Use first Pokemon
    if (!userPokemon) {
      console.log(chalk.red("You have no Pokemon to battle with!"));
      return;
    }

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

    // Start the battle
    const result = await BattleSystem.startBattle(state, wildPokemonName);

    // Award XP based on result
    if (result === 'win') {
      // Award XP
      console.log(chalk.gray("💡 Gained XP from battle!"));
      db.updateChallengeProgress(state.currentUser.id, 'battle');
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}
