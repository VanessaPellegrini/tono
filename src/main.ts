import './style.css';
import { SynthEngine } from './audio/SynthEngine';
import { GamepadManager } from './input/GamepadManager';
import { InputRouter, type InputEvent } from './input/InputRouter';
import { SongManager } from './song/SongManager';
import { CanvasRenderer } from './render/CanvasRenderer';

const synth = new SynthEngine();
const songManager = new SongManager();
const inputRouter = new InputRouter();
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay')!;
const ui = document.getElementById('ui')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;

let renderer: CanvasRenderer;
let gamepadManager: GamepadManager;
let strumStart: { x: number; y: number; fired: boolean } | null = null;

// UI elements
const btnFree = document.getElementById('btn-free') as HTMLButtonElement;

function handleInput(event: InputEvent): void {
  switch (event.type) {
    case 'chord-select':
      renderer.setSelectedChord(event.chordIndex ?? 0);
      renderer.setCurrentChordName(event.chord);
      break;
    case 'chord-play':
      synth.playChord(event.chord, event.sustain ?? false);
      renderer.triggerFlash(event.chord);
      break;
    case 'chord-stop':
      synth.stopChord();
      break;
  }
}

function strumCurrentChord(): void {
  const chord = renderer.getCurrentChordName();
  if (!chord) return;

  synth.playChord(chord);
  renderer.triggerFlash(chord);
}

// Start button
startBtn.addEventListener('click', async () => {
  await synth.init();
  renderer = new CanvasRenderer(canvas, songManager);
  gamepadManager = new GamepadManager({
    onChordSelect: (chord, index) => inputRouter.handleChordSelect(chord, index),
    onStrum: (chord) => inputRouter.handleStrum(chord),
    onStrumHoldStart: (chord) => inputRouter.handleStrumHoldStart(chord),
    onStrumHoldEnd: (chord) => inputRouter.handleStrumHoldEnd(chord),
  });
  gamepadManager.start();
  inputRouter.connectGamepad();
  inputRouter.on(handleInput);

  btnFree.addEventListener('click', () => {
    songManager.stop();
    synth.stopChord();
    renderer.setMode('free');
    btnFree.classList.add('active');
  });

  canvas.addEventListener('pointerdown', (event) => {
    strumStart = { x: event.clientX, y: event.clientY, fired: false };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!strumStart || strumStart.fired) return;

    const dx = event.clientX - strumStart.x;
    const dy = event.clientY - strumStart.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 30) {
      strumStart.fired = true;
      strumCurrentChord();
    }
  });

  canvas.addEventListener('pointerup', () => {
    strumStart = null;
  });

  canvas.addEventListener('pointercancel', () => {
    strumStart = null;
  });

  // Listen for gamepad connection
  window.addEventListener('gamepadconnected', () => {
    inputRouter.setGamepadActive(true);
  });

  overlay.style.display = 'none';
  ui.style.display = 'flex';
});
