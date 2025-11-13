import chalk from "chalk";
import cliProgress from "cli-progress";
import { Pokemon, Move, getTypeEffectiveness, POKEBALLS, getPokemonCatchProbability, mapPokemonStats, mapPokemonTypes, StatusCondition } from "./pokemon.js";
import { PokeAPI } from "./pokeapi.js";
import { type State } from "./state.js";

export interface BattleState {
  playerPokemon: Pokemon;
  opponentPokemon: Pokemon;
  turn: number;
  playerHp: number;
  opponentHp: number;
  status: {
    player: string | null;
    opponent: string | null;
  };
}

export class BattleSystem {
  static async startBattle(state: State, wildPokemonName: string): Promise<string> {
    const pokeApi = state.pokeapi;
    const pokemonSpecies = await pokeApi.getPokemonSpecies(wildPokemonName);
    const pokemonData = await pokeApi.getPokemonData(wildPokemonName);

    if (!pokemonSpecies || !pokemonData) {
      console.log(`Could not find data for wild Pokemon: ${wildPokemonName}`);
      return 'error';
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

    const playerPokemon = state.player.pokemon[0]; // Using the first Pokemon for simplicity
    console.log(`A wild ${wildPokemon.name} (Level ${wildPokemon.level})${wildPokemon.status ? ` (${wildPokemon.status})` : ''} appeared!`);
    console.log(`You send out ${playerPokemon.name}!`);

    let playerPokemonHP = this.getStatByName(playerPokemon.stats, "hp");
    let wildPokemonHP = this.getStatByName(wildPokemon.stats, "hp");
    const maxPlayerPokemonHP = playerPokemonHP;
    const maxWildPokemonHP = wildPokemonHP;

    // Battle loop
    for (let turn = 1; ; turn++) {
      console.log(`\n--- Turn ${turn} ---`);
      this.displayHpBar(playerPokemon.name, playerPokemonHP, maxPlayerPokemonHP);
      this.displayHpBar(wildPokemon.name, wildPokemonHP, maxWildPokemonHP);

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
          return 'lose';
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
          return 'win';
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
        if (this.doesMoveHit(selectedMove)) {
          const damageDealt = this.calculateDamage(playerPokemon, wildPokemon, selectedMove);
          wildPokemonHP -= damageDealt;
          console.log(`${playerPokemon.name} used ${selectedMove.name}! It dealt ${damageDealt} damage.`);
          if (wildPokemonHP <= 0) {
            console.log(`The wild ${wildPokemon.name} fainted!`);
            return 'win'; // Wild Pokemon fainted
          }
        } else {
          console.log(`${selectedMove.name} missed!`);
        }
      }

      // Wild Pokemon's turn
      const wildMove = wildPokemon.moves.find(m => m.power && m.power > 0);
      if (wildMove) {
        // Check wild Pokemon move accuracy
        if (this.doesMoveHit(wildMove)) {
          const damageDealt = this.calculateDamage(wildPokemon, playerPokemon, wildMove);
          playerPokemonHP -= damageDealt;
          console.log(`${wildPokemon.name} used ${wildMove.name}! It dealt ${damageDealt} damage.`);
          if (playerPokemonHP <= 0) {
            console.log(`${playerPokemon.name} fainted!`);
            return 'lose'; // Player Pokemon fainted
          }
        } else {
          console.log(`${wildMove.name} missed!`);
        }
      }
    }
  }

  static getStatByName(stats: any[], statName: string): number {
    const stat = stats.find(s => s.name === statName);
    return stat ? stat.value : 0;
  }

  static displayHpBar(name: string, currentHp: number, maxHp: number) {
    const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const color = percentage > 50 ? chalk.green : percentage > 25 ? chalk.yellow : chalk.red;
    console.log(`${name}: ${color(bar)} ${currentHp}/${maxHp} (${percentage.toFixed(1)}%)`);
  }

  static doesMoveHit(move: Move): boolean {
    if (move.accuracy === null) return true;
    const hitRoll = Math.random() * 100;
    return hitRoll < move.accuracy;
  }

  static calculateDamage(attacker: Pokemon, defender: Pokemon, move: Move): number {
    if (!move.power) return 0; // Status moves do no direct damage

    const level = attacker.level;
    const attackStat = move.category === "physical" ? this.getStatByName(attacker.stats, "attack") : this.getStatByName(attacker.stats, "special-attack");
    const defenseStat = move.category === "physical" ? this.getStatByName(defender.stats, "defense") : this.getStatByName(defender.stats, "special-defense");

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
}