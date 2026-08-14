import { Game } from './game/Game';
import { LayoutMode } from './game/Renderer';
import { TouchControls } from './game/TouchControls';
import { PLAYFIELD_W, PLAYFIELD_H, SIDEBAR_W } from './game/constants';

// 重置 body 样式，防止默认 margin 导致溢出
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#000';

const app = document.getElementById('app')!;
app.style.width = '100%';
app.style.height = '100vh';
app.style.display = 'flex';
app.style.alignItems = 'center';
app.style.justifyContent = 'center';

// 检测布局模式：竖屏为 mobile，横屏为 desktop
function detectLayout(): LayoutMode {
  return document.documentElement.clientHeight > document.documentElement.clientWidth ? 'mobile' : 'desktop';
}

let layout = detectLayout();
let canvas = createCanvas(layout);
let game = new Game(canvas, layout);
let touchControls: TouchControls | null = null;

// 触屏控件占用的底部高度（用于移动端缩放计算）
const MOBILE_CONTROLS_H = 180;

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
  let availW = document.documentElement.clientWidth;
  let availH = document.documentElement.clientHeight;
  // 移动端需要为底部虚拟按键留出空间
  if (layout === 'mobile') {
    availH -= MOBILE_CONTROLS_H;
  }
  const scale = Math.min(
    availW / canvas.width,
    availH / canvas.height,
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
    nameInputVisible = false; // 重置，让输入框重新定位
  }
  // 移动端每次 resize 都重建触屏控件以适配屏幕尺寸
  if (layout === 'mobile') {
    if (touchControls) {
      touchControls.destroy();
    }
    touchControls = new TouchControls(game.getInput(), document.body);
  } else if (touchControls) {
    touchControls.destroy();
    touchControls = null;
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

let nameInputVisible = false;

function updateNameInputVisibility() {
  const shouldShow = game.status === 'gameover' && !game.nameSubmitted;

  if (shouldShow) {
    if (!nameInputVisible) {
      // 首次显示时设置位置和大小
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;
      const oy = layout === 'mobile' ? 56 : 0;
      const pw = PLAYFIELD_W;
      const ph = PLAYFIELD_H;
      const cx = pw / 2;
      const cy = oy + ph / 2;
      const inputW = Math.min(220, pw * 0.7);
      const inputH = Math.min(36, ph * 0.14);
      const ix = cx - inputW / 2;
      const iy = cy + 10;
      nameInput.style.display = 'block';
      nameInput.style.left = `${rect.left + ix * scaleX}px`;
      nameInput.style.top = `${rect.top + iy * scaleY}px`;
      nameInput.style.width = `${inputW * scaleX}px`;
      nameInput.style.height = `${inputH * scaleY}px`;
      nameInput.style.fontSize = `${Math.max(12, inputH * 0.5) * scaleY}px`;
      nameInput.value = game.playerName;
      nameInput.focus();
      nameInputVisible = true;
    }
  } else {
    if (nameInputVisible) {
      nameInput.style.display = 'none';
      nameInput.value = '';
      nameInputVisible = false;
    }
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
  // 静音切换
  if (e.key === 'm' || e.key === 'M') {
    game.audio.setMuted(!game.audio.isMuted());
  }
});

// 禁止双指缩放
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
