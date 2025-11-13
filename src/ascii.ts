// Simple ASCII art for Pokemon
export const pokemonAscii: Record<string, string> = {
  pikachu: `
   ⚡
  /\\_/\\
 ( o.o )
  > ^ <
`,
  charmander: `
   🔥
  .-""-.
 /      \\
|  FIRE  |
 \\      /
  '----'
`,
  squirtle: `
   💧
 .-""-.
( WATER )
 \\____/
`,
  bulbasaur: `
   🌱
 .-""-.
( GRASS )
 \\____/
`,
  default: `
   🐾
 .-""-.
( POKEMON )
 \\____/
`,
};

// Get ASCII art for a Pokemon
export function getPokemonAscii(name: string): string {
  return pokemonAscii[name.toLowerCase()] || pokemonAscii.default;
}