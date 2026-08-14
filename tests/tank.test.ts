import { describe, it, expect } from 'vitest';
import { PlayerTank } from '../src/game/PlayerTank';
import { EnemyTank } from '../src/game/EnemyTank';
import { TileType, TankKind, Direction } from '../src/game/types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from '../src/game/constants';

// 创建一个全空地图
function emptyMap(): TileType[][] {
  return Array.from({ length: MAP_ROWS }, () =>
    Array.from({ length: MAP_COLS }, () => TileType.Empty)
  );
}

describe('Tank movement', () => {
  it('player tank moves in the direction it faces', () => {
    const map = emptyMap();
    const tank = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const startX = tank.x;
    tank.tryMove('right', map, []);
    expect(tank.x).toBeGreaterThan(startX);
    expect(tank.dir).toBe('right');
  });

  it('tank cannot move out of bounds', () => {
    const map = emptyMap();
    const tank = new PlayerTank(0, 0);
    const moved = tank.tryMove('left', map, []);
    expect(moved).toBe(false);
    expect(tank.x).toBe(0);
  });

  it('tank cannot move through brick walls', () => {
    const map = emptyMap();
    // 在坦克右侧放砖墙
    map[2][3] = TileType.Brick;
    const tank = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const moved = tank.tryMove('right', map, []);
    expect(moved).toBe(false);
  });

  it('tank cannot move through steel walls', () => {
    const map = emptyMap();
    map[2][3] = TileType.Steel;
    const tank = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const moved = tank.tryMove('right', map, []);
    expect(moved).toBe(false);
  });

  it('tank cannot move through water', () => {
    const map = emptyMap();
    map[2][3] = TileType.Water;
    const tank = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const moved = tank.tryMove('right', map, []);
    expect(moved).toBe(false);
  });

  it('tank can move through trees', () => {
    const map = emptyMap();
    map[2][3] = TileType.Trees;
    const tank = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const moved = tank.tryMove('right', map, []);
    expect(moved).toBe(true);
  });

  it('tank can move through ice', () => {
    const map = emptyMap();
    map[2][3] = TileType.Ice;
    const tank = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const moved = tank.tryMove('right', map, []);
    expect(moved).toBe(true);
  });

  it('tanks cannot overlap each other', () => {
    const map = emptyMap();
    const t1 = new PlayerTank(TILE_SIZE * 2, TILE_SIZE * 2);
    const t2 = new EnemyTank(TILE_SIZE * 3, TILE_SIZE * 2, TankKind.Light);
    const moved = t1.tryMove('right', map, [t2]);
    expect(moved).toBe(false);
  });
});

describe('PlayerTank upgrades', () => {
  it('starts with 0 stars', () => {
    const tank = new PlayerTank(0, 0);
    expect(tank.stars).toBe(0);
    expect(tank.maxBullets).toBe(1);
    expect(tank.bulletPower).toBe(0);
  });

  it('1 star increases bullet speed', () => {
    const tank = new PlayerTank(0, 0);
    tank.upgrade();
    expect(tank.stars).toBe(1);
    expect(tank.bulletSpeed).toBeGreaterThan(5);
  });

  it('2 stars allows 2 bullets', () => {
    const tank = new PlayerTank(0, 0);
    tank.upgrade();
    tank.upgrade();
    expect(tank.stars).toBe(2);
    expect(tank.maxBullets).toBe(2);
  });

  it('3 stars allows breaking steel', () => {
    const tank = new PlayerTank(0, 0);
    tank.upgrade();
    tank.upgrade();
    tank.upgrade();
    expect(tank.stars).toBe(3);
    expect(tank.bulletPower).toBe(1);
  });

  it('cannot exceed 3 stars', () => {
    const tank = new PlayerTank(0, 0);
    for (let i = 0; i < 10; i++) tank.upgrade();
    expect(tank.stars).toBe(3);
  });
});

describe('PlayerTank shield', () => {
  it('has shield on spawn', () => {
    const tank = new PlayerTank(0, 0);
    expect(tank.hasShield).toBe(true);
  });

  it('shield prevents death', () => {
    const tank = new PlayerTank(0, 0);
    const killed = tank.hit();
    expect(killed).toBe(false);
    expect(tank.alive).toBe(true);
  });

  it('dies when shield expires', () => {
    const tank = new PlayerTank(0, 0);
    tank.shieldTimer = 0;
    const killed = tank.hit();
    expect(killed).toBe(true);
    expect(tank.alive).toBe(false);
  });
});

describe('EnemyTank', () => {
  it('heavy tank has 4 hp', () => {
    const e = new EnemyTank(0, 0, TankKind.Heavy);
    expect(e.hp).toBe(4);
  });

  it('heavy tank takes 4 hits to destroy', () => {
    const e = new EnemyTank(0, 0, TankKind.Heavy);
    e.hit();
    e.hit();
    e.hit();
    expect(e.alive).toBe(true);
    e.hit();
    expect(e.alive).toBe(false);
  });

  it('light tank dies in 1 hit', () => {
    const e = new EnemyTank(0, 0, TankKind.Light);
    e.hit();
    expect(e.alive).toBe(false);
  });

  it('cannot shoot while spawning', () => {
    const e = new EnemyTank(0, 0, TankKind.Light);
    e.shootCooldown = 0;
    const b = e.shoot();
    expect(b).toBeNull();
  });
});
