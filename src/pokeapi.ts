import { z } from "zod";
import { Cache } from "./pokecache.js";

// Define schemas for Pokemon species, data, stats, moves, and evolution chains
const pokemonSpeciesSchema = z.object({
  name: z.string(),
  capture_rate: z.number(),
  base_happiness: z.number(),
  evolution_chain: z.object({
    url: z.string()
  }).nullable()
});

const pokemonDataBaseSchema = z.object({
  name: z.string(),
  stats: z.array(z.object({
    base_stat: z.number(),
    stat: z.object({ name: z.string() }),
  })),
  types: z.array(z.object({
    type: z.object({ name: z.string() }),
  })),
});

const moveSchema = z.object({
  name: z.string(),
  power: z.number().nullable(),
  type: z.object({ name: z.string() }),
  damage_class: z.object({ name: z.string() }), // 'physical', 'special', 'status'
  accuracy: z.number().nullable(),
});

// Schema for a single evolution link in the chain
const evolutionLinkSchema = z.object({
  is_baby: z.boolean(),
  species: z.object({ name: z.string() }),
  evolution_details: z.array(z.object({
    min_level: z.number().nullable(),
    trigger: z.object({ name: z.string() }),
    // Add other evolution triggers if needed (e.g., item, trade, time of day)
  }))
});

// Schema for the evolution chain structure
const evolutionChainSchema = z.object({
  chain: evolutionLinkSchema.transform(chain => {
    // Flatten the chain into a more usable structure
    const evolutions: { from: string; to: string; minLevel: number | null; trigger: string }[] = [];
    function traverse(link: z.infer<typeof evolutionLinkSchema>) {
      for (const evolvesTo of link.evolves_to) {
        const evolutionDetail = evolvesTo.evolution_details[0]; // Assuming one primary evolution detail
        evolutions.push({
          from: link.species.name,
          to: evolvesTo.species.name,
          minLevel: evolutionDetail?.min_level ?? null,
          trigger: evolutionDetail?.trigger.name ?? 'level-up',
        });
        traverse(evolvesTo);
      }
    }
    traverse(chain);
    return evolutions;
  })
});

export class PokeAPI {
  private static readonly baseUrl: string = "https://pokeapi.co/api/v2";
  private cache: Cache;

  constructor(cacheInterval: number = 360000) {
    this.cache = new Cache(cacheInterval);
  }

  private async fetch<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
    let cacheData = this.cache.get(url);
    if (cacheData) {
      return cacheData as T;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const parsedData = schema.parse(data);

      this.cache.add(url, parsedData);
      return parsedData;
    } catch (err: unknown) {
      console.error(`Error fetching or parsing data from ${url}:`, err);
      throw new Error("Failed to fetch or parse data from PokeAPI.");
    }
  }

  async getPokemonSpecies(name: string): Promise<z.infer<typeof pokemonSpeciesSchema>> {
    const url = `${PokeAPI.baseUrl}/pokemon-species/${name}`;
    return this.fetch(url, pokemonSpeciesSchema);
  }

  async getPokemonData(name: string): Promise<z.infer<typeof pokemonDataBaseSchema>> {
    const url = `${PokeAPI.baseUrl}/pokemon/${name}`;
    return this.fetch(url, pokemonDataBaseSchema);
  }

  async getMoveData(name: string): Promise<z.infer<typeof moveSchema>> {
    const url = `${PokeAPI.baseUrl}/move/${name}`;
    return this.fetch(url, moveSchema);
  }

  async getEvolutionChain(url: string): Promise<z.infer<typeof evolutionChainSchema>> {
    return this.fetch(url, evolutionChainSchema);
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
