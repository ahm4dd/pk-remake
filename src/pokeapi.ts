import { z } from "zod";
import { Cache } from "./pokecache.js";
export class PokeAPI {
  private static readonly baseUrl: string = "https://pokeapi.co/api/v2";
  private cache: Cache;

  constructor(cacheInterval: number = 360000) {
    this.cache = new Cache(cacheInterval);
  }

  async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
    let fullURL =
      pageURL !== undefined
        ? pageURL
        : PokeAPI.baseUrl + `/location/?offset=0&limit=20`;

    let cacheData = this.cache.get(fullURL);
    if (cacheData) {
      return cacheData as ShallowLocations;
    }

    try {
      let data = await fetch(fullURL, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let parsedData = shallowLocationsSchema.parse(await data.json());

      this.cache.add(fullURL, parsedData);

      return parsedData;
    } catch (err: unknown) {
      throw new Error("The data received was in an incorrect format.");
    }
  }
  async fetchLocation(locationName: string): Promise<Location> {
    let fullURL = PokeAPI.baseUrl + `/location-area/${locationName}`;

    let cacheData = this.cache.get(fullURL);
    if (cacheData) {
      return cacheData as Location;
    }

    try {
      let data = await fetch(fullURL, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let parsedData = locationAreaSchema.parse(await data.json());

      this.cache.add(fullURL, parsedData);

      return parsedData;
    } catch (err: unknown) {
      throw new Error("The data received was in an incorrect format.");
    }
  }
}

export type ShallowLocations = z.infer<typeof shallowLocationsSchema>;
export type ShallowLocation = z.infer<typeof shallowLocationSchema>;
export type Location = z.infer<typeof locationAreaSchema>;
export type PokemonEncounters = z.infer<typeof pokemonEncounterArraySchema>;

export const shallowLocationSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const shallowLocationsSchema = z.object({
  count: z.number(),
  next: z.string(),
  previous: z.any(),
  results: z.array(shallowLocationSchema),
});

export const encounterMethodSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const versionSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const locationSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const languageSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const pokemonSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const methodSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const version2Schema = z.object({
  name: z.string(),
  url: z.string(),
});

export const versionDetailSchema = z.object({
  rate: z.number(),
  version: versionSchema,
});

export const nameSchema = z.object({
  language: languageSchema,
  name: z.string(),
});

export const encounterDetailSchema = z.object({
  chance: z.number(),
  condition_values: z.array(z.any()),
  max_level: z.number(),
  method: methodSchema,
  min_level: z.number(),
});

export const encounterMethodRateSchema = z.object({
  encounter_method: encounterMethodSchema,
  version_details: z.array(versionDetailSchema),
});

export const versionDetail2Schema = z.object({
  encounter_details: z.array(encounterDetailSchema),
  max_chance: z.number(),
  version: version2Schema,
});

export const pokemonEncounterSchema = z.object({
  pokemon: pokemonSchema,
  version_details: z.array(versionDetail2Schema),
});

export const pokemonEncounterArraySchema = z.array(pokemonEncounterSchema);

export const locationAreaSchema = z.object({
  encounter_method_rates: z.array(encounterMethodRateSchema),
  game_index: z.number(),
  id: z.number(),
  location: locationSchema,
  name: z.string(),
  names: z.array(nameSchema),
  pokemon_encounters: pokemonEncounterArraySchema,
});
