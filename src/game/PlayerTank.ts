import { Direction, TankKind } from './types';
import {
  PLAYER_SPEED,
  BULLET_SPEED,
  BULLET_SPEED_RAPID,
  MAX_STARS,
  POWERUP_DURATION,
} from './constants';
import { Tank } from './Tank';

export class PlayerTank extends Tank {
  stars = 0; // 升级等级 0-3
  lives = 3;
  shieldTimer = 0; // 护盾剩余帧（60fps）
  invincible = false; // 出生无敌

  constructor(x: number, y: number) {
    super(x, y, TankKind.Player);
    this.speed = PLAYER_SPEED;
    this.bulletSpeed = BULLET_SPEED;
    this.shootInterval = 20;
    // 出生护盾
    this.shieldTimer = Math.floor(POWERUP_DURATION.helmet / (1000 / 60));
  }

  // 升级
  upgrade(): void {
    if (this.stars < MAX_STARS) {
      this.stars++;
      this.applyUpgrade();
    }
  }

  applyUpgrade(): void {
    switch (this.stars) {
      case 1:
        this.bulletSpeed = BULLET_SPEED_RAPID;
        break;
      case 2:
        this.maxBullets = 2;
        break;
      case 3:
        this.bulletPower = 1; // 可破钢墙
        break;
    }
  }

  // 重置为初始状态（复活时）
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.dir = 'up';
    this.alive = true;
    this.shootCooldown = 0;
    this.shieldTimer = Math.floor(POWERUP_DURATION.helmet / (1000 / 60));
  }

  // 完全重置（新关卡）
  fullReset(x: number, y: number): void {
    this.stars = 0;
    this.bulletSpeed = BULLET_SPEED;
    this.maxBullets = 1;
    this.bulletPower = 0;
    this.reset(x, y);
  }

  get hasShield(): boolean {
    return this.shieldTimer > 0;
  }

  update(): void {
    super.update();
    if (this.shieldTimer > 0) this.shieldTimer--;
  }

  // 玩家被击中：有护盾则免疫，否则失去一条命
  hit(): boolean {
    if (this.hasShield) return false;
    this.lives--;
    this.alive = false;
    return true;
  }
}
