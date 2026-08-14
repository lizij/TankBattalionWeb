// 运行时冒烟测试：模拟游戏运行若干帧，捕获运行时错误
import { Game } from '../src/game/Game';

// Mock DOM
const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1024,
  innerHeight: 768,
};
// @ts-ignore
global.window = mockWindow;
// @ts-ignore
global.document = { addEventListener: () => {} };
try {
  // @ts-ignore
  global.navigator = { getGamepads: () => [] };
} catch {
  Object.defineProperty(global, 'navigator', {
    value: { getGamepads: () => [] },
    configurable: true,
  });
}

const mockGradient = {
  addColorStop: () => {},
};

const canvas = {
  getContext: () => ({
    fillRect: () => {}, clearRect: () => {}, fillText: () => {},
    strokeRect: () => {}, beginPath: () => {}, arc: () => {},
    fill: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {},
    save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
    createLinearGradient: () => mockGradient,
    createRadialGradient: () => mockGradient,
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 0,
    globalAlpha: 1, globalCompositeOperation: '',
  }),
  width: 0, height: 0,
} as unknown as HTMLCanvasElement;

const game = new Game(canvas, 'desktop');

// 模拟菜单 -> 开始
game.startGame();
console.log('Game started. Status:', game.status);
console.log('Level:', game.level, 'Enemies in queue:', game['enemyQueue'].length);

let errors = 0;
const frames = 600; // 10 seconds at 60fps

for (let i = 0; i < frames; i++) {
  try {
    // 模拟玩家输入：随机移动和射击
    const input = game.getInput();
    const dirs = ['up', 'down', 'left', 'right'] as const;
    const dir = dirs[Math.floor(Math.random() * 4)];
    input.setTouch(dir, true);
    if (Math.random() < 0.3) input.setTouch('shoot', true);
    else input.setTouch('shoot', false);

    game.update();
    game.render();

    // 清理方向输入
    for (const d of dirs) input.setTouch(d, false);

    // 如果游戏结束，重新开始
    if (game.status === 'gameover') {
      game.startGame();
    } else if (game.status === 'levelclear') {
      game.nextLevel();
    }
  } catch (e) {
    errors++;
    console.error(`Frame ${i} error:`, e);
    if (errors > 5) break;
  }
}

console.log(`\nSmoke test complete: ${frames} frames, ${errors} errors`);
console.log('Final status:', game.status);
console.log('Score:', game.score);
console.log('Enemies killed:', game.enemiesKilled);

if (errors === 0) {
  console.log('✓ SMOKE TEST PASSED');
  process.exit(0);
} else {
  console.log('✗ SMOKE TEST FAILED');
  process.exit(1);
}
