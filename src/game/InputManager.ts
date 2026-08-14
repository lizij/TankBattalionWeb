import { Direction } from './types';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  shootPressed: boolean;
  pausePressed: boolean;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private prevShoot = false;
  private prevPause = false;
  private gamepadIndex: number | null = null;

  // 虚拟按键状态（触屏）
  private touchState = {
    up: false, down: false, left: false, right: false, shoot: false,
  };

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (['w', 'a', 's', 'd', 'j', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  // 虚拟按键接口（供触屏控件调用）
  setTouch(dir: 'up' | 'down' | 'left' | 'right' | 'shoot', pressed: boolean) {
    this.touchState[dir] = pressed;
  }

  getState(): InputState {
    const keys = this.keys;
    const gp = this.getGamepad();

    const up = keys.has('w') || keys.has('arrowup') || (gp?.buttons[12]?.pressed ?? false) || this.touchState.up;
    const down = keys.has('s') || keys.has('arrowdown') || (gp?.buttons[13]?.pressed ?? false) || this.touchState.down;
    const left = keys.has('a') || keys.has('arrowleft') || (gp?.buttons[14]?.pressed ?? false) || this.touchState.left;
    const right = keys.has('d') || keys.has('arrowright') || (gp?.buttons[15]?.pressed ?? false) || this.touchState.right;

    const shoot = keys.has('j') || keys.has(' ') || (gp?.buttons[0]?.pressed ?? false) || (gp?.buttons[2]?.pressed ?? false) || this.touchState.shoot;

    const pause = keys.has('p') || keys.has('enter') || (gp?.buttons[9]?.pressed ?? false);

    const shootPressed = shoot && !this.prevShoot;
    const pausePressed = pause && !this.prevPause;

    this.prevShoot = shoot;
    this.prevPause = pause;

    return { up, down, left, right, shoot, shootPressed, pausePressed };
  }

  getDirection(state: InputState): Direction | null {
    if (state.up) return 'up';
    if (state.down) return 'down';
    if (state.left) return 'left';
    if (state.right) return 'right';
    return null;
  }

  private getGamepad(): Gamepad | null {
    if (this.gamepadIndex === null) {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const g of gps) {
        if (g) { this.gamepadIndex = g.index; return g; }
      }
      return null;
    }
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    return gps[this.gamepadIndex] || null;
  }
}
