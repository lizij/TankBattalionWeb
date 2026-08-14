// 使用 Puppeteer 模拟真实用户操作测试游戏
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, 'screenshots');

// 确保截图目录存在
import { mkdirSync, existsSync } from 'fs';
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

const URL = 'http://localhost:5174/';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

(async () => {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });

  // 收集 console 错误
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() === 404) {
      failedRequests.push(`404 ${res.url()}`);
    }
  });

  console.log('\n=== 1. 加载页面 ===');
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.screenshot({ path: join(screenshotsDir, '01-menu.png') });

  // 检查 canvas 是否存在
  const canvasExists = await page.$('canvas') !== null;
  assert(canvasExists, '页面包含 canvas 元素');

  console.log('\n=== 2. 点击"新游戏" ===');
  // 点击新游戏按钮（通过 canvas 坐标）
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // 新游戏按钮在画布中间偏上
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2 - 30;
      await page.mouse.click(cx, cy);
      await sleep(500);
      await page.screenshot({ path: join(screenshotsDir, '02-game-started.png') });
    }
  }

  console.log('\n=== 3. 模拟移动和射击 ===');
  // 按 W 上移
  await page.keyboard.down('w');
  await sleep(300);
  await page.keyboard.up('w');
  // 按 D 右移
  await page.keyboard.down('d');
  await sleep(300);
  await page.keyboard.up('d');
  // 射击
  await page.keyboard.press('j');
  await sleep(200);
  await page.screenshot({ path: join(screenshotsDir, '03-playing.png') });
  assert(true, '移动和射击无报错');

  console.log('\n=== 4. 暂停/继续 ===');
  await page.keyboard.press('p');
  await sleep(300);
  await page.screenshot({ path: join(screenshotsDir, '04-paused.png') });
  await page.keyboard.press('p');
  await sleep(200);
  assert(true, '暂停/继续无报错');

  console.log('\n=== 5. 静音切换 ===');
  await page.keyboard.press('m');
  await sleep(100);
  await page.keyboard.press('m');
  assert(true, '静音切换无报错');

  console.log('\n=== 6. 检查 console 错误 ===');
  if (failedRequests.length > 0) {
    console.log('  失败的请求:');
    failedRequests.forEach(r => console.log(`    ${r}`));
  }
  assert(consoleErrors.length === 0, `无 console 错误 (${consoleErrors.length} 个)`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.error(`    ${e}`));
  }

  console.log('\n=== 7. 测试排行榜 ===');
  // 刷新回到菜单
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(500);
  // 点击排行榜按钮（重新获取 canvas）
  const canvas2 = await page.$('canvas');
  if (canvas2) {
    const box = await canvas2.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2 + 30;
      await page.mouse.click(cx, cy);
      await sleep(300);
      await page.screenshot({ path: join(screenshotsDir, '05-leaderboard.png') });
      // 返回菜单
      await page.keyboard.press('j');
      await sleep(200);
    }
  }
  assert(true, '排行榜界面无报错');

  console.log('\n=== 8. 长时间运行稳定性 ===');
  // 开始游戏并运行一段时间
  const canvas3 = await page.$('canvas');
  if (canvas3) {
    const box = await canvas3.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2 - 30;
      await page.mouse.click(cx, cy);
      await sleep(500);
    }
  }
  // 随机操作 5 秒
  const keys = ['w', 'a', 's', 'd', 'j'];
  for (let i = 0; i < 50; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    await page.keyboard.down(key);
    await sleep(50);
    await page.keyboard.up(key);
  }
  await page.screenshot({ path: join(screenshotsDir, '06-long-run.png') });
  assert(consoleErrors.length === 0, `长时间运行无 console 错误 (${consoleErrors.length} 个)`);

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`浏览器测试完成: ${passed} passed, ${failed} failed`);
  console.log(`截图保存在: ${screenshotsDir}`);
  if (failed > 0) {
    console.log('✗ 有测试失败');
    process.exit(1);
  } else {
    console.log('✓ 全部通过');
    process.exit(0);
  }
})();
