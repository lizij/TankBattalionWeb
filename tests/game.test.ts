import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/game/Game';
import { TileType, TankKind, PowerUpType } from '../src/game/types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, PLAYER_SPAWN } from '../src/game/constants';
import { Bullet } from '../src/game/Bullet';

// Mock DOM globals for node environment
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerWidth: 1024,
  innerHeight: 768,
};
// @ts-ignore
global.window = mockWindow;
// @ts-ignore
global.document = { addEventListener: vi.fn() };
// navigator may be read-only in some node versions
try {
  // @ts-ignore
  global.navigator = { getGamepads: () => [] };
} catch {
  Object.defineProperty(global, 'navigator', {
    value: { getGamepads: () => [] },
    configurable: true,
  });
}

// Mock canvas 2D context
function createMockCanvas(): HTMLCanvasElement {
  const ctx = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;

  return {
    getContext: () => ctx,
    width: 0,
    height: 0,
  } as unknown as HTMLCanvasElement;
}

describe('Game bullet-terrain collision', () => {
  let game: Game;

  beforeEach(() => {
    const canvas = createMockCanvas();
    game = new Game(canvas);
    game.startGame();
  });

  it('player bullet destroys brick', () => {
    // 在玩家前方放砖墙
    const map = game.map;
    // 清空一片区域放砖
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        map[r][c] = TileType.Empty;
      }
    }
    // 玩家在 PLAYER_SPAWN，朝右
    game.player.x = PLAYER_SPAWN.x;
    game.player.y = PLAYER_SPAWN.y;
    game.player.dir = 'right';

    // 在玩家右侧放砖墙（子弹 y 坐标对应的行）
    const bulletRow = Math.floor((PLAYER_SPAWN.y + TILE_SIZE) / TILE_SIZE);
    const brickCol = 10;
    map[bulletRow][brickCol] = TileType.Brick;

    // 发射子弹
    const b = game.player.shoot();
    expect(b).not.toBeNull();
    game.bullets.push(b!);

    // 更新子弹直到击中或出界
    for (let i = 0; i < 100; i++) {
      game['updateBullets']();
      if (!b!.alive) break;
    }

    expect(map[bulletRow][brickCol]).toBe(TileType.Empty);
  });

  it('normal bullet cannot destroy steel', () => {
    const map = game.map;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) map[r][c] = TileType.Empty;
    }
    game.player.x = PLAYER_SPAWN.x;
    game.player.y = PLAYER_SPAWN.y;
    game.player.dir = 'right';

    const bulletRow = Math.floor((PLAYER_SPAWN.y + TILE_SIZE) / TILE_SIZE);
    map[bulletRow][10] = TileType.Steel;

    const b = game.player.shoot();
    game.bullets.push(b!);

    for (let i = 0; i < 100; i++) {
      game['updateBullets']();
      if (!b!.alive) break;
    }

    expect(map[bulletRow][10]).toBe(TileType.Steel);
  });

  it('3-star player bullet destroys steel', () => {
    const map = game.map;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) map[r][c] = TileType.Empty;
    }
    game.player.x = PLAYER_SPAWN.x;
    game.player.y = PLAYER_SPAWN.y;
    game.player.dir = 'right';
    game.player.upgrade();
    game.player.upgrade();
    game.player.upgrade();

    const bulletRow = Math.floor((PLAYER_SPAWN.y + TILE_SIZE) / TILE_SIZE);
    map[bulletRow][10] = TileType.Steel;

    const b = game.player.shoot();
    game.bullets.push(b!);

    for (let i = 0; i < 100; i++) {
      game['updateBullets']();
      if (!b!.alive) break;
    }

    expect(map[bulletRow][10]).toBe(TileType.Empty);
  });

  it('bullet hitting eagle triggers game over', () => {
    const map = game.map;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) map[r][c] = TileType.Empty;
    }
    // 放老鹰
    map[10][12] = TileType.Eagle;

    const b = new Bullet(12 * TILE_SIZE, 5 * TILE_SIZE, 'down', false);
    game.bullets.push(b);

    for (let i = 0; i < 200; i++) {
      game['updateBullets']();
      if (game.status === 'gameover') break;
    }

    expect(game.status).toBe('gameover');
  });
});

describe('Game power-ups', () => {
  let game: Game;

  beforeEach(() => {
    const canvas = createMockCanvas();
    game = new Game(canvas);
    game.startGame();
  });

  it('star power-up upgrades player', () => {
    const before = game.player.stars;
    game['applyPowerUp'](PowerUpType.Star);
    expect(game.player.stars).toBe(before + 1);
  });

  it('tank power-up adds a life', () => {
    const before = game.player.lives;
    game['applyPowerUp'](PowerUpType.Tank);
    expect(game.player.lives).toBe(before + 1);
  });

  it('bomb power-up kills all enemies', () => {
    // 添加一些敌人
    game.enemies.push({ alive: true, isSpawning: false, kind: TankKind.Light, hit() { this.alive = false; return true; } } as any);
    game.enemies.push({ alive: true, isSpawning: false, kind: TankKind.Armored, hit() { this.alive = false; return true; } } as any);

    game['applyPowerUp'](PowerUpType.Bomb);

    expect(game.enemies.every(e => !e.alive)).toBe(true);
  });

  it('shovel power-up fortifies base with steel', () => {
    const map = game.map;
    // 确保基地周围有砖墙
    const ec = Math.floor(PLAYER_SPAWN.x / TILE_SIZE) + 6; // 老鹰列
    const er = Math.floor(PLAYER_SPAWN.y / TILE_SIZE); // 老鹰行
    map[er - 1][ec] = TileType.Brick;

    game['applyPowerUp'](PowerUpType.Shovel);

    expect(map[er - 1][ec]).toBe(TileType.Steel);
  });
});

describe('Game spawning', () => {
  let game: Game;

  beforeEach(() => {
    const canvas = createMockCanvas();
    game = new Game(canvas);
    game.startGame();
  });

  it('enemy queue has 20 enemies', () => {
    expect(game['enemyQueue'].length).toBe(20);
  });

  it('spawns enemies up to max on screen', () => {
    // 快进 spawn timer
    for (let i = 0; i < 1000; i++) {
      game['updateSpawn']();
    }
    const alive = game.enemies.filter(e => e.alive).length;
    expect(alive).toBeLessThanOrEqual(4);
  });
});
