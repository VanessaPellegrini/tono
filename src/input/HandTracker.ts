export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
}

export type HandEventHandler = (hands: HandData[]) => void;

export class HandTracker {
  private handlers: HandEventHandler[] = [];
  private active = false;

  async start(videoElement: HTMLVideoElement): Promise<void> {
    console.log("HandTracker starting…", videoElement);
    this.active = true;
  }

  stop(): void {
    this.active = false;
  }

  on(handler: HandEventHandler): void {
    this.handlers.push(handler);
  }

  isActive(): boolean {
    return this.active;
  }
}
