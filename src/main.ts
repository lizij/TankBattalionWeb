import { Game } from './game/Game';
import { LayoutMode } from './game/Renderer';
import { TouchControls } from './game/TouchControls';
import { PLAYFIELD_W, PLAYFIELD_H, SIDEBAR_W } from './game/constants';

const app = document.getElementById('app')!;

// 检测布局模式：竖屏为 mobile，横屏为 desktop
function detectLayout(): LayoutMode {
  return window.innerHeight > window.innerWidth ? 'mobile' : 'desktop';
}

let layout = detectLayout();
let canvas = createCanvas(layout);
let game = new Game(canvas, layout);
let touchControls: TouchControls | null = null;

function createCanvas(l: LayoutMode): HTMLCanvasElement {
  const c = document.createElement('canvas');
  if (l === 'mobile') {
    c.width = PLAYFIELD_W;
    c.height = PLAYFIELD_H + 56; // 顶部信息栏
  } else {
    c.width = PLAYFIELD_W + SIDEBAR_W;
    c.height = PLAYFIELD_H;
  }
  c.style.display = 'block';
  c.style.margin = '0 auto';
  c.style.imageRendering = 'pixelated';
  c.style.background = '#000';
  return c;
}

function resize() {
  const scale = Math.min(
    window.innerWidth / canvas.width,
    window.innerHeight / canvas.height,
    layout === 'mobile' ? 1.2 : 1.5
  );
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
}

function setupLayout() {
  const newLayout = detectLayout();
  if (newLayout !== layout) {
    layout = newLayout;
    // 重建 canvas
    app.removeChild(canvas);
    canvas = createCanvas(layout);
    app.appendChild(canvas);
    game = new Game(canvas, layout);
    if (touchControls) {
      touchControls.hide();
    }
    if (layout === 'mobile') {
      touchControls = new TouchControls(game.getInput(), document.body);
    }
  }
  resize();
}

app.appendChild(canvas);
if (layout === 'mobile') {
  touchControls = new TouchControls(game.getInput(), document.body);
}

// 画布点击处理（菜单按钮等）
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  game.handleClick(x, y);
});

// 名字输入框（游戏结束时登记分数）
const nameInput = document.createElement('input');
nameInput.type = 'text';
nameInput.maxLength = 10;
nameInput.placeholder = '输入名字';
nameInput.style.position = 'absolute';
nameInput.style.display = 'none';
nameInput.style.zIndex = '10';
nameInput.style.background = '#222';
nameInput.style.color = '#fff';
nameInput.style.border = '2px solid #ffd700';
nameInput.style.fontSize = '18px';
nameInput.style.fontFamily = 'monospace';
nameInput.style.textAlign = 'center';
nameInput.style.textTransform = 'uppercase';
nameInput.style.padding = '6px';
nameInput.style.outline = 'none';
document.body.appendChild(nameInput);

nameInput.addEventListener('input', () => {
  game.setPlayerName(nameInput.value);
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    game.submitScore();
    nameInput.style.display = 'none';
    nameInput.blur();
  }
});

function updateNameInputVisibility() {
  if (game.status === 'gameover' && !game.nameSubmitted) {
    // 定位到画布上名字输入框的位置
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const inputW = 220;
    const inputH = 36;
    const ix = cx - inputW / 2;
    const iy = cy + 20;
    nameInput.style.display = 'block';
    nameInput.style.left = `${rect.left + ix * scaleX}px`;
    nameInput.style.top = `${rect.top + iy * scaleY}px`;
    nameInput.style.width = `${inputW * scaleX}px`;
    nameInput.style.height = `${inputH * scaleY}px`;
    nameInput.style.fontSize = `${18 * scaleY}px`;
    if (document.activeElement !== nameInput) {
      nameInput.focus();
    }
  } else {
    nameInput.style.display = 'none';
  }
}

window.addEventListener('resize', setupLayout);
window.addEventListener('orientationchange', () => setTimeout(setupLayout, 100));

resize();

// 游戏主循环
let lastTime = 0;
const FPS = 60;
const frameTime = 1000 / FPS;

function loop(time: number) {
  const delta = time - lastTime;
  if (delta >= frameTime) {
    lastTime = time - (delta % frameTime);

    if (game.status !== 'playing') {
      game.handleMenuInput();
    } else {
      game.update();
    }
    game.render();
    updateNameInputVisibility();
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// 防止页面滚动
window.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

// 禁止双指缩放
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
