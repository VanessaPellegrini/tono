# last-guitar

Musical interface with a dual-wheel system for exploring scales and chords. Real instrument samples, webcam hand tracking, and gamepad support.

**Live demo:** [last-guitar.vercel.app](https://last-guitar.vercel.app)

## Features

- **Dual Wheel System** — Left wheel selects the key (circle of fifths), right wheel shows 7 diatonic chords for that key
- **8 scale types** — Major, Minor, Harmonic Minor, Melodic Minor, Dorian, Mixolydian, Pentatonic Major, Pentatonic Minor
- **Accidental toggle** — Switch between `♯` (sharps), `♮` (naturals), and `♭` (flats) display modes
- **Real instrument sounds** — High-quality guitar and piano samples via Tone.js
- **Three input modes** — Joystick (gamepad), Dual Wheel (pointer/click), and Webcam (hand tracking)
- **Webcam hand tracking** — MediaPipe Hands detects finger positions over the wheels
- **Audio engine** — Polyphonic playback, reverb, compression, and velocity layers
- **Zero dependencies to run** — Pure browser, no backend

## Modes

| Mode | Wheels | Camera | Input |
|------|--------|--------|-------|
| **Joystick** | 1 centered | No | Gamepad + pointer |
| **Dual Wheel** | 2 (key + chords) | No | Pointer / click |
| **Webcam** | 2 (key + chords) | Yes + blur | Pointer + hand tracking |

## Controls

### Top Bar

- **Joystick** — Single wheel with gamepad control
- **Dual Wheel** — Two wheels, pointer/click only
- **Webcam** — Two wheels with camera and hand tracking

### Bottom Bar

- **Scale selector** (`◄` / `►`) — Cycle through scale types (Major, Minor, Dorian, etc.)
- **Guitarra / Piano** — Switch instrument
- **`♯` / `♮` / `♭`** — Toggle accidental display mode

### Dual Wheel Interaction

- **Left wheel** — Click a segment to select the key (circle of fifths)
- **Right wheel** — Click a segment to play a diatonic chord (I–vii°)
- Changing the key recalculates all diatonic chords automatically

### DualSense Gamepad (Joystick mode)

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
  audio/SynthEngine.ts        # Audio engine: samplers, effects, chord voicings
  data/chords.ts               # Note names, chord definitions, transposition, displayNote
  data/scales.ts               # Scale types, circle of fifths, diatonic chord generation
  input/GamepadManager.ts      # DualSense mapping and state machine
  input/HandTracker.ts         # MediaPipe hand tracking integration
  input/InputRouter.ts         # Unified input dispatch
  render/CanvasRenderer.ts     # Main canvas rendering loop, dual wheel orchestration
  render/drawChordWheel.ts     # Single chord wheel (joystick mode)
  render/drawDiatonicWheel.ts  # 7-segment diatonic chord wheel (dual wheel mode)
  render/drawScaleWheel.ts     # 12-segment circle of fifths wheel (dual wheel mode)
  render/drawConnection.ts     # Visual bridge between wheels
  render/drawBackground.ts     # Background rendering per mode
  render/drawHandPointers.ts   # Hand tracking overlay
  render/particles.ts          # Visual effects
  song/SongManager.ts          # Song playback and timing
  state/AppState.ts            # Global state: modes, scale, chords, accidental mode
  main.ts                      # Entry point and UI wiring
tests/
  chords.test.ts               # Music theory unit tests
  scales.test.ts               # Scale and diatonic chord tests
  synth.test.ts                # Audio engine tests
```

## Getting Started

```bash
git clone https://github.com/VanessaPellegrini/last-guitar.git
cd last-guitar
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

## Running Tests

```bash
npm test
```

## License

MIT

---

Built with real guitar samples from [Emily](https://tonejs.github.io/audio/berklee/) and piano velocity layers. Developed by [Vanessa](https://links.vanp.dev/).
