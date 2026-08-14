import { InputManager } from './InputManager';

// 触屏虚拟控件：左侧方向键，右侧射击键
export class TouchControls {
  private input: InputManager;
  private container: HTMLDivElement;
  private dpad: HTMLDivElement;
  private shootBtn: HTMLDivElement;
  private pauseBtn: HTMLDivElement;

  // 当前按下的方向
  private activeDir: 'up' | 'down' | 'left' | 'right' | null = null;

  constructor(input: InputManager, parent: HTMLElement) {
    this.input = input;

    // 根据屏幕尺寸计算控件大小
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const dpadSize = Math.min(150, Math.max(110, minDim * 0.38));
    const btnSize = Math.min(90, Math.max(64, minDim * 0.22));
    const fontSize = Math.min(20, Math.max(14, minDim * 0.05));

    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 100;
      display: none;
    `;

    // 方向键（左下）
    this.dpad = document.createElement('div');
    this.dpad.style.cssText = `
      position: absolute;
      left: 16px;
      bottom: 16px;
      width: ${dpadSize}px;
      height: ${dpadSize}px;
      pointer-events: auto;
    `;
    this.buildDpad(dpadSize);

    // 射击键（右下）
    this.shootBtn = document.createElement('div');
    this.shootBtn.textContent = '射击';
    this.shootBtn.style.cssText = `
      position: absolute;
      right: 24px;
      bottom: 32px;
      width: ${btnSize}px;
      height: ${btnSize}px;
      border-radius: 50%;
      background: rgba(255, 80, 80, 0.6);
      color: #fff;
      font-size: ${fontSize}px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid rgba(255,255,255,0.5);
      pointer-events: auto;
      user-select: none;
      touch-action: none;
    `;
    this.bindShoot();

    // 暂停键（右上）
    this.pauseBtn = document.createElement('div');
    this.pauseBtn.textContent = 'II';
    this.pauseBtn.style.cssText = `
      position: absolute;
      right: 16px;
      top: 16px;
      width: ${Math.min(50, btnSize * 0.6)}px;
      height: ${Math.min(50, btnSize * 0.6)}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      color: #fff;
      font-size: ${fontSize * 0.8}px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
      touch-action: none;
    `;
    this.bindPause();

    this.container.appendChild(this.dpad);
    this.container.appendChild(this.shootBtn);
    this.container.appendChild(this.pauseBtn);
    parent.appendChild(this.container);

    // 检测是否为触屏设备
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.show();
    }
  }

  private buildDpad(dpadSize: number) {
    const unit = dpadSize / 3;
    const dirs: { dir: 'up' | 'down' | 'left' | 'right'; style: string }[] = [
      { dir: 'up', style: `left:${unit}px; top:0; width:${unit}px; height:${unit}px;` },
      { dir: 'down', style: `left:${unit}px; top:${unit * 2}px; width:${unit}px; height:${unit}px;` },
      { dir: 'left', style: `left:0; top:${unit}px; width:${unit}px; height:${unit}px;` },
      { dir: 'right', style: `left:${unit * 2}px; top:${unit}px; width:${unit}px; height:${unit}px;` },
    ];

    for (const { dir, style } of dirs) {
      const btn = document.createElement('div');
      btn.style.cssText = `
        position: absolute;
        ${style}
        background: rgba(255,255,255,0.25);
        border: 2px solid rgba(255,255,255,0.4);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: ${unit * 0.4}px;
        user-select: none;
        touch-action: none;
      `;
      const arrows: Record<string, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
      btn.textContent = arrows[dir];

      const press = (e: Event) => {
        e.preventDefault();
        this.activeDir = dir;
        this.input.setTouch(dir, true);
        btn.style.background = 'rgba(255,255,255,0.5)';
      };
      const release = (e: Event) => {
        e.preventDefault();
        if (this.activeDir === dir) this.activeDir = null;
        this.input.setTouch(dir, false);
        btn.style.background = 'rgba(255,255,255,0.25)';
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);

      this.dpad.appendChild(btn);
    }
  }

  private bindShoot() {
    const press = (e: Event) => {
      e.preventDefault();
      this.input.setTouch('shoot', true);
      this.shootBtn.style.background = 'rgba(255, 80, 80, 0.9)';
    };
    const release = (e: Event) => {
      e.preventDefault();
      this.input.setTouch('shoot', false);
      this.shootBtn.style.background = 'rgba(255, 80, 80, 0.6)';
    };
    this.shootBtn.addEventListener('touchstart', press, { passive: false });
    this.shootBtn.addEventListener('touchend', release, { passive: false });
    this.shootBtn.addEventListener('touchcancel', release, { passive: false });
    this.shootBtn.addEventListener('mousedown', press);
    this.shootBtn.addEventListener('mouseup', release);
    this.shootBtn.addEventListener('mouseleave', release);
  }

  private bindPause() {
    const press = (e: Event) => {
      e.preventDefault();
      // 模拟 P 键按下
      this.input['keys'].add('p');
      setTimeout(() => this.input['keys'].delete('p'), 50);
    };
    this.pauseBtn.addEventListener('touchstart', press, { passive: false });
    this.pauseBtn.addEventListener('mousedown', press);
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  destroy() {
    this.container.remove();
  }
}
