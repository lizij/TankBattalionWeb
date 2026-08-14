import { Direction } from './types';
import { BULLET_SIZE, BULLET_SPEED } from './constants';
import { dirVector, nextId } from './utils';

export class Bullet {
  id: number;
  x: number;
  y: number;
  dir: Direction;
  speed: number;
  ownerIsPlayer: boolean;
  // 子弹威力：0=普通（只能打砖），1=可破钢
  power: number;
  alive = true;

  constructor(x: number, y: number, dir: Direction, ownerIsPlayer: boolean, power = 0, speed = BULLET_SPEED) {
    this.id = nextId();
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.speed = speed;
    this.ownerIsPlayer = ownerIsPlayer;
    this.power = power;
  }

  get w() { return BULLET_SIZE; }
  get h() { return BULLET_SIZE; }

  update() {
    const { dx, dy } = dirVector(this.dir);
    this.x += dx * this.speed;
    this.y += dy * this.speed;
  }

  // 子弹的矩形碰撞盒（居中于 x,y）
  get rect() {
    return {
      x: this.x - BULLET_SIZE / 2,
      y: this.y - BULLET_SIZE / 2,
      w: BULLET_SIZE,
      h: BULLET_SIZE,
    };
  }
}
