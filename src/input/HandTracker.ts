import { ROOT_NAMES, formatRootWithAccidental } from '../data/chords';

type HandState = 'idle' | 'selecting' | 'sustaining';
type TrackingSource = 'index' | 'fingers' | 'palm';

type TrackedHand = {
  rawX: number;
  rawY: number;
  smoothX: number;
  smoothY: number;
  confidence: number;
  visible: boolean;
  state: HandState;
  source: TrackingSource;
  currentZone: number | null;
  confirmedChord: string | null;
  confirmedIndex: number | null;
  pendingZone: number | null;
  lostFrames: number;
  fistDetected: boolean;
  fistFrames: number;
  accidental: -1 | 0 | 1;
};

export type HandDebugInfo = {
  wheel: number;
  rawX: number;
  rawY: number;
  smoothX: number;
  smoothY: number;
  zone: number | null;
  chord: string | null;
  state: HandState;
  confidence: number;
  source: TrackingSource;
  fist: boolean;
};

export type HandPointerState = {
  x: number;
  y: number;
  visible: boolean;
  wheel: number;
  source: TrackingSource;
};

export type HandCallbacks = {
  onChordSelect: (chord: string, index: number, wheelIndex: number) => void;
  onStrumStart: (chord: string, wheelIndex: number) => void;
  onStrumEnd: (chord: string, wheelIndex: number) => void;
  onHandMove: (states: HandPointerState[]) => void;
  onDebug?: (hands: HandDebugInfo[]) => void;
};

const SMOOTHING_ALPHA_INDEX = 0.2;
const SMOOTHING_ALPHA_FINGERS = 0.35;

const CONFIDENCE_THRESHOLD = 0.6;
const MAX_LOST_FRAMES = 4;
const INNER_RADIUS = 0.15;
const OUTER_RADIUS = 0.34;

const WHEEL_CENTERS = [
  { x: 0.266, y: 0.5 },
  { x: 0.734, y: 0.5 },
];

const INDEX_TIP = 8;
const INDEX_MCP = 5;
const FINGERTIP_INDICES = [8, 12, 16, 20];
const TIP_INDICES = [4, 8, 12, 16, 20];
const MCP_INDICES = [2, 5, 9, 13, 17];
const BLEND_LOW = 0.5;
const BLEND_HIGH = 0.7;
const FIST_THRESHOLD = 0.09;
const FIST_CONFIRM_FRAMES = 3;

function landmarkPos(landmarks: Array<{ x: number; y: number }>, indices: number[]): { x: number; y: number } {
  let sumX = 0;
  let sumY = 0;
  for (const i of indices) {
    sumX += landmarks[i].x;
    sumY += landmarks[i].y;
  }
  return { x: 1 - sumX / indices.length, y: sumY / indices.length };
}

function isOccluded(landmarks: Array<{ z?: number }>): boolean {
  const tipZ = landmarks[INDEX_TIP].z ?? 0;
  const mcpZ = landmarks[INDEX_MCP].z ?? 0;
  return tipZ > mcpZ + 0.02;
}

function isFist(landmarks: Array<{ x: number; y: number }>): boolean {
  let totalDist = 0;
  for (let i = 0; i < TIP_INDICES.length; i++) {
    const tip = landmarks[TIP_INDICES[i]];
    const mcp = landmarks[MCP_INDICES[i]];
    totalDist += Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
  }
  return (totalDist / TIP_INDICES.length) < FIST_THRESHOLD;
}

function resolveTrackingPoint(landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>): { pos: { x: number; y: number }; source: TrackingSource } {
  const indexTip = landmarks[INDEX_TIP];
  const vis = indexTip.visibility ?? 0;
  const occluded = isOccluded(landmarks);

  const indexPos = { x: 1 - indexTip.x, y: indexTip.y };
  const fingersPos = landmarkPos(landmarks, FINGERTIP_INDICES);

  if (vis >= BLEND_HIGH && !occluded) {
    return { pos: indexPos, source: 'index' };
  }

  if (vis <= BLEND_LOW || occluded) {
    return { pos: fingersPos, source: 'fingers' };
  }

  const t = (vis - BLEND_LOW) / (BLEND_HIGH - BLEND_LOW);
  return {
    pos: {
      x: fingersPos.x + t * (indexPos.x - fingersPos.x),
      y: fingersPos.y + t * (indexPos.y - fingersPos.y),
    },
    source: 'index',
  };
}

export class HandTracker {
  private callbacks: HandCallbacks;
  private video: HTMLVideoElement;
  private hands: [TrackedHand, TrackedHand];
  private active = false;

