import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commandRelease } from '../src/commands/command_release';
import { type State } from '../src/state';
import { Pokemon } from '../src/pokemon';

describe('Release Command Tests', () => {
  let mockState: State;
  let consoleSpy: vi.SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock State object with some initial Pokemon
    mockState = {
      rl: {} as any, 
      commands: {} as any, 
      pokeapi: {} as any, 
      player: {
        pokemon: [
          { name: 'Pikachu', experience: 100, baseCatchRate: 45, level: 5, status: null, stats: [{ name: 'hp', value: 35 }], types: ['electric'], moves: [] },
          { name: 'Charmander', experience: 120, baseCatchRate: 45, level: 7, status: null, stats: [{ name: 'hp', value: 39 }], types: ['fire'], moves: [] },
        ],
      },
      input: { command: 'release', args: [], options: {} },
    };
  });

  it('should prompt for input if no Pokemon identifier is provided', async () => {
    mockState.input.args = [];
    await commandRelease(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Please specify a Pokemon to release (by name or index).');
  });

  it('should release a Pokemon by its index', async () => {
    mockState.input.args = ['1']; // Release Pikachu (index 0)
    await commandRelease(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('You released Pikachu.');
    expect(mockState.player.pokemon.length).toBe(1);
    expect(mockState.player.pokemon[0].name).toBe('Charmander');
  });

  it('should release a Pokemon by its name (case-insensitive)', async () => {
    mockState.input.args = ['charmander']; // Release Charmander
    await commandRelease(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('You released Charmander.');
    expect(mockState.player.pokemon.length).toBe(1);
    expect(mockState.player.pokemon[0].name).toBe('Pikachu');
  });

  it('should handle releasing a Pokemon that is not found by index', async () => {
    mockState.input.args = ['3']; // Index out of bounds
    await commandRelease(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pokemon '3' not found in your party.');
    expect(mockState.player.pokemon.length).toBe(2);
  });

  it('should handle releasing a Pokemon that is not found by name', async () => {
    mockState.input.args = ['Squirtle']; // Pokemon not in party
    await commandRelease(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pokemon 'Squirtle' not found in your party.');
    expect(mockState.player.pokemon.length).toBe(2);
  });
});
