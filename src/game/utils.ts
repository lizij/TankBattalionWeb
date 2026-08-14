import { Rect, Direction } from './types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from './constants';

// 矩形碰撞检测
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// 方向向量
export function dirVector(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'up': return { dx: 0, dy: -1 };
    case 'down': return { dx: 0, dy: 1 };
    case 'left': return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
  }
}

// 像素坐标 -> 格子坐标
export function pixelToTile(px: number, py: number): { col: number; row: number } {
  return {
    col: Math.floor(px / TILE_SIZE),
    row: Math.floor(py / TILE_SIZE),
  };
}

// 检查矩形是否在地图边界内
export function inBounds(rect: Rect): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.w <= MAP_COLS * TILE_SIZE &&
    rect.y + rect.h <= MAP_ROWS * TILE_SIZE
  );
}

// 限制值在 [min, max] 范围内
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// 生成唯一 ID
let _idCounter = 0;
export function nextId(): number {
  return ++_idCounter;
}

// 随机整数 [min, max]
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 从数组中随机取一个元素
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
