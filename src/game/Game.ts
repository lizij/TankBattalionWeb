import {
  TileType, TankKind, PowerUpType, GameStatus,
} from './types';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS, TANK_SIZE,
  ENEMIES_PER_LEVEL, MAX_ENEMIES_ON_SCREEN, ENEMY_SPAWNS,
  PLAYER_SPAWN, EAGLE_POS, SCORE, ENEMY_SPAWN_INTERVAL,
  POWERUP_DURATION, ENEMY_COMPOSITIONS,
} from './constants';
import { getLevelMap } from './levels';
import { Tank } from './Tank';
import { PlayerTank } from './PlayerTank';
import { EnemyTank } from './EnemyTank';
import { Bullet } from './Bullet';
import { PowerUp } from './PowerUp';
import { InputManager } from './InputManager';
import { Renderer, LayoutMode } from './Renderer';
import { Leaderboard } from './Leaderboard';
import { rectsOverlap, pickRandom, randInt } from './utils';

export class Game {
  map: TileType[][] = [];
  player: PlayerTank;
  enemies: EnemyTank[] = [];
  bullets: Bullet[] = [];
  powerUps: PowerUp[] = [];

  status: GameStatus = 'menu';
  score = 0;
  level = 0;
  enemiesKilled = 0;

  private spawnTimer = 0;
  private spawnIndex = 0;
  private enemyQueue: TankKind[] = [];
  private spawnedCount = 0;
  private powerUpSpawnPositions: Set<number> = new Set();

  private freezeTimer = 0;
  private shovelTimer = 0;

  private input: InputManager;
  private renderer: Renderer;
  leaderboard: Leaderboard;

  // 游戏结束后的分数登记
  pendingScore = 0;
  playerName = '';
  nameSubmitted = false;
  lastRank = -1;

  onGameOver?: () => void;
  onLevelClear?: () => void;

