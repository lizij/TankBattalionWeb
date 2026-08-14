// 完整功能测试：模拟用户操作覆盖所有游戏功能
import { Game } from '../src/game/Game';
import { TileType, TankKind, PowerUpType } from '../src/game/types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, PLAYER_SPAWN, EAGLE_POS } from '../src/game/constants';
import { EnemyTank } from '../src/game/EnemyTank';
import { PowerUp } from '../src/game/PowerUp';

// Mock DOM
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
    createLinearGradient: () => mockGradient, createRadialGradient: () => mockGradient,
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 0,
    globalAlpha: 1, globalCompositeOperation: '',
  }),
  width: 0, height: 0,
} as unknown as HTMLCanvasElement;

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

const game = new Game(canvas, 'desktop');
const input = game.getInput();

console.log('\n=== 1. 菜单状态 ===');
assert(game.status === 'menu', '初始状态为 menu');

console.log('\n=== 2. 开始游戏 ===');
game.startGame();
assert(game.status === 'playing', '开始游戏后状态为 playing');
assert(game.score === 0, '初始分数为 0');
assert(game.player.lives === 3, '初始生命为 3');
assert(game.level === 0, '初始关卡为 0');

console.log('\n=== 3. 玩家移动 ===');
const startX = game.player.x;
const startY = game.player.y;
// 向右移动
for (let i = 0; i < 10; i++) {
  input.setTouch('right', true);
  game.update();
  input.setTouch('right', false);
}
assert(game.player.x > startX, '向右移动后 x 增大');
assert(game.player.dir === 'right', '方向为 right');

// 向下移动
const yBefore = game.player.y;
for (let i = 0; i < 10; i++) {
  input.setTouch('down', true);
  game.update();
  input.setTouch('down', false);
}
assert(game.player.y > yBefore, '向下移动后 y 增大');

console.log('\n=== 4. 射击 ===');
const bulletsBefore = game.bullets.length;
input.setTouch('shoot', true);
game.update();
input.setTouch('shoot', false);
assert(game.bullets.length > bulletsBefore, '射击后子弹数量增加');

console.log('\n=== 5. 敌人生成 ===');
const enemiesBefore = game.enemies.length;
for (let i = 0; i < 1000; i++) game.update();
assert(game.enemies.length > enemiesBefore, '敌人会生成');
assert(game.enemies.some(e => e.alive), '有存活的敌人');

console.log('\n=== 6. 击杀敌人得分 ===');
// 清空地图，放一个敌人在玩家正上方
for (let r = 0; r < MAP_ROWS; r++)
  for (let c = 0; c < MAP_COLS; c++)
    game.map[r][c] = TileType.Empty;
game.enemies = [];
game.bullets = [];
game.player.x = PLAYER_SPAWN.x;
game.player.y = PLAYER_SPAWN.y;
game.player.dir = 'up';
const e = new EnemyTank(game.player.x, game.player.y - TILE_SIZE * 3, TankKind.Light);
e.spawnTimer = 0;
game.enemies.push(e);
const scoreBefore = game.score;
for (let i = 0; i < 120; i++) {
  input.setTouch('shoot', true);
  game.update();
  input.setTouch('shoot', false);
  if (!e.alive) break;
}
assert(!e.alive, '敌人被击杀');
assert(game.score > scoreBefore, '击杀敌人后分数增加');

console.log('\n=== 7. 道具 - 星星升级 ===');
const starsBefore = game.player.stars;
game['applyPowerUp'](PowerUpType.Star);
assert(game.player.stars === starsBefore + 1, '星星道具升级玩家');

console.log('\n=== 8. 道具 - 加命 ===');
const livesBefore = game.player.lives;
game['applyPowerUp'](PowerUpType.Tank);
assert(game.player.lives === livesBefore + 1, '坦克道具加一条命');

