import './style.css';
import { SynthEngine } from './audio/SynthEngine';
import { GamepadManager } from './input/GamepadManager';
import { HandTracker, type HandDebugInfo } from './input/HandTracker';
import { InputRouter, type InputEvent } from './input/InputRouter';
import { SongManager } from './song/SongManager';
import { CanvasRenderer } from './render/CanvasRenderer';
import { ROOT_NAMES } from './data/chords';

const synth = new SynthEngine();
const songManager = new SongManager();
const inputRouter = new InputRouter();
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const webcam = document.getElementById('webcam') as HTMLVideoElement;
const debugPanel = document.getElementById('debug-panel') as HTMLDivElement;
const btnJoystick = document.getElementById('btn-joystick') as HTMLButtonElement;
const btnWebcam = document.getElementById('btn-webcam') as HTMLButtonElement;

let renderer: CanvasRenderer;
let gamepadManager: GamepadManager;
let handTracker: HandTracker | null = null;
let strumStart: { x: number; y: number; fired: boolean } | null = null;
let debugRafId: number | null = null;
const debugEnabled = true;
let inputMode: 'joystick' | 'webcam' = 'joystick';

async function ensureSynthReady(): Promise<void> {
  try {
    await synth.init();
  } catch (error) {
    console.warn('Audio initialization failed:', error);
  }
}

function handleInput(event: InputEvent): void {
  switch (event.type) {
    case 'chord-select':
      renderer.setSelectedChord(event.chordIndex ?? 0);
      renderer.setCurrentChordName(event.chord);
      break;
    case 'chord-play':
      if (synth.isReady()) {
        synth.playChord(event.chord, event.sustain ?? false);
        renderer.triggerFlash(event.chord);
      } else {
        void ensureSynthReady().then(() => {
          synth.playChord(event.chord, event.sustain ?? false);
          renderer.triggerFlash(event.chord);
        });
      }
      break;
    case 'chord-stop':
      synth.stopChord();
      break;
  }
}

function strumCurrentChord(): void {
  const chord = renderer.getCurrentChordName();
  if (!chord) return;

  void ensureSynthReady().then(() => {
    synth.playChord(chord);
    renderer.triggerFlash(chord);
  });
}

function renderHandDebug(hands: HandDebugInfo[]): void {
  if (!debugEnabled) return;
  const lines = hands.map((h) => {
    const zone = h.zone !== null ? ROOT_NAMES[h.zone] : '—';
    return [
      `[wheel ${h.wheel}] state:${h.state} src:${h.source} conf:${h.confidence.toFixed(2)}`,
      `  raw:    (${h.rawX.toFixed(3)}, ${h.rawY.toFixed(3)})`,
      `  smooth: (${h.smoothX.toFixed(3)}, ${h.smoothY.toFixed(3)})`,
      `  zone:${zone} chord:${h.chord ?? '—'} shift:${h.shift > 0 ? '+' : ''}${h.shift} side:${h.sideZone}`,
    ].join('\n');
  });
  debugPanel.textContent = lines.join('\n');
}

function setActiveMode(mode: 'joystick' | 'webcam'): void {
  inputMode = mode;
  btnJoystick.classList.toggle('active', mode === 'joystick');
  btnWebcam.classList.toggle('active', mode === 'webcam');
  inputRouter.setGamepadActive(mode === 'joystick');
  renderer.setInputMode(mode);
}

async function enableWebcamMode(): Promise<void> {
  await ensureSynthReady();
  if (!handTracker) {
    handTracker = new HandTracker(webcam, {
      onChordSelect: (chord, index, _wheel) => inputRouter.handleHandChordSelect(chord, index),
      onStrumStart: (chord, _wheel) => inputRouter.handleHandStrumStart(chord),
      onStrumEnd: (chord, _wheel) => inputRouter.handleHandStrumEnd(chord),
      onHandMove: (states) => renderer.setHandPointers(states),
      onShiftChange: (_state) => {},
      onDebug: renderHandDebug,
    });
  }

  await handTracker.start();
  document.body.classList.add('webcam-mode');
  setActiveMode('webcam');
}