  constructor(videoElement: HTMLVideoElement, callbacks: HandCallbacks) {
    this.video = videoElement;
    this.callbacks = callbacks;
    this.hands = [
      this.createHand(),
      this.createHand(),
    ];
  }

  private createHand(): TrackedHand {
    return {
      rawX: 0, rawY: 0,
      smoothX: 0, smoothY: 0,
      confidence: 0, visible: false,
      state: 'idle', source: 'palm',
      currentZone: null,
      confirmedChord: null,
      confirmedIndex: null,
      pendingZone: null,
      lostFrames: 0,
      fistDetected: false,
      fistFrames: 0,
      accidental: 0,
    };
  }

  async start(): Promise<void> {
    this.active = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    this.video.srcObject = stream;
    await this.video.play();

    await this.loadMediaPipe();
  }

  private async loadMediaPipe(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Hands) {
        this.initHands();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        this.initHands();
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private initHands(): void {
    const Hands = (window as any).Hands;
    if (!Hands) return;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: CONFIDENCE_THRESHOLD,
      minTrackingConfidence: CONFIDENCE_THRESHOLD,
    });

    hands.onResults((results: any) => this.onResults(results));

    this.detectLoop(hands);
  }

  private detectLoop = (hands: any): void => {
    if (!this.active) return;
    hands.send({ image: this.video }).catch(() => {});
    setTimeout(() => this.detectLoop(hands), 80);
  };

  private onResults(results: any): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      for (let i = 0; i < 2; i++) {
        const hand = this.hands[i];
        if (hand.visible) {
          hand.lostFrames++;
          if (hand.lostFrames > MAX_LOST_FRAMES) {
            this.deactivateHand(i);
          }
        }
      }
      this.emitVisuals();
      this.emitDebug();
      return;
    }

    const handScores = results.multiHandedness as Array<{ score: number; label: string }> | undefined;
    const detected = results.multiHandLandmarks
      .map((landmarks: any, idx: number) => {
        const { pos, source } = resolveTrackingPoint(landmarks);
        const score = handScores?.[idx]?.score ?? 0.5;
        return { ...pos, score, source, landmarks };
      })
      .sort((a: any, b: any) => a.x - b.x);

    const assigned = [false, false];

    for (let d = 0; d < detected.length; d++) {
      const det = detected[d];
      if (det.score < CONFIDENCE_THRESHOLD) continue;

      const preferredWheel = det.x < 0.5 ? 0 : 1;
      let wheelIndex = assigned[preferredWheel] ? 1 - preferredWheel : preferredWheel;
      if (assigned[wheelIndex]) continue;

      assigned[wheelIndex] = true;

      const hand = this.hands[wheelIndex];
      hand.rawX = det.x;
      hand.rawY = det.y;
      hand.source = det.source;

      if (!hand.visible) {
        hand.smoothX = det.x;
        hand.smoothY = det.y;
        hand.visible = true;
      } else {
        const alpha = det.source === 'index' ? SMOOTHING_ALPHA_INDEX : SMOOTHING_ALPHA_FINGERS;
        hand.smoothX = hand.smoothX + alpha * (det.x - hand.smoothX);
        hand.smoothY = hand.smoothY + alpha * (det.y - hand.smoothY);
      }

      hand.confidence = det.score;
      hand.lostFrames = 0;

      this.syncRightHandAccidental(wheelIndex, det.landmarks);
      this.processHandState(wheelIndex);
    }

    for (let i = 0; i < 2; i++) {
      if (!assigned[i]) {
        const hand = this.hands[i];
        if (hand.visible) {
          hand.lostFrames++;
          if (hand.lostFrames > MAX_LOST_FRAMES) {
            this.deactivateHand(i);
          }
        }
      }
    }

    this.emitVisuals();
    this.emitDebug();
  }

  private syncRightHandAccidental(wheelIndex: number, landmarks: Array<{ x: number; y: number }>): void {
    if (wheelIndex !== 1) return;

    const hand = this.hands[wheelIndex];
    const closed = isFist(landmarks);
    hand.fistFrames = Math.max(0, Math.min(FIST_CONFIRM_FRAMES, hand.fistFrames + (closed ? 1 : -1)));

    const nextFistDetected = hand.fistFrames >= FIST_CONFIRM_FRAMES;
    const nextAccidental: -1 | 1 = nextFistDetected ? -1 : 1;
    const accidentalChanged = hand.accidental !== nextAccidental;

    hand.fistDetected = nextFistDetected;
    hand.accidental = nextAccidental;

    if (accidentalChanged) {
      this.refreshCurrentWheelChord(wheelIndex);
    }
  }

  private refreshCurrentWheelChord(wheelIndex: number): void {
    const hand = this.hands[wheelIndex];
    if (hand.state !== 'sustaining' || hand.currentZone === null) return;

    const nextChord = this.resolveChordForZone(wheelIndex, hand.currentZone, hand);
    if (nextChord === hand.confirmedChord) return;

    const previousChord = hand.confirmedChord;
    if (previousChord) {
      this.callbacks.onStrumEnd(previousChord, wheelIndex);
    }
    hand.confirmedChord = nextChord;
    this.callbacks.onChordSelect(nextChord, hand.currentZone, wheelIndex);
    this.callbacks.onStrumStart(nextChord, wheelIndex);
  }

  private resolveChordForZone(wheelIndex: number, zone: number, hand: TrackedHand): string {
    const root = ROOT_NAMES[zone];
    if (wheelIndex === 1) {
      return formatRootWithAccidental(root, hand.accidental);
    }
    return root;
  }

  private processHandState(wheelIndex: number): void {
    const hand = this.hands[wheelIndex];
    const center = WHEEL_CENTERS[wheelIndex];
    const dx = hand.smoothX - center.x;
    const dy = hand.smoothY - center.y;
    const distance = Math.hypot(dx, dy);
    const insideRing = distance >= INNER_RADIUS && distance <= OUTER_RADIUS;

    const angle = Math.atan2(dy, dx);
    const normalized = ((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    const currentZone = Math.min(Math.floor(normalized * ROOT_NAMES.length), ROOT_NAMES.length - 1);

    if (hand.state === 'idle') {
      if (insideRing) {
        const chord = this.resolveChordForZone(wheelIndex, currentZone, hand);
        hand.state = 'sustaining';
        hand.currentZone = currentZone;
        hand.confirmedChord = chord;
        hand.confirmedIndex = currentZone;
        this.callbacks.onChordSelect(chord, currentZone, wheelIndex);
        this.callbacks.onStrumStart(chord, wheelIndex);
      }
      return;
    }

    if (hand.state === 'sustaining') {
      if (!insideRing) {
        hand.state = 'idle';
        const chord = hand.confirmedChord;
        if (chord) {
          this.callbacks.onStrumEnd(chord, wheelIndex);
        }
        hand.confirmedChord = null;
        hand.confirmedIndex = null;
        hand.currentZone = null;
        return;
      }

      if (currentZone !== hand.currentZone) {
        const prevChord = hand.confirmedChord;
        const newChord = this.resolveChordForZone(wheelIndex, currentZone, hand);

        if (prevChord && prevChord !== newChord) {
          this.callbacks.onStrumEnd(prevChord, wheelIndex);
        }

        hand.currentZone = currentZone;
        hand.confirmedChord = newChord;
        hand.confirmedIndex = currentZone;

        if (prevChord !== newChord) {
          this.callbacks.onChordSelect(newChord, currentZone, wheelIndex);
          this.callbacks.onStrumStart(newChord, wheelIndex);
        }
      }
    }
  }

  private deactivateHand(wheelIndex: number): void {
    const hand = this.hands[wheelIndex];
    if (hand.confirmedChord) {
      this.callbacks.onStrumEnd(hand.confirmedChord, wheelIndex);
    }
    Object.assign(hand, this.createHand());
  }

  private emitVisuals(): void {
    const states: HandPointerState[] = this.hands.map((hand, wheel) => ({
      x: hand.smoothX,
      y: hand.smoothY,
      visible: hand.visible,
      wheel,
      source: hand.source,
    }));
    this.callbacks.onHandMove(states);
  }

  private emitDebug(): void {
    if (!this.callbacks.onDebug) return;
    const infos: HandDebugInfo[] = this.hands.map((hand, wheel) => ({
      wheel,
      rawX: hand.rawX,
      rawY: hand.rawY,
      smoothX: hand.smoothX,
      smoothY: hand.smoothY,
      zone: hand.currentZone,
      chord: hand.confirmedChord,
      state: hand.state,
      confidence: hand.confidence,
      source: hand.source,
      fist: hand.fistDetected,
    }));
    this.callbacks.onDebug(infos);
  }

  stop(): void {
    this.active = false;
    this.deactivateHand(0);
    this.deactivateHand(1);
    this.callbacks.onHandMove([]);
    if (this.video.srcObject) {
      (this.video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
  }
}
