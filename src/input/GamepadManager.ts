export interface GamepadState {
  index: number;
  buttons: boolean[];
  axes: number[];
  connected: boolean;
}

export type GamepadEventHandler = (state: GamepadState) => void;

export class GamepadManager {
  private handlers: GamepadEventHandler[] = [];

  constructor() {
    window.addEventListener("gamepadconnected", (e) => this.onConnect(e));
    window.addEventListener("gamepaddisconnected", (e) => this.onDisconnect(e));
  }

  on(handler: GamepadEventHandler): void {
    this.handlers.push(handler);
  }

  poll(): GamepadState | null {
    const gamepads = navigator.getGamepads();
    const gp = gamepads.find((g): g is Gamepad => g !== null);
    if (!gp) return null;
    return {
      index: gp.index,
      buttons: gp.buttons.map((b) => b.pressed),
      axes: [...gp.axes],
      connected: gp.connected,
    };
  }

  private onConnect(e: GamepadEvent): void {
    console.log(`Gamepad connected: ${e.gamepad.id}`);
  }

  private onDisconnect(e: GamepadEvent): void {
    console.log(`Gamepad disconnected: ${e.gamepad.id}`);
  }
}
