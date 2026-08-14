// 游戏核心类型定义

export type Direction = 'up' | 'down' | 'left' | 'right';

// 地形类型
export enum TileType {
  Empty = 0,
  Brick = 1,   // 砖墙：可被炮弹摧毁
  Steel = 2,   // 钢墙：仅满级玩家可摧毁
  Water = 3,   // 水：坦克不可通过，炮弹可飞过
  Trees = 4,   // 树林：坦克和炮弹可通过，提供视觉遮挡
  Ice = 5,     // 冰面：坦克可通过但会打滑
  Eagle = 6,   // 老鹰基地：被摧毁则游戏结束
}

// 坦克类型
export enum TankKind {
  Player = 'player',
  Light = 'light',     // 轻战车 100分
  Armored = 'armored', // 装甲车 200分（最快）
  Rapid = 'rapid',     // 速射炮战车 300分
  Heavy = 'heavy',     // 重型战车 400分（需4发）
}

// 道具类型
export enum PowerUpType {
  Tank = 'tank',     // 加一条命
  Star = 'star',     // 升级（子弹速度/数量/破钢）
  Bomb = 'bomb',     // 消灭所有敌人
  Clock = 'clock',   // 冻结敌人10秒
  Helmet = 'helmet', // 护盾10秒
  Shovel = 'shovel', // 基地砖墙变钢墙21秒
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelclear' | 'leaderboard';
