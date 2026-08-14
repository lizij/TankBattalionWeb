import { Direction, TileType, TankKind } from './types';
import { TILE_SIZE, TANK_SIZE, MAP_COLS, MAP_ROWS } from './constants';
import { dirVector, rectsOverlap, nextId } from './utils';
import { Bullet } from './Bullet';

// 坦克基类
export abstract class Tank {
  id: number;
  x: number;
  y: number;
  dir: Direction = 'up';
  speed: number = 1;
  kind: TankKind;
  alive = true;

  // 射击相关
  shootCooldown = 0;
  shootInterval = 30; // 帧
  maxBullets = 1;
  bulletPower = 0; // 0=普通, 1=破钢
  bulletSpeed = 5;

  // 移动相关
  moving = false;
  // 冰面打滑剩余帧
  slideFrames = 0;

  constructor(x: number, y: number, kind: TankKind) {
    this.id = nextId();
    this.x = x;
    this.y = y;
    this.kind = kind;
  }

  get w() { return TANK_SIZE; }
  get h() { return TANK_SIZE; }

  get rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // 尝试向指定方向移动，返回是否成功
  tryMove(dir: Direction, map: TileType[][], others: Tank[]): boolean {
    this.dir = dir;
    const { dx, dy } = dirVector(dir);

    // 对齐到网格（便于转弯）：在垂直于移动方向上对齐到 TILE_SIZE/2 的倍数
    if (dx !== 0) {
      // 水平移动，对齐 y
      const half = TILE_SIZE / 2;
      const alignedY = Math.round(this.y / half) * half;
      this.y = alignedY;
    } else {
      // 垂直移动，对齐 x
      const half = TILE_SIZE / 2;
      const alignedX = Math.round(this.x / half) * half;
      this.x = alignedX;
    }

    const nx = this.x + dx * this.speed;
    const ny = this.y + dy * this.speed;

    // 边界检测
    if (nx < 0 || ny < 0 || nx + this.w > MAP_COLS * TILE_SIZE || ny + this.h > MAP_ROWS * TILE_SIZE) {
      return false;
    }

    // 地形碰撞检测
    const nextRect = { x: nx, y: ny, w: this.w, h: this.h };
    if (this.collidesWithMap(nextRect, map)) {
      return false;
    }

    // 与其他坦克碰撞
    for (const o of others) {
      if (o === this || !o.alive) continue;
      if (rectsOverlap(nextRect, o.rect)) {
        return false;
      }
    }

    this.x = nx;
    this.y = ny;
    this.moving = true;
    return true;
  }

  // 检测矩形是否与不可通行地形碰撞
  collidesWithMap(rect: { x: number; y: number; w: number; h: number }, map: TileType[][]): boolean {
    const c0 = Math.floor(rect.x / TILE_SIZE);
    const c1 = Math.floor((rect.x + rect.w - 1) / TILE_SIZE);
    const r0 = Math.floor(rect.y / TILE_SIZE);
    const r1 = Math.floor((rect.y + rect.h - 1) / TILE_SIZE);

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) continue;
        const t = map[r][c];
        if (t === TileType.Brick || t === TileType.Steel || t === TileType.Water || t === TileType.Eagle) {
          return true;
        }
      }
    }
    return false;
  }

  // 射击：返回新子弹（如果可以射击），否则 null
  shoot(): Bullet | null {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = this.shootInterval;

    // 子弹从坦克炮口位置发出
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const offset = this.w / 2;
    const { dx, dy } = dirVector(this.dir);
    const bx = cx + dx * offset;
    const by = cy + dy * offset;

    return new Bullet(bx, by, this.dir, this.kind === TankKind.Player, this.bulletPower, this.bulletSpeed);
  }

  update() {
    if (this.shootCooldown > 0) this.shootCooldown--;
  }

  // 受到伤害，返回是否被摧毁
  hit(): boolean {
    return true; // 默认一击摧毁
  }
}
