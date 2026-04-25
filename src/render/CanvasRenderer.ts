import type { SongNote } from "../song/SongManager";

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  clear(): void {
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStrings(): void {
    const stringSpacing = this.height / 7;
    this.ctx.strokeStyle = "#e0e0e0";
    for (let i = 0; i < 6; i++) {
      const y = stringSpacing * (i + 1);
      this.ctx.lineWidth = 1 + i * 0.4;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  drawNotes(notes: SongNote[]): void {
    const stringSpacing = this.height / 7;
    this.ctx.fillStyle = "#ff6b6b";
    for (const note of notes) {
      const y = stringSpacing * (note.string + 1);
      this.ctx.beginPath();
      this.ctx.arc(this.width * 0.8, y, 14, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#fff";
      this.ctx.fillText(String(note.fret), this.width * 0.8 - 4, y + 4);
      this.ctx.fillStyle = "#ff6b6b";
    }
  }

  drawMessage(text: string): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "20px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, this.width / 2, this.height / 2);
  }
}
