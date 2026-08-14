import { PowerUpType } from './types';
import { TILE_SIZE } from './constants';
import { nextId } from './utils';

export class PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  alive = true;
  // 闪烁动画
  blinkTimer = 0;

  constructor(x: number, y: number, type: PowerUpType) {
    this.id = nextId();
    this.x = x;
    this.y = y;
    this.type = type;
  }

  get w() { return TILE_SIZE * 2; }
  get h() { return TILE_SIZE * 2; }

  get rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update() {
    this.blinkTimer++;
  }

  get visible(): boolean {
    // 闪烁效果
    return Math.floor(this.blinkTimer / 10) % 2 === 0;
  }
}
