import './style.css';
import { SynthEngine } from './audio/SynthEngine';
import { GamepadManager } from './input/GamepadManager';
import { HandTracker } from './input/HandTracker';
import { InputRouter, type InputEvent } from './input/InputRouter';
import { SongManager } from './song/SongManager';
import { CanvasRenderer } from './render/CanvasRenderer';
import { throughTheValley } from './songs/throughTheValley';
import { futureDays } from './songs/futureDays';

const songs = { throughTheValley, futureDays } as const;
type SongKey = keyof typeof songs;

const synth = new SynthEngine();
const songManager = new SongManager();
const inputRouter = new InputRouter();
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const webcam = document.getElementById('webcam') as HTMLVideoElement;
const overlay = document.getElementById('overlay')!;
const ui = document.getElementById('ui')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;

let renderer: CanvasRenderer;
let gamepadManager: GamepadManager;
let handTracker: HandTracker | null = null;
let currentMode: 'free' | 'story' = 'free';
let selectedSong: SongKey = 'throughTheValley';

// UI elements
const btnFree = document.getElementById('btn-free')!;
const btnStory = document.getElementById('btn-story')!;
const songSelect = document.getElementById('song-select')!;
const btnPlaySong = document.getElementById('btn-play-song')!;
const btnStopSong = document.getElementById('btn-stop-song')!;
const btnCamera = document.getElementById('btn-camera')!;

function handleInput(event: InputEvent): void {
  switch (event.type) {
    case 'chord-select':
      renderer.setSelectedChord(event.chordIndex ?? 0);
      if (currentMode === 'free') {
        songManager.stop();
      }
      break;
    case 'chord-play':
      synth.playChord(event.chord);
      renderer.triggerFlash();
      break;
  }
}

// Start button
startBtn.addEventListener('click', async () => {
  await synth.init();
  renderer = new CanvasRenderer(canvas, synth, songManager);
  gamepadManager = new GamepadManager({
    onChordSelect: (chord, index) => inputRouter.handleChordSelect(chord, index),
    onStrum: (chord) => inputRouter.handleStrum(chord),
  });
  gamepadManager.start();
  inputRouter.connectGamepad();
  inputRouter.on(handleInput);

  // Listen for gamepad connection
  window.addEventListener('gamepadconnected', () => {
    inputRouter.setGamepadActive(true);
  });

  overlay.style.display = 'none';
  ui.style.display = 'flex';
});

// Mode toggle
btnFree.addEventListener('click', () => {
  currentMode = 'free';
  songManager.stop();
  renderer.setMode('free');
  btnFree.classList.add('active');
  btnStory.classList.remove('active');
  songSelect.style.display = 'none';
});

btnStory.addEventListener('click', () => {
  currentMode = 'story';
  renderer.setMode('story');
  btnStory.classList.add('active');
  btnFree.classList.remove('active');
  songSelect.style.display = 'flex';
});

// Song selection
songSelect.querySelectorAll('[data-song]').forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedSong = (btn as HTMLElement).dataset.song as SongKey;
    songManager.loadSong(songs[selectedSong]);
    songSelect.querySelectorAll('[data-song]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

btnPlaySong.addEventListener('click', () => {
  songManager.loadSong(songs[selectedSong]);
  songManager.setOnChordChange((chord) => {
    synth.playChord(chord);
    renderer.triggerFlash();
    renderer.setSelectedChord(
      ['Am', 'F', 'C', 'G', 'D', 'Em'].indexOf(chord),
    );
  });
  songManager.play();
});

btnStopSong.addEventListener('click', () => {
  songManager.stop();
  synth.stopChord();
});

// Camera toggle
btnCamera.addEventListener('click', async () => {
  if (handTracker) {
    handTracker.stop();
    handTracker = null;
    webcam.style.display = 'none';
    btnCamera.textContent = 'Enable Camera';
    return;
  }

  handTracker = new HandTracker(webcam, {
    onChordSelect: (chord, index) => inputRouter.handleHandChordSelect(chord, index),
    onStrum: (chord) => inputRouter.handleHandStrum(chord),
  });

  try {
    await handTracker.start();
    webcam.style.display = 'block';
    btnCamera.textContent = 'Disable Camera';
  } catch (err) {
    console.error('Camera error:', err);
    btnCamera.textContent = 'Camera unavailable';
  }
});
