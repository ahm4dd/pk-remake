import { PokemonEncounters, ShallowLocations } from "./pokeapi.js";

export function printLocations(locations: ShallowLocations) {
  console.log("Locations: ");
  console.log("------------");

  for (const location of locations.results) {
    console.log(`- ${location.name}`);
  }

  console.log("------------");
}

export function printPokemons(pokemon_encounters: PokemonEncounters) {
  console.log("Pokemons: ");
  console.log("------------");

  for (const pokemon of pokemon_encounters) {
    console.log(`- ${pokemon.pokemon.name}`);
  }

  console.log("------------");
}

export function getTypedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
