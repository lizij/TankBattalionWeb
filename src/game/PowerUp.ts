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
  // 存在时间（帧），约 18 秒后消失
  life = 60 * 18;

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
    this.life--;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  get visible(): boolean {
    // 最后 3 秒快速闪烁
    if (this.life < 180) {
      return Math.floor(this.blinkTimer / 5) % 2 === 0;
    }
    // 正常闪烁
    return Math.floor(this.blinkTimer / 10) % 2 === 0;
  }
}
