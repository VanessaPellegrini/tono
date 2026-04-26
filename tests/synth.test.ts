import { describe, it, expect } from 'vitest';

describe('SynthEngine', () => {
  it('exports SynthEngine class with expected API', async () => {
    const { SynthEngine } = await import('../src/audio/SynthEngine');
    const engine = new SynthEngine();

    expect(engine.isReady()).toBe(false);
    expect(engine.getInstrument()).toBe('guitar');
    expect(engine.getDetune('guitar')).toBe(0);
    expect(engine.getDetune('piano')).toBe(0);
    expect(engine.getCurrentChord(0)).toBeNull();
    expect(engine.getCurrentChord(1)).toBeNull();
    expect(engine.getAvailableChords()).toEqual(['A', 'D', 'E', 'G', 'C', 'F']);

    engine.setInstrument('piano');
    expect(engine.getInstrument()).toBe('piano');

    engine.setInstrument('guitar');
    expect(engine.getInstrument()).toBe('guitar');

    engine.setDetune('guitar', 10);
    expect(engine.getDetune('guitar')).toBe(10);
    expect(engine.getDetune('piano')).toBe(0);

    engine.dispose();
  });

  it('ensureReady returns a promise', async () => {
    const { SynthEngine } = await import('../src/audio/SynthEngine');
    const engine = new SynthEngine();
    const promise = engine.ensureReady();
    expect(promise).toBeInstanceOf(Promise);
    void promise.then(() => engine.dispose());
  });

  it('setInstrument to same value is no-op', async () => {
    const { SynthEngine } = await import('../src/audio/SynthEngine');
    const engine = new SynthEngine();
    engine.setInstrument('guitar');
    expect(engine.getInstrument()).toBe('guitar');
    engine.dispose();
  });
});
