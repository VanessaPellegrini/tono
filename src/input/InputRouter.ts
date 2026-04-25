import type { GamepadState } from "./GamepadManager";
import type { HandData } from "./HandTracker";
import type { NoteEvent } from "../audio/SynthEngine";

export type InputMode = "gamepad" | "hands";

export interface InputState {
  mode: InputMode;
  gamepad: GamepadState | null;
  hands: HandData[];
}

export class InputRouter {
  resolve(state: InputState): NoteEvent | null {
    console.log("InputRouter resolving", state);
    return null;
  }
}
