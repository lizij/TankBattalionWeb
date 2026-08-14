# 坦克大战 (Tank Battalion)

经典街机游戏《坦克大战》的网页复刻版，支持 PC 浏览器（横屏）和手机浏览器（竖屏），提供键盘、Xbox 手柄、触屏虚拟按键三种操作方式。

> 完整的产品功能设计与游戏玩法介绍见 [PRD.md](PRD.md)。

## 工程介绍

### 技术栈
- **TypeScript** + **Vite** 构建
- **Canvas 2D** 渲染（所有素材通过代码绘制，无外部图片/音频依赖）
- **Vitest** 单元测试

### 目录结构
```
.
├── index.html              # 入口 HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   └── PRD.md              # 产品需求文档（玩法/道具/操作等）
├── src/
│   ├── main.ts             # 入口：画布、布局、游戏循环
│   └── game/
│       ├── types.ts        # 类型定义
│       ├── constants.ts    # 常量
│       ├── levels.ts       # 关卡地图
│       ├── utils.ts        # 工具函数
│       ├── Tank.ts         # 坦克基类
│       ├── PlayerTank.ts   # 玩家坦克
│       ├── EnemyTank.ts    # 敌方坦克（AI）
│       ├── Bullet.ts       # 子弹
│       ├── PowerUp.ts      # 道具
│       ├── InputManager.ts # 输入管理
│       ├── TouchControls.ts# 触屏虚拟按键
│       ├── Leaderboard.ts  # 排行榜（localStorage）
│       ├── Renderer.ts     # 渲染器
│       └── Game.ts         # 游戏主类
├── tests/                  # 单元测试 + 冒烟/玩法测试
└── dist/                   # 构建产物
```

### 关键设计
- 坦克占 2×2 格，移动时对齐半格网格以便转弯
- 子弹与地形碰撞：砖墙直接摧毁，钢墙需 3 星玩家，老鹰被击中即 Game Over
- 敌人 AI：定时换方向，70% 概率朝玩家/基地方向移动
- 道具：第 4/11/18 个出生的敌人携带道具
- 排行榜：localStorage 存储，按分数降序，最多 50 条

## 部署说明

```bash
npm install
npm run dev          # 开发服务器 http://localhost:5173
npm run build        # 产物输出到 dist/
npm test             # 单元测试
```

`dist/` 为独立可运行的静态文件包，可直接部署到任意静态服务器或本地打开。

## 使用说明

操作方式及游戏玩法详见 [PRD.md](PRD.md)。

## 版本升级规则（SemVer）

`version` 字段格式 `${major}.${minor}.${patch}`。每次修改本项目时按以下规则递增：

| 位 | 触发条件 | 举例 |
|---|---|---|
| `major` | 重大功能更新、破坏性变更、目录结构调整、核心玩法重构 | 新增多人模式、重写渲染引擎、改变操作方式 |
| `minor` | 普通新功能：新增游戏机制、道具、敌人类型、界面模块 | 新增排行榜、BGM 音效、道具系统 |
| `patch` | 文档修订、错别字、bugfix、参数微调，且不改变外部行为 | 修复碰撞检测边界、调整敌人速度、修正文案 |

约束：只增不减；修改任何文件（包括文档）都要 bump；单次改动涉及多档时按最高档计。
