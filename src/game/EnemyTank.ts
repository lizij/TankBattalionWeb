import { Direction, TileType, TankKind } from './types';
import {
  ENEMY_SPEED_LIGHT,
  ENEMY_SPEED_ARMORED,
  ENEMY_SPEED_RAPID,
  ENEMY_SPEED_HEAVY,
  BULLET_SPEED,
  BULLET_SPEED_RAPID,
} from './constants';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { randInt, pickRandom, dirVector } from './utils';

const ENEMY_STATS: Record<string, { speed: number; hp: number; bulletSpeed: number; score: number }> = {
  light:   { speed: ENEMY_SPEED_LIGHT,   hp: 1, bulletSpeed: BULLET_SPEED,       score: 100 },
  armored: { speed: ENEMY_SPEED_ARMORED, hp: 1, bulletSpeed: BULLET_SPEED,       score: 200 },
  rapid:   { speed: ENEMY_SPEED_RAPID,   hp: 1, bulletSpeed: BULLET_SPEED_RAPID, score: 300 },
  heavy:   { speed: ENEMY_SPEED_HEAVY,   hp: 4, bulletSpeed: BULLET_SPEED,       score: 400 },
};

export class EnemyTank extends Tank {
  hp: number;
  score: number;
  // AI 状态
  aiDirTimer = 0;
  aiShootTimer = 0;
  // 是否携带道具（闪烁红坦克）
  hasPowerUp = false;
  // 被冻结剩余帧
  frozenTimer = 0;
  // 出生动画剩余帧
  spawnTimer = 60;

  constructor(x: number, y: number, kind: TankKind, hasPowerUp = false) {
    super(x, y, kind);
    const stats = ENEMY_STATS[kind] || ENEMY_STATS.light;
    this.speed = stats.speed;
    this.hp = stats.hp;
    this.bulletSpeed = stats.bulletSpeed;
    this.score = stats.score;
    this.shootInterval = 60;
    this.hasPowerUp = hasPowerUp;
    this.dir = 'down';
  }

  get isSpawning(): boolean {
    return this.spawnTimer > 0;
  }

  get isFrozen(): boolean {
    return this.frozenTimer > 0;
  }

  update(): void {
    super.update();
    if (this.spawnTimer > 0) this.spawnTimer--;
    if (this.frozenTimer > 0) this.frozenTimer--;
  }

  // AI 决策：返回移动方向和是否射击
  aiDecide(map: TileType[][], player: Tank | null, others: Tank[]): { dir: Direction | null; shoot: boolean } {
    if (this.isSpawning || this.isFrozen) {
      return { dir: null, shoot: false };
    }

    // 定时换方向
    this.aiDirTimer--;
    let dir: Direction = this.dir;

    if (this.aiDirTimer <= 0) {
      // 有一定概率朝玩家或基地方向移动
      const target = this.chooseTarget(player);
      dir = this.dirToward(target);
      // 加入随机性
      if (Math.random() < 0.3) {
        dir = pickRandom<Direction>(['up', 'down', 'left', 'right']);
      }
      this.aiDirTimer = randInt(30, 90);
    }

    // 尝试移动，如果被阻挡则换方向
    const moved = this.tryMove(dir, map, others);
    if (!moved) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right'].filter(d => d !== dir) as Direction[];
      dir = pickRandom(dirs);
      this.aiDirTimer = randInt(20, 60);
    }

    // 射击决策
    this.aiShootTimer--;
    let shoot = false;
    if (this.aiShootTimer <= 0) {
      shoot = Math.random() < 0.5;
      this.aiShootTimer = randInt(30, 90);
    }

    return { dir, shoot };
  }

  private chooseTarget(player: Tank | null): { x: number; y: number } {
    // 70% 朝玩家，30% 朝基地
    if (player && Math.random() < 0.7) {
      return { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    }
    // 基地位置（底部中央）
    return { x: 6 * 32 + 32, y: 11 * 32 + 32 };
  }

  private dirToward(target: { x: number; y: number }): Direction {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;
    // 选择差距较大的轴
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  // 重写射击：出生中或冻结时不能射击
  shoot(): Bullet | null {
    if (this.isSpawning || this.isFrozen) return null;
    return super.shoot();
  }

  // 受到伤害
  hit(): boolean {
    this.hp--;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }
}
