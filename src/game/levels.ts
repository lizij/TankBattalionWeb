import { TileType } from './types';
import { MAP_COLS, MAP_ROWS } from './constants';

// 关卡地图定义
// 字符含义:
// . 空地  B 砖墙  S 钢墙  W 水  T 树林  I 冰  E 老鹰基地
// 原始地图为 13x13 格，parseLevel 会自动扩展为 26x26（每格变 2x2）
// 老鹰基地为 2x2 块（扩展后 4x4），位于底部中央

const LEVEL_1 = [
  '.............',
  '..BB.....BB..',
  '..BB.....BB..',
  '.............',
  'BB.BB.B.BB.BB',
  'BB.BB.B.BB.BB',
  '.............',
  '..SS..T..SS..',
  '..SS..T..SS..',
  '.............',
  '....BBBBB....',
  '.....BEEB....',
  '.....BEEB....',
];

const LEVEL_2 = [
  'BB.........BB',
  'BB.WWW.WWW.BB',
  '...W.....W...',
  '...W.BBB.W...',
  'BB...B.B...BB',
  'BB.T.B.B.T.BB',
  '....B.B.B....',
  'BB.T.B.B.T.BB',
  'BB...B.B...BB',
  '...W.BBB.W...',
  '...W.....W...',
  '....BBBBB....',
  '.....BEEB....',
];

const LEVEL_3 = [
  'SS.........SS',
  'SS.BBBBBBB.SS',
  '...B.....B...',
  '...B.SSS.B...',
  'BB.B.S.S.B.BB',
  'BB.B.SSS.B.BB',
  '...B.....B...',
  '...B.III.B...',
  'BB.B.III.B.BB',
  'BB.B.....B.BB',
  '...BBBBBBB...',
  '....BBBBB....',
  '.....BEEB....',
];

const LEVEL_4 = [
  'TT.........TT',
  'TT.BB...BB.TT',
  '...BB...BB...',
  '.............',
  'WW.BBBBBBB.WW',
  'WW.B.....B.WW',
  '...B.SSS.B...',
  'WW.B.....B.WW',
  'WW.BBBBBBB.WW',
  '.............',
  '...BB...BB...',
  '....BBBBB....',
  '.....BEEB....',
];

const LEVEL_5 = [
  'SS.BBBBBBB.SS',
  'SS.B.....B.SS',
  '...B.SSS.B...',
  '...B.S.S.B...',
  'BB.B.SSS.B.BB',
  'BB.B.....B.BB',
  '...BBBBBBB...',
  'BB.B.....B.BB',
  'BB.B.III.B.BB',
  '...B.III.B...',
  '...B.....B...',
  '....BBBBB....',
  '.....BEEB....',
];

export const LEVELS: string[][] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5];

// 将 13x13 的关卡字符串扩展为 26x26（每个字符横向、纵向各复制一次）
function expandLevel(level: string[]): string[] {
  const expanded: string[] = [];
  for (const line of level) {
    // 横向扩展：每个字符重复两次
    const expandedLine = line.split('').map(ch => ch + ch).join('');
    // 纵向扩展：每行重复两次
    expanded.push(expandedLine);
    expanded.push(expandedLine);
  }
  return expanded;
}

export function parseLevel(level: string[]): TileType[][] {
  const expanded = expandLevel(level);
  const map: TileType[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row: TileType[] = [];
    const line = expanded[r] || '';
    for (let c = 0; c < MAP_COLS; c++) {
      const ch = line[c] || '.';
      row.push(charToTile(ch));
    }
    map.push(row);
  }
  return map;
}

function charToTile(ch: string): TileType {
  switch (ch) {
    case 'B': return TileType.Brick;
    case 'S': return TileType.Steel;
    case 'W': return TileType.Water;
    case 'T': return TileType.Trees;
    case 'I': return TileType.Ice;
    case 'E': return TileType.Eagle;
    default: return TileType.Empty;
  }
}

export function getLevelMap(levelIndex: number): TileType[][] {
  const idx = levelIndex % LEVELS.length;
  return parseLevel(LEVELS[idx]);
}