  constructor(canvas: HTMLCanvasElement, layout: LayoutMode = 'desktop') {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.renderer = new Renderer(ctx, layout);
    this.input = new InputManager();
    this.player = new PlayerTank(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.leaderboard = new Leaderboard();
    this.map = getLevelMap(0); // 预加载第一关地图，避免菜单渲染时 map 为空
  }

  // 暴露 input 供触屏控件使用
  getInput(): InputManager {
    return this.input;
  }

  startGame() {
    this.score = 0;
    this.level = 0;
    this.player.lives = 3;
    this.player.fullReset(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.loadLevel(0);
    this.status = 'playing';
  }

  loadLevel(level: number) {
    this.level = level;
    this.map = getLevelMap(level);
    this.enemies = [];
    this.bullets = [];
    this.powerUps = [];
    this.enemiesKilled = 0;
    this.spawnTimer = 0;
    this.spawnIndex = 0;
    this.spawnedCount = 0;
    this.freezeTimer = 0;
    this.shovelTimer = 0;

    this.enemyQueue = this.buildEnemyQueue(level);
    this.player.reset(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
  }

  private buildEnemyQueue(level: number): TankKind[] {
    const comp = ENEMY_COMPOSITIONS[level % ENEMY_COMPOSITIONS.length];
    const queue: TankKind[] = [];
    for (let i = 0; i < comp.light; i++) queue.push(TankKind.Light);
    for (let i = 0; i < comp.armored; i++) queue.push(TankKind.Armored);
    for (let i = 0; i < comp.rapid; i++) queue.push(TankKind.Rapid);
    for (let i = 0; i < comp.heavy; i++) queue.push(TankKind.Heavy);

    // 打乱
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    // 第4、11、18个敌人（索引3、10、17）携带道具
    this.powerUpSpawnPositions = new Set([3, 10, 17].filter(i => i < queue.length));
    return queue;
  }

  update() {
    if (this.status !== 'playing') return;

    const state = this.input.getState();

    if (state.pausePressed) {
      this.status = 'paused';
      return;
    }

    this.updatePlayer(state);
    this.updateEnemies();
    this.updateBullets();
    this.updatePowerUps();
    this.updateSpawn();

    if (this.freezeTimer > 0) this.freezeTimer--;
    if (this.shovelTimer > 0) {
      this.shovelTimer--;
      if (this.shovelTimer === 0) this.restoreBaseWalls();
    }

    this.checkGameState();
  }

  private updatePlayer(state: ReturnType<InputManager['getState']>) {
    if (!this.player.alive) return;

    const dir = this.input.getDirection(state);
    if (dir) {
      const others = this.enemies.filter(e => e.alive) as Tank[];
      this.player.tryMove(dir, this.map, others);
    }

    if (state.shoot) {
      const playerBullets = this.bullets.filter(b => b.ownerIsPlayer).length;
      if (playerBullets < this.player.maxBullets) {
        const b = this.player.shoot();
        if (b) this.bullets.push(b);
      }
    }

    this.player.update();
  }

  private updateEnemies() {
    const others: Tank[] = [this.player, ...this.enemies];
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update();

      if (this.freezeTimer > 0) {
        e.frozenTimer = Math.max(e.frozenTimer, 2);
      }

      e.aiDecide(this.map, this.player, others);

      // 射击：由 shootCooldown 控制频率，加入随机性
      if (e.shootCooldown <= 0 && Math.random() < 0.03) {
        const b = e.shoot();
        if (b) this.bullets.push(b);
      }
    }
  }

  private updateBullets() {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.update();

      if (b.x < 0 || b.y < 0 || b.x > MAP_COLS * TILE_SIZE || b.y > MAP_ROWS * TILE_SIZE) {
        b.alive = false;
        continue;
      }

      if (this.bulletHitsMap(b)) {
        b.alive = false;
        continue;
      }

      if (b.ownerIsPlayer) {
        for (const e of this.enemies) {
          if (!e.alive || e.isSpawning) continue;
          if (rectsOverlap(b.rect, e.rect)) {
            const killed = e.hit();
            b.alive = false;
            if (killed) {
              this.score += SCORE[e.kind] || 0;
              this.enemiesKilled++;
              if (e.hasPowerUp) this.spawnPowerUp();
            }
            break;
          }
        }
      } else {
        if (this.player.alive && rectsOverlap(b.rect, this.player.rect)) {
          const killed = this.player.hit();
          b.alive = false;
          if (killed) this.onPlayerDeath();
        }
      }

      // 子弹对撞
      for (const other of this.bullets) {
        if (other === b || !other.alive) continue;
        if (other.ownerIsPlayer === b.ownerIsPlayer) continue;
        if (rectsOverlap(b.rect, other.rect)) {
          b.alive = false;
          other.alive = false;
          break;
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.alive);
  }

  private bulletHitsMap(b: Bullet): boolean {
    const rect = b.rect;
    const c0 = Math.floor(rect.x / TILE_SIZE);
    const c1 = Math.floor((rect.x + rect.w - 1) / TILE_SIZE);
    const r0 = Math.floor(rect.y / TILE_SIZE);
    const r1 = Math.floor((rect.y + rect.h - 1) / TILE_SIZE);

    let hit = false;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) continue;
        const t = this.map[r][c];
        if (t === TileType.Brick) {
          this.map[r][c] = TileType.Empty;
          hit = true;
        } else if (t === TileType.Steel) {
          if (b.power >= 1) this.map[r][c] = TileType.Empty;
          hit = true;
        } else if (t === TileType.Eagle) {
          this.map[r][c] = TileType.Empty;
          hit = true;
          this.eagleDestroyed();
        }
      }
    }
    return hit;
  }

  private updatePowerUps() {
    for (const p of this.powerUps) {
      if (!p.alive) continue;
      p.update();
      if (this.player.alive && rectsOverlap(p.rect, this.player.rect)) {
        this.applyPowerUp(p.type);
        p.alive = false;
      }
    }
    this.powerUps = this.powerUps.filter(p => p.alive);
  }

