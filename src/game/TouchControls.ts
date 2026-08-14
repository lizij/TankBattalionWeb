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
      left: 20px;
      bottom: 20px;
      width: 150px;
      height: 150px;
      pointer-events: auto;
    `;
    this.buildDpad();

    // 射击键（右下）
    this.shootBtn = document.createElement('div');
    this.shootBtn.textContent = '射击';
    this.shootBtn.style.cssText = `
      position: absolute;
      right: 30px;
      bottom: 40px;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(255, 80, 80, 0.6);
      color: #fff;
      font-size: 20px;
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
      right: 20px;
      top: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      color: #fff;
      font-size: 18px;
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

  private buildDpad() {
    const dirs: { dir: 'up' | 'down' | 'left' | 'right'; style: string }[] = [
      { dir: 'up', style: 'left:50px; top:0; width:50px; height:50px;' },
      { dir: 'down', style: 'left:50px; top:100px; width:50px; height:50px;' },
      { dir: 'left', style: 'left:0; top:50px; width:50px; height:50px;' },
      { dir: 'right', style: 'left:100px; top:50px; width:50px; height:50px;' },
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
        font-size: 22px;
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
}
