// 排行榜：基于 localStorage 存储分数

export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

const STORAGE_KEY = 'tank_battalion_leaderboard';
const MAX_ENTRIES = 50;
const MAX_NAME_LENGTH = 10;

export class Leaderboard {
  private entries: ScoreEntry[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
      }
    } catch {
      this.entries = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // 忽略存储错误
    }
  }

  // 添加一条分数记录，返回排名（1-based），若未进前50返回 -1
  addScore(name: string, score: number): number {
    const cleanName = name.trim().slice(0, MAX_NAME_LENGTH) || 'PLAYER';
    const entry: ScoreEntry = {
      name: cleanName.toUpperCase(),
      score,
      date: new Date().toISOString().slice(0, 10),
    };
    this.entries.push(entry);
    // 按分数降序排列
    this.entries.sort((a, b) => b.score - a.score);
    // 只保留前 50 名
    const rank = this.entries.indexOf(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }
    this.save();
    // 如果被截断，返回 -1
    if (rank >= MAX_ENTRIES) return -1;
    return rank + 1;
  }

  getEntries(): ScoreEntry[] {
    return [...this.entries];
  }

  getMaxNameLength(): number {
    return MAX_NAME_LENGTH;
  }

  clear() {
    this.entries = [];
    this.save();
  }
}