console.log('\n=== 9. 道具 - 炸弹清屏 ===');
game.enemies = [];
for (let i = 0; i < 3; i++) {
  const en = new EnemyTank(i * 64, 64, TankKind.Light);
  en.spawnTimer = 0;
  game.enemies.push(en);
}
game['applyPowerUp'](PowerUpType.Bomb);
assert(game.enemies.every(en => !en.alive), '炸弹道具消灭所有敌人');

console.log('\n=== 10. 道具 - 冻结 ===');
game['applyPowerUp'](PowerUpType.Clock);
assert(game['freezeTimer'] > 0, '时钟道具激活冻结');

console.log('\n=== 11. 道具 - 护盾 ===');
game['applyPowerUp'](PowerUpType.Helmet);
assert(game.player.shieldTimer > 0, '头盔道具激活护盾');

console.log('\n=== 12. 道具 - 基地加固 ===');
const ec = Math.floor(EAGLE_POS.x / TILE_SIZE);
const er = Math.floor(EAGLE_POS.y / TILE_SIZE);
game.map[er - 1][ec] = TileType.Brick;
game['applyPowerUp'](PowerUpType.Shovel);
assert(game.map[er - 1][ec] === TileType.Steel, '铲子道具加固基地为钢墙');

console.log('\n=== 13. 暂停/继续 ===');
game.status = 'playing';
// 按下 P 暂停
input['keys'].add('p');
game.update();
input['keys'].delete('p');
assert(game.status === 'paused', '按 P 暂停');
// 释放 P（更新 prevPause）
input.getState();
// 再按 P 继续
input['keys'].add('p');
game.handleMenuInput();
input['keys'].delete('p');
assert(game.status === 'playing', '再按 P 继续');

console.log('\n=== 14. 静音切换 ===');
const mutedBefore = game.audio.isMuted();
game.audio.setMuted(!mutedBefore);
assert(game.audio.isMuted() !== mutedBefore, '静音切换生效');
game.audio.setMuted(mutedBefore);

console.log('\n=== 15. 老鹰被摧毁 → Game Over ===');
for (let r = 0; r < MAP_ROWS; r++)
  for (let c = 0; c < MAP_COLS; c++)
    game.map[r][c] = TileType.Empty;
// 放置老鹰
game.map[er][ec] = TileType.Eagle;
game.status = 'playing';
// 用子弹击中老鹰
import { Bullet } from '../src/game/Bullet';
const b = new Bullet(ec * TILE_SIZE + TILE_SIZE / 2, (er - 2) * TILE_SIZE, 'down', false);
game.bullets.push(b);
for (let i = 0; i < 100; i++) {
  game.update();
  if (game.status === 'gameover') break;
}
assert(game.status === 'gameover', '老鹰被摧毁后游戏结束');

console.log('\n=== 16. 分数登记与排行榜 ===');
game.playerName = 'TEST';
const rank = game.submitScore();
assert(game.nameSubmitted, '分数已提交');
assert(rank >= 1, `排名有效: ${rank}`);
const entries = game.leaderboard.getEntries();
assert(entries.length > 0, '排行榜有记录');
assert(entries[0].name === 'TEST', '排行榜第一条是 TEST');

console.log('\n=== 17. 过关 ===');
game.startGame();
game.enemyQueue = [];
game.enemies = [];
game.checkGameState();
assert(game.status === 'levelclear', '敌人全部消灭后过关');

console.log('\n=== 18. 渲染不报错 ===');
game.startGame();
let renderOk = true;
try {
  for (let i = 0; i < 60; i++) {
    game.update();
    game.render();
  }
} catch (err) {
  renderOk = false;
  console.error('渲染错误:', err);
}
assert(renderOk, '连续渲染 60 帧无错误');

console.log(`\n${'='.repeat(50)}`);
console.log(`测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('✗ 有测试失败');
  process.exit(1);
} else {
  console.log('✓ 全部通过');
  process.exit(0);
}
