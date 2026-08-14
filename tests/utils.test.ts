import { describe, it, expect } from 'vitest';
import { rectsOverlap, dirVector, pixelToTile, clamp, inBounds } from '../src/game/utils';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from '../src/game/constants';

describe('utils', () => {
  describe('rectsOverlap', () => {
    it('returns true for overlapping rects', () => {
      expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    });

    it('returns false for non-overlapping rects', () => {
      expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 })).toBe(false);
    });

    it('returns false for touching (edge) rects', () => {
      expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    });
  });

  describe('dirVector', () => {
    it('returns correct vectors', () => {
      expect(dirVector('up')).toEqual({ dx: 0, dy: -1 });
      expect(dirVector('down')).toEqual({ dx: 0, dy: 1 });
      expect(dirVector('left')).toEqual({ dx: -1, dy: 0 });
      expect(dirVector('right')).toEqual({ dx: 1, dy: 0 });
    });
  });

  describe('pixelToTile', () => {
    it('converts pixel coords to tile coords', () => {
      expect(pixelToTile(0, 0)).toEqual({ col: 0, row: 0 });
      expect(pixelToTile(TILE_SIZE, TILE_SIZE)).toEqual({ col: 1, row: 1 });
      expect(pixelToTile(TILE_SIZE * 2.5, TILE_SIZE * 3.7)).toEqual({ col: 2, row: 3 });
    });
  });

  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(11, 0, 10)).toBe(10);
    });
  });

  describe('inBounds', () => {
    it('returns true for rect inside map', () => {
      expect(inBounds({ x: 0, y: 0, w: TILE_SIZE, h: TILE_SIZE })).toBe(true);
    });

    it('returns false for rect outside map', () => {
      expect(inBounds({ x: -1, y: 0, w: TILE_SIZE, h: TILE_SIZE })).toBe(false);
      expect(inBounds({ x: 0, y: MAP_ROWS * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE })).toBe(false);
    });
  });
});