  private applyPowerUp(type: PowerUpType) {
    switch (type) {
      case PowerUpType.Tank:
        this.player.lives++;
        break;
      case PowerUpType.Star:
        this.player.upgrade();
        break;
      case PowerUpType.Bomb:
        for (const e of this.enemies) {
          if (e.alive && !e.isSpawning) {
            e.alive = false;
            this.score += SCORE[e.kind] || 0;
            this.enemiesKilled++;
          }
        }
        break;
      case PowerUpType.Clock:
        this.freezeTimer = Math.floor(POWERUP_DURATION.clock / (1000 / 60));
        break;
      case PowerUpType.Helmet:
        this.player.shieldTimer = Math.floor(POWERUP_DURATION.helmet / (1000 / 60));
        break;
      case PowerUpType.Shovel:
        this.fortifyBase();
        this.shovelTimer = Math.floor(POWERUP_DURATION.shovel / (1000 / 60));
        break;
    }
  }

  private fortifyBase() {
    const ec = Math.floor(EAGLE_POS.x / TILE_SIZE);
    const er = Math.floor(EAGLE_POS.y / TILE_SIZE);
    // 老鹰为 2x2 (cols ec..ec+1, rows er..er+1)
    // 周围 U 形砖墙：顶部一行、左列、右列
    const positions: [number, number][] = [
      [ec - 2, er - 1], [ec - 1, er - 1], [ec, er - 1], [ec + 1, er - 1], [ec + 2, er - 1],
      [ec - 1, er], [ec + 2, er],
      [ec - 1, er + 1], [ec + 2, er + 1],
    ];
    for (const [c, r] of positions) {
      if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
        if (this.map[r][c] === TileType.Brick || this.map[r][c] === TileType.Empty) {
          this.map[r][c] = TileType.Steel;
        }
      }
    }
  }

  private restoreBaseWalls() {
    const ec = Math.floor(EAGLE_POS.x / TILE_SIZE);
    const er = Math.floor(EAGLE_POS.y / TILE_SIZE);
    const positions: [number, number][] = [
      [ec - 2, er - 1], [ec - 1, er - 1], [ec, er - 1], [ec + 1, er - 1], [ec + 2, er - 1],
      [ec - 1, er], [ec + 2, er],
      [ec - 1, er + 1], [ec + 2, er + 1],
    ];
    for (const [c, r] of positions) {
      if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
        if (this.map[r][c] === TileType.Steel) {
          this.map[r][c] = TileType.Brick;
        }
      }
    }
  }

  private spawnPowerUp() {
    const types = Object.values(PowerUpType);
    const type = pickRandom(types);
    const x = randInt(1, MAP_COLS - 3) * TILE_SIZE;
    const y = randInt(1, MAP_ROWS - 3) * TILE_SIZE;
    this.powerUps.push(new PowerUp(x, y, type));
  }

  private updateSpawn() {
    if (this.enemyQueue.length === 0) return;
    const aliveEnemies = this.enemies.filter(e => e.alive).length;
    if (aliveEnemies >= MAX_ENEMIES_ON_SCREEN) return;

    this.spawnTimer++;
    const interval = Math.floor(ENEMY_SPAWN_INTERVAL / (1000 / 60));
    if (this.spawnTimer < interval) return;
    this.spawnTimer = 0;

    const kind = this.enemyQueue.shift()!;
    const spawn = ENEMY_SPAWNS[this.spawnIndex % ENEMY_SPAWNS.length];
    this.spawnIndex++;

    const spawnRect = { x: spawn.x, y: spawn.y, w: TANK_SIZE, h: TANK_SIZE };
    const occupied = [this.player, ...this.enemies].some(t => t.alive && rectsOverlap(spawnRect, t.rect));
    if (occupied) {
      this.enemyQueue.unshift(kind);
      return;
    }

    const hasPowerUp = this.powerUpSpawnPositions.has(this.spawnedCount);
    this.spawnedCount++;
    const enemy = new EnemyTank(spawn.x, spawn.y, kind, hasPowerUp);
    this.enemies.push(enemy);
  }

  private onPlayerDeath() {
    if (this.player.lives <= 0) {
      this.endGame();
    } else {
      setTimeout(() => {
        if (this.status !== 'gameover') {
          this.player.reset(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
        }
      }, 1000);
    }
  }

  private eagleDestroyed() {
    this.endGame();
  }

  private endGame() {
    this.status = 'gameover';
    this.pendingScore = this.score;
    this.playerName = '';
    this.nameSubmitted = false;
    this.lastRank = -1;
    this.onGameOver?.();
  }

  private checkGameState() {
    if (this.enemyQueue.length === 0 && this.enemies.every(e => !e.alive)) {
      this.status = 'levelclear';
      this.onLevelClear?.();
    }
  }

  nextLevel() {
    this.loadLevel(this.level + 1);
    this.status = 'playing';
  }

  resume() {
    if (this.status === 'paused') this.status = 'playing';
  }

  render() {
    const r = this.renderer;
    r.clear();
    r.drawMap(this.map);

    for (const p of this.powerUps) r.drawPowerUp(p);
    if (this.player.alive) r.drawTank(this.player);
    for (const e of this.enemies) r.drawTank(e);
    for (const b of this.bullets) r.drawBullet(b);

    const enemiesLeft = this.enemyQueue.length + this.enemies.filter(e => e.alive).length;
    r.drawSidebar(this.score, this.player.lives, this.level, enemiesLeft);

    if (this.status === 'menu') {
      r.drawMenu();
    } else if (this.status === 'paused') {
      r.drawOverlay('已暂停', '按 P 继续');
    } else if (this.status === 'gameover') {
      r.drawGameOver(this.pendingScore, this.playerName, this.nameSubmitted, this.lastRank);
    } else if (this.status === 'levelclear') {
      r.drawOverlay(`第 ${this.level + 1} 关通过!`, '按空格进入下一关');
    } else if (this.status === 'leaderboard') {
      r.drawLeaderboard(this.leaderboard.getEntries());
    }
  }

  // 处理菜单/结束/排行榜界面的按键
  handleMenuInput() {
    const state = this.input.getState();

    if (this.status === 'menu') {
      // 菜单：按射击键开始新游戏
      if (state.shootPressed) {
        this.startGame();
      }
    } else if (this.status === 'gameover') {
      // 游戏结束：登记分数后按射击键返回菜单
      if (this.nameSubmitted && state.shootPressed) {
        this.status = 'menu';
      }
    } else if (this.status === 'leaderboard') {
      // 排行榜：按射击键返回菜单
      if (state.shootPressed || state.pausePressed) {
        this.status = 'menu';
      }
    } else if (this.status === 'paused') {
      if (state.pausePressed || state.shootPressed) {
        this.resume();
      }
    } else if (this.status === 'levelclear') {
      if (state.shootPressed) {
        this.nextLevel();
      }
    }
  }

  // 处理画布点击（菜单按钮等）
  handleClick(canvasX: number, canvasY: number) {
    if (this.status === 'menu') {
      const btn = this.renderer.getMenuButtonAt(canvasX, canvasY);
      if (btn === 'newgame') {
        this.startGame();
      } else if (btn === 'leaderboard') {
        this.status = 'leaderboard';
      }
    } else if (this.status === 'gameover' && this.nameSubmitted) {
      // 点击返回菜单
      this.status = 'menu';
    } else if (this.status === 'leaderboard') {
      this.status = 'menu';
    }
  }

  // 输入玩家名字（来自 DOM 输入框）
  setPlayerName(name: string) {
    this.playerName = name.slice(0, this.leaderboard.getMaxNameLength());
  }

  // 提交分数到排行榜
  submitScore(): number {
    if (this.nameSubmitted) return this.lastRank;
    const rank = this.leaderboard.addScore(this.playerName, this.pendingScore);
    this.nameSubmitted = true;
    this.lastRank = rank;
    return rank;
  }

  // 查看排行榜
  showLeaderboard() {
    this.status = 'leaderboard';
  }

  // 返回主菜单
  backToMenu() {
    this.status = 'menu';
  }
}
