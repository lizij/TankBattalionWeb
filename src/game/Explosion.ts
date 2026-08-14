// 爆炸特效
import { TANK_SIZE } from './constants';

export class Explosion {
  x: number;
  y: number;
  frame = 0;
  maxFrames = 20;
  alive = true;

  constructor(x: number, y: number) {
    // x, y 是坦克中心
    this.x = x;
    this.y = y;
  }

  update() {
    this.frame++;
    if (this.frame >= this.maxFrames) {
      this.alive = false;
    }
  }

  // 爆炸半径随帧增大
  get radius(): number {
    const progress = this.frame / this.maxFrames;
    return TANK_SIZE * 0.3 + progress * TANK_SIZE * 0.7;
  }

  get alpha(): number {
    return 1 - this.frame / this.maxFrames;
  }
}
