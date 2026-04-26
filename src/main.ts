import './style.css';
import { SynthEngine } from './audio/SynthEngine';
import { GamepadManager } from './input/GamepadManager';
import { HandTracker } from './input/HandTracker';
import { InputRouter, type InputEvent } from './input/InputRouter';
import { SongManager } from './song/SongManager';
import { CanvasRenderer } from './render/CanvasRenderer';

const synth = new SynthEngine();
const songManager = new SongManager();
const inputRouter = new InputRouter();
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const webcam = document.getElementById('webcam') as HTMLVideoElement;
const btnJoystick = document.getElementById('btn-joystick') as HTMLButtonElement;
const btnWebcam = document.getElementById('btn-webcam') as HTMLButtonElement;
const btnGuitar = document.getElementById('btn-guitar') as HTMLButtonElement;
const btnPiano = document.getElementById('btn-piano') as HTMLButtonElement;
const btnDetuneUp = document.getElementById('btn-detune-up') as HTMLButtonElement;
const btnDetuneDown = document.getElementById('btn-detune-down') as HTMLButtonElement;
const detuneValue = document.getElementById('detune-value') as HTMLSpanElement;

let renderer: CanvasRenderer;
let gamepadManager: GamepadManager;
let handTracker: HandTracker | null = null;
let strumStart: { x: number; y: number; fired: boolean } | null = null;
let inputMode: 'joystick' | 'webcam' = 'joystick';
let instrumentMode: 'guitar' | 'piano' = 'guitar';

async function ensureSynthReady(): Promise<void> {
  try {
    await synth.init();
  } catch (error) {
    console.warn('Audio initialization failed:', error);
  }
}

function handleInput(event: InputEvent): void {
  const wheel = event.wheelIndex ?? 0;
  switch (event.type) {
    case 'chord-select':
      renderer.setSelectedChord(event.chordIndex ?? 0);
      renderer.setCurrentChordName(event.chord);
      if (inputMode === 'webcam') {
        if (synth.isReady()) {
          synth.playChord(event.chord, true, wheel);
          renderer.triggerFlash(event.chord);
        } else {
          void ensureSynthReady().then(() => {
            synth.playChord(event.chord, true, wheel);
            renderer.triggerFlash(event.chord);
          });
        }
      }
      break;
    case 'chord-play':
      if (inputMode === 'webcam') break;
      if (synth.isReady()) {
        synth.playChord(event.chord, event.sustain ?? false, wheel);
        renderer.triggerFlash(event.chord);
      } else {
        void ensureSynthReady().then(() => {
          synth.playChord(event.chord, event.sustain ?? false, wheel);
          renderer.triggerFlash(event.chord);
        });
      }
      break;
    case 'chord-stop':
      synth.stopChord(wheel);
      break;
  }
}

function setInstrument(mode: 'guitar' | 'piano'): void {
  instrumentMode = mode;
  synth.setInstrument(mode);
  btnGuitar.classList.toggle('active', mode === 'guitar');
  btnPiano.classList.toggle('active', mode === 'piano');
  updateDetuneDisplay();
}

function updateDetuneDisplay(): void {
  const cents = synth.getDetune(instrumentMode);
  detuneValue.textContent = `${cents > 0 ? '+' : ''}${cents} ct`;
}

function strumCurrentChord(): void {
  const chord = renderer.getCurrentChordName();
  if (!chord) return;

  void ensureSynthReady().then(() => {
    synth.playChord(chord);
    renderer.triggerFlash(chord);
  });
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
      onChordSelect: (chord: string, index: number, wheel: number) => inputRouter.handleHandChordSelect(chord, index, wheel),
      onStrumStart: (chord: string) => inputRouter.handleHandStrumStart(chord),
      onStrumEnd: (chord: string, wheel: number) => inputRouter.handleHandStrumEnd(chord, wheel),
      onHandMove: (states) => renderer.setHandPointers(states),
      onShiftChange: () => {},
      onDebug: () => {},
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

function initApp(): void {
  void ensureSynthReady();
  renderer = new CanvasRenderer(canvas, songManager);
  renderer.setInputMode('joystick');
  setInstrument('guitar');
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
    onDebug: () => {},
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

  btnGuitar.addEventListener('click', () => {
    setInstrument('guitar');
    void ensureSynthReady();
  });

  btnPiano.addEventListener('click', () => {
    setInstrument('piano');
    void ensureSynthReady();
  });

  btnDetuneUp.addEventListener('click', () => {
    synth.setDetune(instrumentMode, synth.getDetune(instrumentMode) + 5);
    updateDetuneDisplay();
  });

  btnDetuneDown.addEventListener('click', () => {
    synth.setDetune(instrumentMode, synth.getDetune(instrumentMode) - 5);
    updateDetuneDisplay();
  });

  // Listen for gamepad connection
  window.addEventListener('gamepadconnected', () => {
    if (inputMode === 'joystick') inputRouter.setGamepadActive(true);
  });
}

void initApp();
