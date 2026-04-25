const CHORD_NAMES = ['Am', 'F', 'C', 'G', 'D', 'Em'];

export type HandCallbacks = {
  onChordSelect: (chord: string, index: number) => void;
  onStrum: (chord: string) => void;
};

export class HandTracker {
  private callbacks: HandCallbacks;
  private video: HTMLVideoElement;
  private currentChordIndex = 0;
  private handOpen = false;
  private active = false;

  constructor(videoElement: HTMLVideoElement, callbacks: HandCallbacks) {
    this.video = videoElement;
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    this.active = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    this.video.srcObject = stream;
    await this.video.play();

    // Load MediaPipe Hands from CDN
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
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => this.onResults(results));

    this.detectLoop(hands);
  }

  private detectLoop = (hands: any): void => {
    if (!this.active) return;
    hands.send({ image: this.video }).catch(() => {});
    setTimeout(() => this.detectLoop(hands), 100);
  };

  private onResults(results: any): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const landmarks = results.multiHandLandmarks[0];

    // Wrist = landmark 0, use X position (mirrored) to select chord
    const wristX = 1 - landmarks[0].x; // mirror
    const index = Math.min(Math.floor(wristX * CHORD_NAMES.length), CHORD_NAMES.length - 1);

    if (index !== this.currentChordIndex) {
      this.currentChordIndex = index;
      this.callbacks.onChordSelect(CHORD_NAMES[index], index);
    }

    // Thumb tip = 4, Index tip = 8
    const thumb = landmarks[4];
    const indexTip = landmarks[8];
    const dist = Math.sqrt(
      (thumb.x - indexTip.x) ** 2 + (thumb.y - indexTip.y) ** 2,
    );

    const isOpen = dist > 0.1;

    if (isOpen && !this.handOpen) {
      this.handOpen = true;
      this.callbacks.onStrum(CHORD_NAMES[this.currentChordIndex]);
    } else if (!isOpen) {
      this.handOpen = false;
    }
  }

  stop(): void {
    this.active = false;
    if (this.video.srcObject) {
      (this.video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
  }
}
