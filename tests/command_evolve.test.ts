import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commandEvolve } from '../src/commands/command_evolve';
import { type State } from '../src/state';
import { Pokemon } from '../src/pokemon';
import { PokeAPI } from '../src/pokeapi';

describe('Evolve Command Tests', () => {
  let mockState: State;
  let consoleSpy: vi.SpyInstance;
  let pokeAPIMock: Partial<PokeAPI>;
  let rlQuestionSpy: vi.SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mocking PokeAPI methods
    pokeAPIMock = {
      getPokemonSpecies: vi.fn(),
      getPokemonData: vi.fn(),
      getMoveData: vi.fn(),
      getEvolutionChain: vi.fn(),
    };

    // Mocking readline for input prompts
    rlQuestionSpy = vi.fn().mockImplementation((query, callback) => {
      if (query.includes('Choose a move')) {
        callback('1'); // Default to first move if needed, though not directly used in evolve
      } else if (query.includes('Attempt to catch?')) {
        callback('no'); // Default to not catching
      } else if (query.includes('Choose a ball')) {
        callback('pokeball'); // Default to pokeball
      }
    });

    // Mock State object
    mockState = {
      rl: { question: rlQuestionSpy } as any, 
      commands: {} as any, 
      pokeapi: pokeAPIMock as PokeAPI,
      player: {
        pokemon: [],
      },
      input: { command: 'evolve', args: [], options: {} },
    };
  });

  it('should prompt for input if no Pokemon identifier is provided', async () => {
    mockState.input.args = [];
    await commandEvolve(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Please specify a Pokemon to evolve (by name or index).');
  });

  it('should handle Pokemon not found in party', async () => {
    mockState.input.args = ['nonexistentmon'];
    await commandEvolve(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pokemon \'nonexistentmon\' not found in your party.');
  });

  it('should handle Pokemon with no evolution chain', async () => {
    mockState.input.args = ['pikachu'];
    mockState.player.pokemon = [{ name: 'Pikachu', experience: 100, baseCatchRate: 45, level: 5, status: null, stats: [{ name: 'hp', value: 35 }], types: ['electric'], moves: [] }];
    pokeAPIMock.getPokemonSpecies = vi.fn().mockResolvedValue({ name: 'pikachu', capture_rate: 190, base_happiness: 60, evolution_chain: null });
    await commandEvolve(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pikachu does not have an evolution chain.');
  });

  it('should handle Pokemon that cannot evolve at the current level', async () => {
    mockState.input.args = ['charmander'];
    mockState.player.pokemon = [{ name: 'Charmander', experience: 120, baseCatchRate: 45, level: 10, status: null, stats: [{ name: 'hp', value: 39 }], types: ['fire'], moves: [] }];
    pokeAPIMock.getPokemonSpecies = vi.fn().mockResolvedValue({ name: 'charmander', capture_rate: 45, base_happiness: 60, evolution_chain: { url: 'chain-url' } });
    pokeAPIMock.getEvolutionChain = vi.fn().mockResolvedValue({
      chain: [
        { from: 'charmander', to: 'charmeleon', minLevel: 16, trigger: 'level-up' },
      ]
    });
    await commandEvolve(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Charmander cannot evolve at this time (check level or evolution criteria).');
  });

  it('should evolve Pokemon when criteria are met', async () => {
    mockState.input.args = ['1']; // Evolve the first Pokemon (Charmander)
    const initialPokemon: Pokemon = { name: 'Charmander', experience: 120, baseCatchRate: 45, level: 16, status: null, stats: [{ name: 'hp', value: 39 }, { name: 'attack', value: 52 }, { name: 'defense', value: 43 }, { name: 'special-attack', value: 60 }, { name: 'special-defense', value: 50 }, { name: 'speed', value: 65 }], types: ['fire'], moves: [{ name: 'Tackle', power: 40, type: 'normal', category: 'physical', accuracy: 100 }] };
    mockState.player.pokemon = [initialPokemon];

    pokeAPIMock.getPokemonSpecies = vi.fn().mockResolvedValue({ name: 'charmander', capture_rate: 45, base_happiness: 60, evolution_chain: { url: 'chain-url' } });
    pokeAPIMock.getEvolutionChain = vi.fn().mockResolvedValue({
      chain: [
        { from: 'charmander', to: 'charmeleon', minLevel: 16, trigger: 'level-up' },
      ]
    });
    pokeAPIMock.getPokemonData = vi.fn().mockResolvedValue({ name: 'charmeleon', stats: [{ stat: { name: 'hp' }, base_stat: 58 }, { stat: { name: 'attack' }, base_stat: 64 }, { stat: { name: 'defense' }, base_stat: 58 }, { stat: { name: 'special-attack' }, base_stat: 80 }, { stat: { name: 'special-defense' }, base_stat: 65 }, { stat: { name: 'speed' }, base_stat: 80 }], types: [{ type: { name: 'fire' } }], moves: [{ move: { name: 'scratch', power: 40, type: { name: 'normal' }, damage_class: { name: 'physical' }, accuracy: 100 } }] });
    pokeAPIMock.getMoveData = vi.fn().mockResolvedValue({ name: 'scratch', power: 40, type: { name: 'normal' }, damage_class: { name: 'physical' }, accuracy: 100 });

    await commandEvolve(mockState);

    expect(consoleSpy).toHaveBeenCalledWith('✨ Your Charmander evolved into charmeleon! ✨');
    expect(mockState.player.pokemon.length).toBe(1);
    expect(mockState.player.pokemon[0].name).toBe('charmeleon');
    expect(mockState.player.pokemon[0].level).toBe(16);
  });
});
