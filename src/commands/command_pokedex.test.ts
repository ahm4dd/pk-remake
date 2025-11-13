import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commandPokedex } from '../src/commands/command_pokedex';
import { type State } from '../src/state';
import { Pokemon } from '../src/pokemon';

describe('Pokedex Command Tests', () => {
  let mockState: State;
  let consoleSpy: vi.SpyInstance;

  beforeEach(() => {
    // Reset mocks and spies before each test
    vi.clearAllMocks();

    // Mock console.log to capture output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock State object
    mockState = {
      rl: {} as any, // Mock readline interface
      commands: {} as any, // Mock commands registry
      pokeapi: {} as any, // Mock pokeapi
      player: {
        pokemon: [], // Start with an empty party
      },
      input: { command: 'pokedex', args: [], options: {} },
    };
  });

  it('should display a message when the party is empty', async () => {
    await commandPokedex(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('You haven\'t caught any Pokemon yet!');
  });

  it('should display the list of caught Pokemon correctly', async () => {
    const mockPokemon1: Pokemon = { name: 'Pikachu', experience: 100, baseCatchRate: 45, level: 5, status: null, stats: [{ name: 'hp', value: 35 }], types: ['electric'], moves: [] };
    const mockPokemon2: Pokemon = { name: 'Charmander', experience: 120, baseCatchRate: 45, level: 7, status: null, stats: [{ name: 'hp', value: 39 }], types: ['fire'], moves: [] };
    mockState.player.pokemon = [mockPokemon1, mockPokemon2];

    await commandPokedex(mockState);

    expect(consoleSpy).toHaveBeenCalledWith('\nYour Pokedex:');
    expect(consoleSpy).toHaveBeenCalledWith('-------------');
    expect(consoleSpy).toHaveBeenCalledWith('1. Pikachu (Exp: 100.00, Base Catch Rate: 45.00)');
    expect(consoleSpy).toHaveBeenCalledWith('2. Charmander (Exp: 120.00, Base Catch Rate: 45.00)');
    expect(consoleSpy).toHaveBeenCalledWith('-------------');
  });

  it('should handle Pokemon with different stats and experience correctly', async () => {
    const mockPokemon: Pokemon = { name: 'Bulbasaur', experience: 75, baseCatchRate: 45, level: 3, status: null, stats: [{ name: 'hp', value: 45 }], types: ['grass', 'poison'], moves: [] };
    mockState.player.pokemon = [mockPokemon];

    await commandPokedex(mockState);

    expect(consoleSpy).toHaveBeenCalledWith('1. Bulbasaur (Exp: 75.00, Base Catch Rate: 45.00)');
  });
});
