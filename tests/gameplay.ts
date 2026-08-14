// 游戏玩法逻辑测试：验证敌人生成、子弹命中、得分
import { Game } from '../src/game/Game';
import { TileType, TankKind } from '../src/game/types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from '../src/game/constants';

const mockWindow = { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1024, innerHeight: 768 };
// @ts-ignore
global.window = mockWindow;
// @ts-ignore
global.document = { addEventListener: () => {} };
try { // @ts-ignore
  global.navigator = { getGamepads: () => [] };
} catch { Object.defineProperty(global, 'navigator', { value: { getGamepads: () => [] }, configurable: true }); }

const mockGradient = { addColorStop: () => {} };

const canvas = {
  getContext: () => ({
    fillRect: () => {}, clearRect: () => {}, fillText: () => {}, strokeRect: () => {},
    beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {}, moveTo: () => {},
    lineTo: () => {}, save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
    createLinearGradient: () => mockGradient,
    createRadialGradient: () => mockGradient,
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 0,
    globalAlpha: 1, globalCompositeOperation: '',
  }),
  width: 0, height: 0,
} as unknown as HTMLCanvasElement;

const game = new Game(canvas, 'desktop');
game.startGame();

// 清空地图，方便测试
for (let r = 0; r < MAP_ROWS; r++)
  for (let c = 0; c < MAP_COLS; c++)
    game.map[r][c] = TileType.Empty;

// 强制生成一个敌人在玩家正上方
const enemy = game['enemies'].length === 0 ? null : game['enemies'][0];
// 直接放一个敌人在玩家上方
import { EnemyTank } from '../src/game/EnemyTank';
const e = new EnemyTank(game.player.x, game.player.y - TILE_SIZE * 3, TankKind.Light);
e.spawnTimer = 0; // 跳过出生动画
game['enemies'].push(e);

console.log('Player at:', game.player.x, game.player.y);
console.log('Enemy at:', e.x, e.y);

// 让玩家朝上射击
game.player.dir = 'up';
const input = game.getInput();

let killed = false;
for (let i = 0; i < 120; i++) {
  input.setTouch('shoot', true);
  game.update();
  input.setTouch('shoot', false);
  if (!e.alive) { killed = true; break; }
}

console.log('Enemy killed:', killed);
console.log('Score:', game.score);
console.log('Bullets on screen:', game.bullets.length);

if (killed && game.score > 0) {
  console.log('✓ GAMEPLAY TEST PASSED: shooting kills enemies and scores');
  process.exit(0);
} else {
  console.log('✗ GAMEPLAY TEST FAILED');
  process.exit(1);
}
