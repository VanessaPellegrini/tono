import './style.css';
import { start as toneStart } from 'tone';
import { SynthEngine } from './audio/SynthEngine';
import { GamepadManager } from './input/GamepadManager';
import { HandTracker } from './input/HandTracker';
import { InputRouter, type InputEvent } from './input/InputRouter';
import { SongManager } from './song/SongManager';
import { CanvasRenderer } from './render/CanvasRenderer';
import { appState, type InputMode } from './state/AppState';
import { CIRCLE_OF_FIFTHS, SCALE_TYPES } from './data/scales';

const synth = new SynthEngine();
const songManager = new SongManager();
const inputRouter = new InputRouter();
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const webcam = document.getElementById('webcam') as HTMLVideoElement;
const btnJoystick = document.getElementById('btn-joystick') as HTMLButtonElement;
const btnDualWheel = document.getElementById('btn-dualwheel') as HTMLButtonElement;
const btnWebcam = document.getElementById('btn-webcam') as HTMLButtonElement;
const btnGuitar = document.getElementById('btn-guitar') as HTMLButtonElement;
const btnPiano = document.getElementById('btn-piano') as HTMLButtonElement;
const btnScalePrev = document.getElementById('btn-scale-prev') as HTMLButtonElement;
const btnScaleNext = document.getElementById('btn-scale-next') as HTMLButtonElement;
const scaleLabel = document.getElementById('scale-label') as HTMLSpanElement;

let renderer: CanvasRenderer;
let gamepadManager: GamepadManager;
let handTracker: HandTracker | null = null;
let strumStart: { x: number; y: number; fired: boolean } | null = null;

function playAndFlash(chord: string, sustain: boolean, wheel: number): void {
  void synth.withReady().then((ready) => {
    if (!ready) return;
    synth.playChord(chord, sustain, wheel);
    renderer.triggerFlash(chord);
  });
}

function handleInput(event: InputEvent): void {
  const wheel = event.wheelIndex ?? 0;
  switch (event.type) {
    case 'chord-select':
      renderer.setSelectedChord(event.chordIndex ?? 0);
      renderer.setCurrentChordName(event.chord);
      if (appState.isDualWheel) {
        playAndFlash(event.chord, true, wheel);
      }
      break;
    case 'chord-play':
      if (appState.isDualWheel) break;
      playAndFlash(event.chord, event.sustain ?? false, wheel);
      break;
    case 'chord-stop':
      synth.stopChord(wheel);
      break;
  }
}

function updateScaleLabel(): void {
  scaleLabel.textContent = appState.scaleLabel;
}

function updateDualWheelState(): void {
  renderer.setDualWheelState({
    scaleRoot: appState.scaleRoot,
    scaleType: appState.scaleType,
    diatonicChords: appState.diatonicChords,
    selectedChordDegree: appState.chordDegree,
    scaleLabel: appState.scaleLabel,
  });
}

function setActiveMode(mode: InputMode): void {
  appState.setMode(mode);
  btnJoystick.classList.toggle('active', mode === 'joystick');
  btnDualWheel.classList.toggle('active', mode === 'dualwheel');
  btnWebcam.classList.toggle('active', mode === 'webcam');
  inputRouter.setGamepadActive(mode === 'joystick');
  renderer.setInputMode(mode);

  if (appState.isDualWheel) {
    updateDualWheelState();
  } else {
    renderer.setDualWheelState(null);
  }
}

function setInstrument(mode: 'guitar' | 'piano'): void {
  appState.setInstrument(mode);
  synth.setInstrument(mode);
  btnGuitar.classList.toggle('active', mode === 'guitar');
  btnPiano.classList.toggle('active', mode === 'piano');
}

function cycleScale(direction: 1 | -1): void {
  const currentIndex = SCALE_TYPES.findIndex((s) => s.id === appState.scaleType);
  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) nextIndex = SCALE_TYPES.length - 1;
  if (nextIndex >= SCALE_TYPES.length) nextIndex = 0;
  appState.setScaleType(SCALE_TYPES[nextIndex].id);
  updateScaleLabel();
  updateDualWheelState();
}

function strumCurrentChord(): void {
  const chord = renderer.getCurrentChordName();
  if (!chord) return;
  playAndFlash(chord, false, 0);
}

