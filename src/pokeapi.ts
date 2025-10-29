import { z } from "zod";
export class PokeAPI {
  private static readonly baseUrl: string = "https://pokeapi.co/api/v2";

  constructor() {}

  async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
    let fullURL =
      pageURL !== undefined ? pageURL : PokeAPI.baseUrl + `/location/`;

    try {
      let data = await fetch(fullURL, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let parsedData = shallowLocationsSchema.parse(await data.json());
      return parsedData;
    } catch (err: unknown) {
      throw new Error("The data received was in an incorrect format.");
    }
  }
  async fetchLocation(locationName: string): Promise<Location> {
    let fullURL = PokeAPI.baseUrl + `/${locationName}/`;

    try {
      let data = await fetch(fullURL, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let parsedData = locationSchema.parse(await data.json());
      return parsedData;
    } catch (err: unknown) {
      throw new Error("The data received was in an incorrect format.");
    }
  }
}

export type ShallowLocations = z.infer<typeof shallowLocationsSchema>;
export type ShallowLocation = z.infer<typeof shallowLocationSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Index = z.infer<typeof indexSchema>;
export type Generation = z.infer<typeof generationSchema>;
export type Name = z.infer<typeof nameSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Region = z.infer<typeof regionSchema>;

export const shallowLocationSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const areaSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const generationSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const languageSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const regionSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const shallowLocationsSchema = z.object({
  count: z.number(),
  next: z.string(),
  previous: z.any(),
  results: z.array(shallowLocationSchema),
});

export const indexSchema = z.object({
  game_index: z.number(),
  generation: generationSchema,
});

export const nameSchema = z.object({
  language: languageSchema,
  name: z.string(),
});

export const locationSchema = z.object({
  areas: z.array(areaSchema),
  game_indices: z.array(indexSchema),
  id: z.number(),
  name: z.string(),
  names: z.array(nameSchema),
  region: regionSchema,
});
