// 游戏常量

export const TILE_SIZE = 16;          // 每个格子像素大小
export const MAP_COLS = 26;           // 地图列数（画布 416 / 16 = 26）
export const MAP_ROWS = 26;           // 地图行数（画布 416 / 16 = 26）
export const PLAYFIELD_W = TILE_SIZE * MAP_COLS; // 416
export const PLAYFIELD_H = TILE_SIZE * MAP_ROWS; // 416

export const SIDEBAR_W = 160;         // 右侧信息栏宽度
export const CANVAS_W = PLAYFIELD_W + SIDEBAR_W;
export const CANVAS_H = PLAYFIELD_H;

// 坦克尺寸（占 2x2 格 = 32x32，原 64x64 的一半）
export const TANK_SIZE = TILE_SIZE * 2;

// 坦克速度（像素/帧）
export const PLAYER_SPEED = 1;
export const ENEMY_SPEED_LIGHT = 0.75;
export const ENEMY_SPEED_ARMORED = 1.25;
export const ENEMY_SPEED_RAPID = 0.75;
export const ENEMY_SPEED_HEAVY = 0.5;

// 子弹速度
export const BULLET_SPEED = 3;
export const BULLET_SPEED_RAPID = 4;

// 子弹尺寸
export const BULLET_SIZE = 4;

// 每关敌人数
export const ENEMIES_PER_LEVEL = 20;
// 同屏最大敌人数
export const MAX_ENEMIES_ON_SCREEN = 4;

// 敌人出生点（地图顶部三处，需对齐到格子）
export const ENEMY_SPAWNS = [
  { x: 0, y: 0 },
  { x: 10 * TILE_SIZE, y: 0 },   // 中间
  { x: 22 * TILE_SIZE, y: 0 },  // 右侧
];

// 玩家出生点（基地左侧）
export const PLAYER_SPAWN = {
  x: 6 * TILE_SIZE,
  y: 22 * TILE_SIZE,
};

// 老鹰基地位置（底部中央，2x2 块的左上角）
export const EAGLE_POS = {
  x: 12 * TILE_SIZE,
  y: 22 * TILE_SIZE,
};

// 分数
export const SCORE: Record<string, number> = {
  light: 100,
  armored: 200,
  rapid: 300,
  heavy: 400,
};

// 升级等级
export const MAX_STARS = 3;

// 道具持续时间（毫秒）
export const POWERUP_DURATION = {
  helmet: 10000,
  clock: 10000,
  shovel: 21000,
};

// 敌人刷新间隔（毫秒）
export const ENEMY_SPAWN_INTERVAL = 3000;

// 敌人组成类型
export type EnemyComposition = {
  light: number;
  armored: number;
  rapid: number;
  heavy: number;
};

// 每关敌人组成（按关卡循环，简化版）
export const ENEMY_COMPOSITIONS: EnemyComposition[] = [
  { light: 14, armored: 4, rapid: 0, heavy: 2 },
  { light: 12, armored: 4, rapid: 2, heavy: 2 },
  { light: 10, armored: 4, rapid: 4, heavy: 2 },
  { light: 8, armored: 6, rapid: 4, heavy: 2 },
  { light: 6, armored: 6, rapid: 4, heavy: 4 },
];