function getSegmentAtPoint(px: number, py: number, cx: number, cy: number, radius: number, segmentCount: number): number {
  const dx = px - cx;
  const dy = py - cy;
  const distance = Math.hypot(dx, dy);
  if (distance < radius * 0.33 || distance > radius * 0.98) return -1;
  const angle = Math.atan2(dy, dx);
  const normalized = ((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
  return Math.min(Math.floor(normalized * segmentCount), segmentCount - 1);
}

function stopWebcam(): void {
  handTracker?.stop();
  handTracker = null;
  renderer.setHandPointers([]);
  renderer.setHoveredScaleIndex(-1);
  renderer.setHoveredChordIndex(-1);
  document.body.classList.remove('webcam-mode');
}

async function startWebcam(): Promise<void> {
  await synth.ensureReady();
  handTracker = new HandTracker(webcam, {
    onChordSelect: (_chord: string, index: number, wheel: number) => {
      if (appState.mode !== 'webcam') return;
      if (wheel === 0) {
        const root = CIRCLE_OF_FIFTHS[index];
        if (root) {
          appState.setScaleRoot(root);
          updateScaleLabel();
          updateDualWheelState();
        }
      } else {
        appState.setChordDegree(index);
        updateDualWheelState();
        const diatonicChord = appState.currentDiatonicChord;
        if (diatonicChord) {
          playAndFlash(diatonicChord.name, true, 1);
        }
      }
    },
    onStrumStart: () => {},
    onStrumEnd: (chord: string, wheel: number) => inputRouter.handleHandStrumEnd(chord, wheel),
    onHandMove: (states) => renderer.setHandPointers(states),
    onShiftChange: () => {},
    onDebug: () => {},
  });
  await handTracker.start();
  document.body.classList.add('webcam-mode');
}

function enableJoystickMode(): void {
  stopWebcam();
  setActiveMode('joystick');
}

function enableDualWheelMode(): void {
  stopWebcam();
  setActiveMode('dualwheel');
}

async function enableWebcamMode(): Promise<void> {
  stopWebcam();
  setActiveMode('webcam');
  try {
    await startWebcam();
  } catch {
    document.body.classList.remove('webcam-mode');
    setActiveMode('dualwheel');
  }
}

function handleCanvasPointerMove(event: PointerEvent): void {
  if (!appState.isDualWheel) return;

  const scaleGeom = renderer.getScaleWheelGeometry();
  const chordGeom = renderer.getChordWheelGeometry();

  if (scaleGeom) {
    const idx = getSegmentAtPoint(event.clientX, event.clientY, scaleGeom.cx, scaleGeom.cy, scaleGeom.radius, CIRCLE_OF_FIFTHS.length);
    renderer.setHoveredScaleIndex(idx);
  }

  if (chordGeom) {
    const idx = getSegmentAtPoint(event.clientX, event.clientY, chordGeom.cx, chordGeom.cy, chordGeom.radius, chordGeom.chordCount);
    renderer.setHoveredChordIndex(idx);
  }
}

function handleCanvasPointerDown(event: PointerEvent): void {
  void synth.ensureReady();

  if (appState.isDualWheel) {
    const scaleGeom = renderer.getScaleWheelGeometry();
    const chordGeom = renderer.getChordWheelGeometry();

    if (scaleGeom) {
      const idx = getSegmentAtPoint(event.clientX, event.clientY, scaleGeom.cx, scaleGeom.cy, scaleGeom.radius, CIRCLE_OF_FIFTHS.length);
      if (idx >= 0) {
        const root = CIRCLE_OF_FIFTHS[idx];
        if (root) {
          appState.setScaleRoot(root);
          updateScaleLabel();
          updateDualWheelState();
        }
      }
    }

    if (chordGeom) {
      const idx = getSegmentAtPoint(event.clientX, event.clientY, chordGeom.cx, chordGeom.cy, chordGeom.radius, chordGeom.chordCount);
      if (idx >= 0) {
        appState.setChordDegree(idx);
        updateDualWheelState();
        const diatonicChord = appState.currentDiatonicChord;
        if (diatonicChord) {
          playAndFlash(diatonicChord.name, false, 1);
        }
      }
    }

    canvas.setPointerCapture(event.pointerId);
    return;
  }

  strumStart = { x: event.clientX, y: event.clientY, fired: false };
  canvas.setPointerCapture(event.pointerId);
}

function initApp(): void {
  void synth.ensureReady();
  renderer = new CanvasRenderer(canvas, songManager);
  renderer.setInputMode('dualwheel');
  setInstrument('piano');
  updateScaleLabel();
  updateDualWheelState();
  gamepadManager = new GamepadManager({
    onChordSelect: (chord, index) => {
      if (appState.mode !== 'joystick') return;
      inputRouter.handleChordSelect(chord, index);
    },
    onStrum: (chord) => {
      if (appState.mode !== 'joystick') return;
      inputRouter.handleStrum(chord);
    },
    onStrumHoldStart: (chord) => {
      if (appState.mode !== 'joystick') return;
      inputRouter.handleStrumHoldStart(chord);
    },
    onStrumHoldEnd: (chord) => {
      if (appState.mode !== 'joystick') return;
      inputRouter.handleStrumHoldEnd(chord);
    },
    onDebug: () => {},
  });
  gamepadManager.start();
  inputRouter.connectGamepad();
  inputRouter.on(handleInput);
  setActiveMode('dualwheel');

  btnJoystick.addEventListener('click', () => enableJoystickMode());
  btnDualWheel.addEventListener('click', () => enableDualWheelMode());
  btnWebcam.addEventListener('click', async () => {
    await enableWebcamMode();
  });

  canvas.addEventListener('pointerdown', handleCanvasPointerDown);
  canvas.addEventListener('pointermove', handleCanvasPointerMove);

  canvas.addEventListener('pointermove', (event) => {
    if (!strumStart || strumStart.fired || appState.isDualWheel) return;

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
    void synth.ensureReady();
  });

  btnPiano.addEventListener('click', () => {
    setInstrument('piano');
    void synth.ensureReady();
  });

  btnScalePrev.addEventListener('click', () => cycleScale(-1));
  btnScaleNext.addEventListener('click', () => cycleScale(1));

  const overlay = document.getElementById('start-overlay');

  function dismissOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    toneStart();
    void synth.ensureReady();
  }

  overlay?.addEventListener('click', dismissOverlay, { once: true });
  overlay?.addEventListener('touchstart', dismissOverlay, { once: true });
  window.addEventListener('keydown', dismissOverlay, { once: true });

  window.addEventListener('gamepadconnected', () => {
    if (appState.mode === 'joystick') inputRouter.setGamepadActive(true);
    void synth.ensureReady();
  });
}

void initApp();
