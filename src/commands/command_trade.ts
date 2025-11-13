import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import { db } from "./../database.js";

export async function commandTrade(state: State) {
  try {
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to trade."));
      return;
    }

    const args = state.input.args;
    if (args.length < 1) {
      console.log("Usage: trade <subcommand> [args]");
      console.log("Subcommands: offer, list, accept, reject");
      return;
    }

    const subcommand = args[0];

    switch (subcommand) {
      case 'offer':
        if (args.length < 3) {
          console.log("Usage: trade offer <to_username> <my_pokemon_index>");
          return;
        }
        const toUsername = args[1];
        const myPokemonIndex = parseInt(args[2], 10) - 1;

        const toUser = db.getUserByUsername(toUsername);
        if (!toUser) {
          console.log(chalk.red(`User ${toUsername} not found.`));
          return;
        }

        if (toUser.id === state.currentUser.id) {
          console.log(chalk.red("You cannot trade with yourself."));
          return;
        }

        const myPokemon = state.player.pokemon[myPokemonIndex];
        if (!myPokemon) {
          console.log(chalk.red("Invalid Pokemon index."));
          return;
        }

        // Find the pokemon id in DB
        const pokemonId = db.getPokemonIdByUserAndName(state.currentUser.id, myPokemon.name);
        if (!pokemonId) {
          console.log(chalk.red("Pokemon not found in database."));
          return;
        }

        const tradeId = db.createTrade(state.currentUser.id, toUser.id, pokemonId);
        console.log(chalk.green(`Trade offer sent to ${toUsername} for your ${myPokemon.name}.`));
        break;

      case 'list':
        const pendingTrades = db.getPendingTradesForUser(state.currentUser.id);
        if (pendingTrades.length === 0) {
          console.log("No pending trade offers.");
          return;
        }
        console.log("Pending trade offers:");
        pendingTrades.forEach(trade => {
          const fromUsername = db.getUsernameById(trade.from_user_id);
          console.log(`ID: ${trade.id}, From: ${fromUsername}, Offering: Pokemon ID ${trade.from_pokemon_id}`);
        });
        break;

      case 'accept':
        if (args.length < 3) {
          console.log("Usage: trade accept <trade_id> <my_pokemon_index>");
          return;
        }
        const tradeIdAccept = parseInt(args[1], 10);
        const myPokemonIndexAccept = parseInt(args[2], 10) - 1;

        const myPokemonAccept = state.player.pokemon[myPokemonIndexAccept];
        if (!myPokemonAccept) {
          console.log(chalk.red("Invalid Pokemon index."));
          return;
        }

        // Find pokemon id
        const pokemonIdAccept = db.getPokemonIdByUserAndName(state.currentUser.id, myPokemonAccept.name);
        if (!pokemonIdAccept) {
          console.log(chalk.red("Pokemon not found in database."));
          return;
        }

        db.acceptTrade(tradeIdAccept, pokemonIdAccept);
        db.executeTrade(tradeIdAccept);
        console.log(chalk.green("Trade accepted and executed."));
        // Reload player pokemon
        const dbPokemon = db.getUserPokemon(state.currentUser.id);
        state.player.pokemon = dbPokemon.map(p => ({
          name: p.name,
          experience: p.experience,
          baseCatchRate: 0, // Not stored
          level: p.level,
          status: null,
          stats: JSON.parse(p.stats),
          types: JSON.parse(p.types),
          moves: JSON.parse(p.moves),
        }));
        break;

      case 'reject':
        if (args.length < 2) {
          console.log("Usage: trade reject <trade_id>");
          return;
        }
        const tradeIdReject = parseInt(args[1], 10);
        db.rejectTrade(tradeIdReject);
        console.log(chalk.green("Trade rejected."));
        break;

      default:
        console.log("Unknown subcommand.");
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}