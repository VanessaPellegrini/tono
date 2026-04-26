# Last Guitar

Browser-based guitar simulator with real instrument samples, DualSense gamepad support, and hand tracking via MediaPipe.

Play chords with a PlayStation DualSense controller or use your webcam and hands — no plugins, no installs, just open the page.

**Live demo:** [last-guitar.vercel.app](https://last-guitar.vercel.app)

## Features

- **Real instrument sounds** — High-quality WAV samples for guitar and piano via Tone.js
- **DualSense gamepad** — Left stick selects chords, right stick strums, L1/R1 for major/minor, triggers for accidentals
- **Hand tracking** — MediaPipe Hands detects finger positions to play chords through your webcam
- **Dual-wheel display** — Two chord wheels with simultaneous playback
- **Built-in songs** — Play along with Through the Valley and Future Days
- **Audio engine** — Polyphonic strumming, reverb, compression, detune, and velocity layers
- **Zero dependencies to run** — Pure browser, no backend

## Tech Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript |
| Audio | Tone.js + Web Audio API |
| Hand Tracking | MediaPipe Hands |
| Input | Gamepad API + Pointer Events |
| Rendering | Canvas 2D |
| Build | Vite |
| Tests | Vitest |

## Project Structure

```
src/
  audio/SynthEngine.ts      # Audio engine: samplers, effects, chord voicings
  data/chords.ts             # Music theory: note names, chord definitions, transposition
  input/GamepadManager.ts    # DualSense mapping and state machine
  input/HandTracker.ts       # MediaPipe hand tracking integration
  input/InputRouter.ts       # Unified input dispatch (gamepad + hand + pointer)
  render/CanvasRenderer.ts   # Main canvas rendering loop
  render/drawChordWheel.ts   # Chord wheel visualization
  render/drawHandPointers.ts # Hand tracking overlay
  render/particles.ts        # Visual effects
  song/SongManager.ts        # Song playback and timing
  songs/                     # Song definitions (Through the Valley, Future Days)
  state/AppState.ts          # Global state management
  main.ts                    # Entry point and UI wiring
tests/
  chords.test.ts             # Music theory unit tests
  synth.test.ts              # Audio engine tests
```

## Getting Started

```bash
git clone https://github.com/VanessaPellegrini/last-guitar.git
cd last-guitar
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

## Controls

### DualSense Gamepad

| Input | Action |
|-------|--------|
| Left Stick X | Select chord (A, D, E, G, C, F) |
| Left Stick Y | Shift octave |
| Right Stick (press & release) | Strum |
| L1 | Major chord |
| R1 | Minor chord |
| L2 / L3 (bottom half) | Flat (b) |
| R2 / L3 (top half) | Sharp (#) |
| Start | Switch instrument (Guitar / Piano) |

### Webcam

- Open webcam mode with the toggle button
- Hold your hand in front of the camera
- Move left/right to select chords
- Raise/lower hand to strum

### Pointer

- Click and drag on the canvas to strum

## Songs

- **Through the Valley** — Shawn James
- **Future Days** — Pearl Jam

## Running Tests

```bash
npm test
```

## License

MIT

---

Built with real guitar samples from [Emily](https://tonejs.github.io/audio/berklee/) and piano velocity layers.
