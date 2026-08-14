import { TileType, Direction, TankKind, PowerUpType } from './types';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS, PLAYFIELD_W, PLAYFIELD_H,
  SIDEBAR_W, TANK_SIZE, BULLET_SIZE,
} from './constants';
import { Tank } from './Tank';
import { PlayerTank } from './PlayerTank';
import { EnemyTank } from './EnemyTank';
import { Bullet } from './Bullet';
import { PowerUp } from './PowerUp';
import { Explosion } from './Explosion';

export type LayoutMode = 'desktop' | 'mobile';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  layout: LayoutMode;
  // 画布总尺寸
  canvasW: number;
  canvasH: number;
  // 侧边栏在移动端的高度
  sidebarH = 56;

  constructor(ctx: CanvasRenderingContext2D, layout: LayoutMode = 'desktop') {
    this.ctx = ctx;
    this.layout = layout;
    if (layout === 'mobile') {
      this.canvasW = PLAYFIELD_W;
      this.canvasH = PLAYFIELD_H + this.sidebarH;
    } else {
      this.canvasW = PLAYFIELD_W + SIDEBAR_W;
      this.canvasH = PLAYFIELD_H;
    }
  }

  // 战场在画布中的偏移
  private get playfieldOffset() {
    if (this.layout === 'mobile') {
      return { x: 0, y: this.sidebarH };
    }
    return { x: 0, y: 0 };
  }

  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
  }

  drawMap(map: TileType[][]) {
    const { x: ox, y: oy } = this.playfieldOffset;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(ox, oy);
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        this.drawTile(map[r][c], c * TILE_SIZE, r * TILE_SIZE);
      }
    }
    ctx.restore();
  }

  drawTile(t: TileType, x: number, y: number) {
    const ctx = this.ctx;
    const s = TILE_SIZE;
    switch (t) {
      case TileType.Brick: this.drawBrick(x, y, s); break;
      case TileType.Steel: this.drawSteel(x, y, s); break;
      case TileType.Water: this.drawWater(x, y, s); break;
      case TileType.Trees: this.drawTrees(x, y, s); break;
      case TileType.Ice: this.drawIce(x, y, s); break;
      case TileType.Eagle: this.drawEagle(x, y, s); break;
    }
  }

  drawBrick(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#b5651d';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#8b4513';
    const half = s / 2;
    const quarter = s / 4;
    ctx.fillRect(x, y + half - 1, s, 2);
    ctx.fillRect(x, y + s - 1, s, 1);
    ctx.fillRect(x + quarter, y, 2, half);
    ctx.fillRect(x + quarter * 3, y, 2, half);
    ctx.fillRect(x, y + half, 2, half);
    ctx.fillRect(x + half, y + half, 2, half);
    ctx.fillRect(x + s - 2, y + half, 2, half);
  }

  drawSteel(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x + 4, y + 4, s - 8, s - 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 4, y + 4, 3, 3);
  }

  drawWater(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e5fbf';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#4a90d9';
    const t = Math.floor(Date.now() / 300) % 2;
    if (t === 0) {
      ctx.fillRect(x + 2, y + 6, s - 4, 2);
      ctx.fillRect(x + 4, y + 16, s - 8, 2);
      ctx.fillRect(x + 2, y + 26, s - 4, 2);
    } else {
      ctx.fillRect(x + 6, y + 10, s - 12, 2);
      ctx.fillRect(x + 2, y + 20, s - 4, 2);
    }
  }

  drawTrees(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#228b22';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#006400';
    const dots = [
      [4, 4], [12, 6], [20, 4], [28, 8],
      [6, 14], [16, 12], [24, 16], [28, 22],
      [4, 22], [12, 26], [20, 24], [26, 28],
    ];
    for (const [dx, dy] of dots) {
      ctx.fillRect(x + dx, y + dy, 6, 6);
    }
  }

  drawIce(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#e0f0ff';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#b0d8f0';
    ctx.fillRect(x + 2, y + 2, s - 4, 2);
    ctx.fillRect(x + 2, y + s - 4, s - 4, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 6, y + 8, 4, 2);
    ctx.fillRect(x + 18, y + 18, 6, 2);
  }

  drawEagle(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + s * 0.3, y + s * 0.2, s * 0.4, s * 0.15);
    ctx.fillRect(x + s * 0.2, y + s * 0.35, s * 0.6, s * 0.3);
    ctx.fillRect(x + s * 0.1, y + s * 0.4, s * 0.15, s * 0.2);
    ctx.fillRect(x + s * 0.75, y + s * 0.4, s * 0.15, s * 0.2);
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(x + s * 0.4, y + s * 0.65, s * 0.2, s * 0.15);
  }

  drawTank(tank: Tank) {
    if (!tank.alive) return;
    const { x: ox, y: oy } = this.playfieldOffset;
    const ctx = this.ctx;
    const x = tank.x + ox;
    const y = tank.y + oy;
    const size = TANK_SIZE;

    if (tank instanceof EnemyTank && tank.isSpawning) {
      this.drawSpawnEffect(x, y, size);
      return;
    }

    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(this.dirToAngle(tank.dir));

    let bodyColor = '#d4a017';
    let trackColor = '#8b6914';
    if (tank instanceof EnemyTank) {
      const colors: Record<string, [string, string]> = {
        light: ['#d3d3d3', '#808080'],
        armored: ['#ff8c00', '#b85c00'],
        rapid: ['#90ee90', '#2e8b57'],
        heavy: ['#ff6347', '#a52a2a'],
      };
      const [bc, tc] = colors[tank.kind] || colors.light;
      bodyColor = bc;
      trackColor = tc;

      if (tank.hasPowerUp && Math.floor(Date.now() / 150) % 2 === 0) {
        bodyColor = '#ff0000';
        trackColor = '#8b0000';
      }

      if (tank.kind === 'heavy') {
        const hpColors = ['#ff6347', '#ffd700', '#9acd32', '#ffffff'];
        const idx = Math.min(tank.hp - 1, hpColors.length - 1);
        bodyColor = hpColors[Math.max(0, idx)];
      }
    }

    ctx.fillStyle = trackColor;
    ctx.fillRect(-size / 2, -size / 2, size * 0.2, size);
    ctx.fillRect(size / 2 - size * 0.2, -size / 2, size * 0.2, size);
    ctx.fillStyle = '#000';
    for (let i = 0; i < 6; i++) {
      const ty = -size / 2 + i * (size / 6) + 2;
      ctx.fillRect(-size / 2 + 2, ty, size * 0.2 - 4, 2);
      ctx.fillRect(size / 2 - size * 0.2 + 2, ty, size * 0.2 - 4, 2);
    }

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-size * 0.3, -size * 0.35, size * 0.6, size * 0.7);

    ctx.fillStyle = trackColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-size * 0.06, -size / 2, size * 0.12, size * 0.35);

    ctx.restore();

    if (tank instanceof PlayerTank && tank.hasShield) {
      this.drawShield(x, y, size);
    }
  }

  drawSpawnEffect(x: number, y: number, size: number) {
    const ctx = this.ctx;
    const t = Math.floor(Date.now() / 80) % 4;
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    const r = size * 0.4;
    for (let i = 0; i < 4; i++) {
      const a = (t + i) * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawShield(x: number, y: number, size: number) {
    const ctx = this.ctx;
    const t = Math.floor(Date.now() / 100) % 2;
    ctx.strokeStyle = t === 0 ? '#00bfff' : '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }

  dirToAngle(dir: Direction): number {
    switch (dir) {
      case 'up': return 0;
      case 'right': return Math.PI / 2;
      case 'down': return Math.PI;
      case 'left': return -Math.PI / 2;
    }
  }

  drawBullet(b: Bullet) {
    const { x: ox, y: oy } = this.playfieldOffset;
    const ctx = this.ctx;
    const half = BULLET_SIZE / 2;
    ctx.fillStyle = b.ownerIsPlayer ? '#fff' : '#ffd700';
    ctx.fillRect(b.x + ox - half, b.y + oy - half, BULLET_SIZE, BULLET_SIZE);
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(b.x + ox - 1, b.y + oy - 1, 2, 2);
  }

  drawExplosion(e: Explosion) {
    const { x: ox, y: oy } = this.playfieldOffset;
    const ctx = this.ctx;
    const cx = e.x + ox;
    const cy = e.y + oy;
    const r = e.radius;
    ctx.save();
    ctx.globalAlpha = e.alpha;
    // 外层火焰
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // 中层
    ctx.fillStyle = '#ffa500';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // 核心
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPowerUp(p: PowerUp) {
    if (!p.visible) return;
    const { x: ox, y: oy } = this.playfieldOffset;
    const ctx = this.ctx;
    const x = p.x + ox;
    const y = p.y + oy;
    const s = p.w;
    ctx.fillStyle = Math.floor(Date.now() / 100) % 2 === 0 ? '#fff' : '#ff0000';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons: Record<PowerUpType, string> = {
      [PowerUpType.Tank]: '♥',
      [PowerUpType.Star]: '★',
      [PowerUpType.Bomb]: '✸',
      [PowerUpType.Clock]: '◷',
      [PowerUpType.Helmet]: '⛑',
      [PowerUpType.Shovel]: '⚒',
    };
    ctx.fillText(icons[p.type] || '?', x + s / 2, y + s / 2);
  }

  drawSidebar(score: number, lives: number, level: number, enemiesLeft: number, muted: boolean = false) {
    const ctx = this.ctx;
    if (this.layout === 'mobile') {
      this.drawMobileSidebar(score, lives, level, enemiesLeft, muted);
    } else {
      this.drawDesktopSidebar(score, lives, level, enemiesLeft, muted);
    }
  }

  private drawDesktopSidebar(score: number, lives: number, level: number, enemiesLeft: number, muted: boolean) {
    const ctx = this.ctx;
    const x0 = PLAYFIELD_W;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x0, 0, SIDEBAR_W, this.canvasH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('坦克大战', x0 + 12, 12);
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('BATTLE CITY', x0 + 12, 32);

    // 静音状态
    ctx.fillStyle = muted ? '#ff4444' : '#4caf50';
    ctx.font = '12px monospace';
    ctx.fillText(muted ? '🔇 已静音 (M)' : '🔊 声音开 (M)', x0 + 12, 50);

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`分数: ${score}`, x0 + 12, 72);
    ctx.fillText(`生命: ${lives}`, x0 + 12, 96);
    ctx.fillText(`关卡: ${level + 1}`, x0 + 12, 120);

    ctx.fillText(`剩余敌人:`, x0 + 12, 144);
    const cols = 5;
    for (let i = 0; i < enemiesLeft; i++) {
      const cx = x0 + 12 + (i % cols) * 16;
      const cy = 164 + Math.floor(i / cols) * 16;
      ctx.fillStyle = '#888';
      ctx.fillRect(cx, cy, 12, 12);
    }

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    const helpY = this.canvasH - 130;
    ctx.fillText('操作:', x0 + 12, helpY);
    ctx.fillText('WASD 移动', x0 + 12, helpY + 18);
    ctx.fillText('J 射击', x0 + 12, helpY + 34);
    ctx.fillText('P 暂停', x0 + 12, helpY + 50);
    ctx.fillText('M 静音', x0 + 12, helpY + 66);
    ctx.fillText('手柄: 十字键+A/X', x0 + 12, helpY + 82);
  }

  private drawMobileSidebar(score: number, lives: number, level: number, enemiesLeft: number, muted: boolean) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvasW, this.sidebarH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${muted ? '🔇' : '🔊'} ${score}`, 10, this.sidebarH / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`♥${lives}`, this.canvasW / 2, this.sidebarH / 2);
    ctx.textAlign = 'right';
    ctx.fillText(`第${level + 1}关 敌${enemiesLeft}`, this.canvasW - 10, this.sidebarH / 2);
  }

  drawOverlay(text: string, subtext?: string) {
    const ctx = this.ctx;
    const { x: ox, y: oy } = this.playfieldOffset;
    const pw = PLAYFIELD_W;
    const ph = PLAYFIELD_H;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(ox, oy, pw, ph);
    const titleSize = Math.min(32, ph * 0.15);
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, ox + pw / 2, oy + ph / 2 - titleSize * 0.3);
    if (subtext) {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(10, titleSize * 0.45)}px monospace`;
      ctx.fillText(subtext, ox + pw / 2, oy + ph / 2 + titleSize * 0.8);
    }
  }

  // 菜单按钮区域定义
  getMenuButtonAt(x: number, y: number): 'newgame' | 'leaderboard' | null {
    const { x: ox, y: oy } = this.playfieldOffset;
    const pw = PLAYFIELD_W;
    const ph = PLAYFIELD_H;
    const cx = ox + pw / 2;
    const cy = oy + ph / 2;
    const btnW = Math.min(200, pw * 0.6);
    const btnH = Math.min(50, ph * 0.18);
    const gap = 12;
    const newGameRect = { x: cx - btnW / 2, y: cy - btnH - gap / 2, w: btnW, h: btnH };
    const lbRect = { x: cx - btnW / 2, y: cy + gap / 2, w: btnW, h: btnH };
    if (x >= newGameRect.x && x <= newGameRect.x + newGameRect.w &&
        y >= newGameRect.y && y <= newGameRect.y + newGameRect.h) {
      return 'newgame';
    }
    if (x >= lbRect.x && x <= lbRect.x + lbRect.w &&
        y >= lbRect.y && y <= lbRect.y + lbRect.h) {
      return 'leaderboard';
    }
    return null;
  }

  drawMenu() {
    const ctx = this.ctx;
    const { x: ox, y: oy } = this.playfieldOffset;
    const pw = PLAYFIELD_W;
    const ph = PLAYFIELD_H;
    const cx = ox + pw / 2;
    const cy = oy + ph / 2;

    // 只覆盖游戏区域，侧边栏保持可见
    ctx.fillStyle = '#000';
    ctx.fillRect(ox, oy, pw, ph);

    // 标题
    const titleSize = Math.min(36, ph * 0.18);
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('坦克大战', cx, oy + ph * 0.22);
    ctx.fillStyle = '#888';
    ctx.font = `${Math.max(10, titleSize * 0.35)}px monospace`;
    ctx.fillText('BATTLE CITY', cx, oy + ph * 0.22 + titleSize * 0.7);

    // 按钮
    const btnW = Math.min(200, pw * 0.6);
    const btnH = Math.min(50, ph * 0.18);
    const gap = 12;

    this.drawButton(cx - btnW / 2, cy - btnH - gap / 2, btnW, btnH, '新游戏', '#4caf50');
    this.drawButton(cx - btnW / 2, cy + gap / 2, btnW, btnH, '排行榜', '#2196f3');

    // 操作提示（分两行，避免截断）
    ctx.fillStyle = '#666';
    const helpFontSize = Math.max(9, ph * 0.045);
    ctx.font = `${helpFontSize}px monospace`;
    ctx.fillText('WASD移动  J/空格射击', cx, oy + ph - helpFontSize * 2);
    ctx.fillText('P暂停  M静音', cx, oy + ph - helpFontSize * 0.6);
  }

  private drawButton(x: number, y: number, w: number, h: number, text: string, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  drawGameOver(score: number, playerName: string, nameSubmitted: boolean, rank: number) {
    const ctx = this.ctx;
    const { x: ox, y: oy } = this.playfieldOffset;
    const pw = PLAYFIELD_W;
    const ph = PLAYFIELD_H;
    const cx = ox + pw / 2;
    const cy = oy + ph / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(ox, oy, pw, ph);

    const titleSize = Math.min(32, ph * 0.16);
    ctx.fillStyle = '#ff4444';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', cx, oy + ph * 0.2);

    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.min(20, ph * 0.1)}px monospace`;
    ctx.fillText(`得分: ${score}`, cx, oy + ph * 0.35);

    if (!nameSubmitted) {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(10, ph * 0.06)}px monospace`;
      ctx.fillText('输入名字 (最多10字母):', cx, cy - 10);
      // 名字输入框
      const inputW = Math.min(220, pw * 0.7);
      const inputH = Math.min(36, ph * 0.14);
      const ix = cx - inputW / 2;
      const iy = cy + 10;
      ctx.fillStyle = '#222';
      ctx.fillRect(ix, iy, inputW, inputH);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, inputW, inputH);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, inputH * 0.5)}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(playerName.toUpperCase() + (Math.floor(Date.now() / 500) % 2 === 0 ? '_' : ''), ix + 10, iy + inputH / 2);
      ctx.textAlign = 'center';
    } else {
      ctx.fillStyle = '#4caf50';
      ctx.font = `${Math.max(12, ph * 0.07)}px monospace`;
      if (rank > 0) {
        ctx.fillText(`已登记！排名第 ${rank} 名`, cx, cy);
      } else {
        ctx.fillText('已登记（未进入前50）', cx, cy);
      }
      ctx.fillStyle = '#888';
      ctx.font = `${Math.max(10, ph * 0.05)}px monospace`;
      ctx.fillText('按 空格/J 或点击 返回主菜单', cx, cy + ph * 0.12);
    }
  }

  drawLeaderboard(entries: { name: string; score: number; date: string }[]) {
    const ctx = this.ctx;
    const { x: ox, y: oy } = this.playfieldOffset;
    const pw = PLAYFIELD_W;
    const ph = PLAYFIELD_H;

    ctx.fillStyle = '#000';
    ctx.fillRect(ox, oy, pw, ph);

    const titleSize = Math.min(24, ph * 0.12);
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('排行榜', ox + pw / 2, oy + titleSize);

    const startY = oy + titleSize * 1.8;
    const lineH = Math.max(14, ph * 0.065);
    const fontSize = Math.max(10, lineH * 0.7);

    if (entries.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = `${fontSize}px monospace`;
      ctx.fillText('暂无记录', ox + pw / 2, oy + ph / 2);
    } else {
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'left';
      const maxShow = Math.min(entries.length, 50);
      for (let i = 0; i < maxShow; i++) {
        const e = entries[i];
        const y = startY + i * lineH;
        if (y > oy + ph - 25) break;
        ctx.fillStyle = i < 3 ? '#ffd700' : '#fff';
        ctx.fillText(`${String(i + 1).padStart(2, ' ')}.`, ox + 10, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(e.name.padEnd(10, ' '), ox + 45, y);
        ctx.fillStyle = '#4caf50';
        ctx.textAlign = 'right';
        ctx.fillText(String(e.score), ox + pw - 10, y);
        ctx.textAlign = 'left';
      }
    }

    ctx.fillStyle = '#888';
    ctx.font = `${Math.max(9, ph * 0.05)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('按 空格/J 或点击 返回', ox + pw / 2, oy + ph - 10);
  }
}
