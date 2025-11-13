import { type State } from "./../state.js";

export async function commandPokedex(state: State) {
  const caughtPokemon = state.player.pokemon;

  if (caughtPokemon.length === 0) {
    console.log("You haven't caught any Pokemon yet!");
    return;
  }

  console.log("\nYour Pokedex:");
  console.log("-------------");
  caughtPokemon.forEach((pokemon, index) => {
    console.log(`${index + 1}. ${pokemon.name} (Exp: ${pokemon.experience.toFixed(2)}, Base Catch Rate: ${pokemon.baseCatchRate.toFixed(2)})`);
  });
  console.log("-------------");
}
