  it('should handle Pokemon not found in party', async () => {
    mockState.input.args = ['nonexistentmon'];
    await commandEvolve(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pokemon \'nonexistentmon\' not found in your party.');
  });