function enableJoystickMode(): void {
  handTracker?.stop();
  renderer.setHandPointers([]);
  document.body.classList.remove('webcam-mode');
  setActiveMode('joystick');
}

function startDebugPolling(): void {
  if (!debugEnabled) return;

  const tick = (): void => {
    const gamepads = navigator.getGamepads();
    const gp = Array.from(gamepads).find((pad) => pad !== null);

    if (!gp) {
      debugPanel.textContent = 'gamepad: none';
      debugRafId = requestAnimationFrame(tick);
      return;
    }

    const buttons = Array.from(gp.buttons).map((button) => button.pressed || button.value > 0.5);
    const axes = gp.axes.map((axis) => Number(axis.toFixed(2)));

    debugPanel.textContent = [
      `id: ${gp.id}`,
      `connected: ${gp.connected ? 'yes' : 'no'}`,
      `axes: ${axes.map((value, index) => `${index}:${value}`).join(' ')}`,
      `buttons: ${buttons.map((pressed, index) => `${index}:${pressed ? '1' : '0'}`).join(' ')}`,
      `rs: ${axes[2] ?? 0}, ${axes[3] ?? 0}`,
      `l2/r2 axes: ${axes[4] ?? 0} ${axes[5] ?? 0}`,
    ].join('\n');

    debugRafId = requestAnimationFrame(tick);
  };

  if (debugRafId) cancelAnimationFrame(debugRafId);
  debugRafId = requestAnimationFrame(tick);
}

function initApp(): void {
  void ensureSynthReady();
  renderer = new CanvasRenderer(canvas, songManager);
  renderer.setInputMode('joystick');
  gamepadManager = new GamepadManager({
    onChordSelect: (chord, index) => {
      if (inputMode !== 'joystick') return;
      inputRouter.handleChordSelect(chord, index);
    },
    onStrum: (chord) => {
      if (inputMode !== 'joystick') return;
      inputRouter.handleStrum(chord);
    },
    onStrumHoldStart: (chord) => {
      if (inputMode !== 'joystick') return;
      inputRouter.handleStrumHoldStart(chord);
    },
    onStrumHoldEnd: (chord) => {
      if (inputMode !== 'joystick') return;
      inputRouter.handleStrumHoldEnd(chord);
    },
    onDebug: (state) => {
      if (inputMode !== 'joystick') return;
      if (!debugEnabled) return;
      const buttons = state.buttons
        .map((pressed, index) => `${index}:${pressed ? '1' : '0'}`)
        .join(' ');
      const axes = state.axes.map((value, index) => `${index}:${value.toFixed(2)}`).join(' ');

      debugPanel.textContent = [
        `chord: ${state.chord}`,
        `index: ${state.chordIndex}`,
        `quality: ${state.quality}${state.sharp ? ' accidental' : ''}`,
        `rsHolding: ${state.rsHolding ? 'yes' : 'no'}`,
        `rs: ${state.rsX.toFixed(2)}, ${state.rsY.toFixed(2)} mag:${state.rsMagnitude.toFixed(2)} src:${state.rsSource}`,
        `axes: ${axes}`,
        `buttons: ${buttons}`,
      ].join('\n');
    },
  });
  gamepadManager.start();
  inputRouter.connectGamepad();
  inputRouter.on(handleInput);
  setActiveMode('joystick');

  btnJoystick.addEventListener('click', () => {
    void ensureSynthReady();
    enableJoystickMode();
  });

  btnWebcam.addEventListener('click', async () => {
    try {
      void ensureSynthReady();
      await enableWebcamMode();
    } catch {
      document.body.classList.remove('webcam-mode');
      setActiveMode('joystick');
    }
  });

  canvas.addEventListener('pointerdown', (event) => {
    void ensureSynthReady();
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
    if (inputMode === 'joystick') inputRouter.setGamepadActive(true);
  });

  if (debugEnabled) debugPanel.style.display = 'block';
  startDebugPolling();
}

void initApp();
