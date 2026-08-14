import { describe, it, expect } from 'vitest';
import { parseLevel, getLevelMap } from '../src/game/levels';
import { TileType } from '../src/game/types';
import { MAP_COLS, MAP_ROWS } from '../src/game/constants';

describe('levels', () => {
  describe('parseLevel', () => {
    it('parses characters to tile types', () => {
      const level = [
        'B.S',
        '.W.',
        'TIE',
      ];
      const map = parseLevel(level);
      expect(map[0][0]).toBe(TileType.Brick);
      expect(map[0][1]).toBe(TileType.Empty);
      expect(map[0][2]).toBe(TileType.Steel);
      expect(map[1][1]).toBe(TileType.Water);
      expect(map[2][0]).toBe(TileType.Trees);
      expect(map[2][1]).toBe(TileType.Ice);
      expect(map[2][2]).toBe(TileType.Eagle);
    });

    it('produces a 13x13 map', () => {
      const map = getLevelMap(0);
      expect(map.length).toBe(MAP_ROWS);
      for (const row of map) {
        expect(row.length).toBe(MAP_COLS);
      }
    });

    it('has an eagle at the bottom center', () => {
      const map = getLevelMap(0);
      // 老鹰在底部中央区域
      let foundEagle = false;
      for (let r = MAP_ROWS - 2; r < MAP_ROWS; r++) {
        for (let c = 5; c <= 7; c++) {
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
