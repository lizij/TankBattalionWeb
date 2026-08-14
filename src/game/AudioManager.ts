// 音频管理器：使用 Web Audio API 生成 8-bit 风格音效和 BGM（无外部音频文件）

type NoteName =
  | 'C3' | 'D3' | 'E3' | 'F3' | 'G3' | 'A3' | 'B3'
  | 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4'
  | 'C5' | 'D5' | 'E5' | 'F5' | 'G5' | 'A5' | 'B5'
  | 'REST';

// 音符频率表
const NOTE_FREQ: Record<NoteName, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  REST: 0,
};

// 音符时长（秒），以四分音符为基准
const BEAT = 0.18; // 每拍时长，控制 BPM（约 167 BPM 的八分音符）

// BGM 主旋律（灵感来自经典坦克大战主题曲风格）
const MELODY: { note: NoteName; beats: number }[] = [
  // 第一句
  { note: 'G4', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'E5', beats: 1 }, { note: 'G5', beats: 1 },
  { note: 'E5', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'G4', beats: 2 },
  { note: 'A4', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'F5', beats: 1 }, { note: 'A5', beats: 1 },
  { note: 'F5', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'A4', beats: 2 },
  // 第二句
  { note: 'B4', beats: 1 }, { note: 'D5', beats: 1 }, { note: 'G5', beats: 1 }, { note: 'B5', beats: 1 },
  { note: 'G5', beats: 1 }, { note: 'D5', beats: 1 }, { note: 'B4', beats: 2 },
  { note: 'C5', beats: 1 }, { note: 'E5', beats: 1 }, { note: 'G5', beats: 1 }, { note: 'C5', beats: 1 },
  { note: 'E5', beats: 1 }, { note: 'G4', beats: 1 }, { note: 'C5', beats: 2 },
  // 第三句
  { note: 'G4', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'E5', beats: 1 }, { note: 'G5', beats: 1 },
  { note: 'E5', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'G4', beats: 2 },
  { note: 'A4', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'F5', beats: 1 }, { note: 'A5', beats: 1 },
  { note: 'F5', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'A4', beats: 2 },
  // 第四句
  { note: 'F4', beats: 1 }, { note: 'A4', beats: 1 }, { note: 'D5', beats: 1 }, { note: 'F5', beats: 1 },
  { note: 'D5', beats: 1 }, { note: 'A4', beats: 1 }, { note: 'F4', beats: 2 },
  { note: 'G4', beats: 1 }, { note: 'B4', beats: 1 }, { note: 'D5', beats: 1 }, { note: 'G5', beats: 1 },
  { note: 'E5', beats: 1 }, { note: 'C5', beats: 1 }, { note: 'G4', beats: 2 },
];

// 低音线（每小节一个根音）
const BASS: { note: NoteName; beats: number }[] = [
  { note: 'G3', beats: 4 }, { note: 'F3', beats: 4 },
  { note: 'G3', beats: 4 }, { note: 'C4', beats: 4 },
  { note: 'G3', beats: 4 }, { note: 'F3', beats: 4 },
  { note: 'C4', beats: 4 }, { note: 'G3', beats: 4 },
];

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmTimer: number | null = null;
  private bgmPlaying = false;
  private melodyIndex = 0;
  private bassIndex = 0;
  private muted = false;

  // 懒加载 AudioContext（需用户交互后才能创建）
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.15;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.masterGain);
    } catch {
      return null;
    }
    return this.ctx;
  }

  // 用户首次交互时调用，解锁音频
  resume() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.5;
    }
  }

  isMuted() {
    return this.muted;
  }

  // 播放单个音符（方波，8-bit 风格）
  private playNote(freq: number, duration: number, gain: GainNode, type: OscillatorType = 'square', volume = 1) {
    const ctx = this.ctx;
    if (!ctx || freq <= 0) return;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    noteGain.gain.setValueAtTime(0, ctx.currentTime);
    noteGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(noteGain);
    noteGain.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // 开始播放 BGM
  startBGM() {
    const ctx = this.ensureContext();
    if (!ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.melodyIndex = 0;
    this.bassIndex = 0;
    this.scheduleNextBGM();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextBGM() {
    if (!this.bgmPlaying || !this.ctx || !this.bgmGain) return;

    const melodyNote = MELODY[this.melodyIndex % MELODY.length];
    const bassNote = BASS[this.bassIndex % BASS.length];

    const melodyDur = melodyNote.beats * BEAT;
    const bassDur = bassNote.beats * BEAT;

    // 主旋律
    this.playNote(NOTE_FREQ[melodyNote.note], melodyDur * 0.9, this.bgmGain, 'square', 0.6);
    // 低音
    this.playNote(NOTE_FREQ[bassNote.note], bassDur * 0.9, this.bgmGain, 'triangle', 0.8);

    // 推进旋律索引
    this.melodyIndex++;
    // 低音每 4 拍推进一次
    if (this.melodyIndex % 4 === 0) {
      this.bassIndex++;
    }

    this.bgmTimer = window.setTimeout(() => this.scheduleNextBGM(), melodyDur * 1000);
  }

  // ===== 音效 =====

  // 射击
  playShoot() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  // 爆炸
  playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    // 噪声爆炸
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.connect(g);
    g.connect(this.sfxGain);
    noise.start();
  }

  // 道具拾取
  playPowerUp() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const notes: NoteName[] = ['C5', 'E5', 'G5', 'C5'];
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(NOTE_FREQ[n], 0.1, this.sfxGain!, 'square', 0.3), i * 60);
    });
  }

  // 玩家死亡
  playPlayerDeath() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.6);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }

  // 游戏结束
  playGameOver() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const notes: NoteName[] = ['G4', 'F4', 'E4', 'D4', 'C4'];
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(NOTE_FREQ[n], 0.25, this.sfxGain!, 'square', 0.3), i * 150);
    });
  }

  // 过关
  playLevelClear() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const notes: NoteName[] = ['C5', 'E5', 'G5', 'C5', 'G5', 'C5'];
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(NOTE_FREQ[n], 0.15, this.sfxGain!, 'square', 0.3), i * 100);
    });
  }
}
