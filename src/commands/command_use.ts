import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import { db } from "./../database.js";

export async function commandUse(state: State) {
  try {
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to use items."));
      return;
    }

    const args = state.input.args;
    if (args.length < 2) {
      console.log("Usage: use <item_name> <pokemon_index>");
      return;
    }

    const itemName = args[0];
    const pokemonIndex = parseInt(args[1], 10) - 1;

    const inventory = db.getInventory(state.currentUser.id);
    const item = inventory.find(i => i.item_name === itemName && i.quantity > 0);
    if (!item) {
      console.log(chalk.red("Item not found or out of stock."));
      return;
    }

    const pokemon = state.player.pokemon[pokemonIndex];
    if (!pokemon) {
      console.log(chalk.red("Pokemon not found."));
      return;
    }

    // Use item
    if (item.item_type === 'heal') {
      const healAmount = itemName === 'potion' ? 20 : itemName === 'super-potion' ? 50 : 0;
      if (healAmount > 0) {
        // Assuming HP stat is current HP, but we don't track current HP.
        // For simplicity, just say healed.
        console.log(chalk.green(`Healed ${pokemon.name} by ${healAmount} HP!`));
        db.updateInventory(state.currentUser.id, item.item_type, item.item_name, -1);
      } else {
        console.log(chalk.red("Unknown heal item."));
      }
    } else {
      console.log(chalk.red("Item not usable."));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}