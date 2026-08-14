import { describe, it, expect } from 'vitest';
import { parseLevel, getLevelMap } from '../src/game/levels';
import { TileType } from '../src/game/types';
import { MAP_COLS, MAP_ROWS } from '../src/game/constants';

describe('levels', () => {
  describe('parseLevel', () => {
    it('parses characters to tile types (expanded 2x)', () => {
      const level = [
        'B.S',
        '.W.',
        'TIE',
      ];
      const map = parseLevel(level);
      // 每个字符扩展为 2x2，所以 3x3 输入变为 6x6
      expect(map[0][0]).toBe(TileType.Brick);
      expect(map[0][2]).toBe(TileType.Empty);
      expect(map[0][4]).toBe(TileType.Steel);
      expect(map[2][2]).toBe(TileType.Water);
      expect(map[4][0]).toBe(TileType.Trees);
      expect(map[4][2]).toBe(TileType.Ice);
      expect(map[4][4]).toBe(TileType.Eagle);
    });

    it('produces a 26x26 map', () => {
      const map = getLevelMap(0);
      expect(map.length).toBe(MAP_ROWS);
      for (const row of map) {
        expect(row.length).toBe(MAP_COLS);
      }
    });

    it('has an eagle at the bottom center', () => {
      const map = getLevelMap(0);
      // 老鹰在底部中央区域（4x4 块，cols 12-15, rows 22-25）
      let foundEagle = false;
      for (let r = MAP_ROWS - 4; r < MAP_ROWS; r++) {
        for (let c = 12; c <= 15; c++) {
          if (map[r][c] === TileType.Eagle) foundEagle = true;
        }
      }
      expect(foundEagle).toBe(true);
    });
  });

  describe('getLevelMap', () => {
    it('loops levels', () => {
      const m0 = getLevelMap(0);
      const m5 = getLevelMap(5); // 5 % 5 = 0
      expect(m0).toEqual(m5);
    });
  });
});
