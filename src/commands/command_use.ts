import { type State } from "./../state.js";
import chalk from "chalk";
import { db, type Pokemon as DBPokemon } from "./../database.js";
import { type Pokemon as MemoryPokemon } from "./../pokemon.js";

export async function commandUse(state: State) {
  try {
    const args = state.input.args;
    if (args.length < 2) {
      console.log("Usage: use <item_name> <pokemon_index>");
      return;
    }

    const itemName = args[0];
    const pokemonIndex = parseInt(args[1], 10) - 1;

    if (state.currentUser) {
      // Logged in user flow
      const inventory = db.getInventory(state.currentUser.id);
      const item = inventory.find(i => i.item_name === itemName && i.quantity > 0);
      
      if (!item) {
        console.log(chalk.red("Item not found or out of stock."));
        return;
      }

      const userPokemonList = db.getUserPokemon(state.currentUser.id);
      const pokemon = userPokemonList[pokemonIndex];

      if (!pokemon) {
        console.log(chalk.red("Pokemon not found."));
        return;
      }

      if (item.item_type === 'heal') {
        const healAmount = itemName === 'potion' ? 20 : itemName === 'super-potion' ? 50 : itemName === 'hyper-potion' ? 200 : 0;
        
        if (healAmount > 0) {
          const stats = JSON.parse(pokemon.stats);
          const maxHp = stats.find((s: any) => s.name === 'hp')?.value || 100;
          const currentHp = pokemon.current_hp !== undefined ? pokemon.current_hp : maxHp;

          if (currentHp >= maxHp) {
            console.log(chalk.yellow(`${pokemon.name} is already at full HP!`));
            return;
          }

          const newHp = Math.min(maxHp, currentHp + healAmount);
          db.updatePokemonHP(pokemon.id, newHp);
          db.updateInventory(state.currentUser.id, item.item_type, item.item_name, -1);
          
          console.log(chalk.green(`Used ${itemName} on ${pokemon.name}. HP: ${currentHp} -> ${newHp}/${maxHp}`));
        } else {
          console.log(chalk.red("Unknown heal item."));
        }
      } else if (item.item_type === 'ball') {
        console.log(chalk.yellow("Pokeballs are used with the 'catch' command, not 'use'."));
      } else {
        console.log(chalk.red("Item not usable."));
      }

    } else {
      // Guest flow (memory only)
      const pokemon = state.player.pokemon[pokemonIndex];
      if (!pokemon) {
        console.log(chalk.red("Pokemon not found."));
        return;
      }
      
      // For guests, we don't have inventory tracking yet, just simulate effect
      console.log(chalk.yellow("Inventory is only available for logged-in users."));
      
      if (['potion', 'super-potion'].includes(itemName)) {
         const healAmount = itemName === 'potion' ? 20 : 50;
         const maxHp = pokemon.stats.find(s => s.name === 'hp')?.value || 100;
         const currentHp = pokemon.currentHp !== undefined ? pokemon.currentHp : maxHp;
         
         const newHp = Math.min(maxHp, currentHp + healAmount);
         pokemon.currentHp = newHp;
         console.log(chalk.green(`(Simulation) Used ${itemName} on ${pokemon.name}. HP: ${currentHp} -> ${newHp}/${maxHp}`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}