import puppeteer from 'puppeteer';

const URL = 'http://localhost:5174/';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function testViewport(width: number, height: number, label: string) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: true, hasTouch: true });
  
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(500);
  
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const tc = document.getElementById('touch-controls');
    const dpad = tc?.querySelector('div');
    const shoot = tc?.querySelectorAll('div')[1];
    return {
      displayedW: rect.width,
      displayedH: rect.height,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      dpadBottom: dpad?.getBoundingClientRect().bottom ?? 0,
      shootBottom: shoot?.getBoundingClientRect().bottom ?? 0,
    };
  });
  
  const canvasFits = info!.displayedW <= info!.viewportW && info!.displayedH <= info!.viewportH;
  const controlsFit = info!.dpadBottom <= info!.viewportH && info!.shootBottom <= info!.viewportH;
  console.log(`[${label}] ${width}x${height}: canvas=${Math.round(info!.displayedW)}x${Math.round(info!.displayedH)}, fits=${canvasFits}, controlsFit=${controlsFit}, errors=${errors.length}`);
  
  await browser.close();
  return canvasFits && controlsFit && errors.length === 0;
}

(async () => {
  const results = await Promise.all([
    testViewport(390, 844, 'iPhone 14'),
    testViewport(375, 667, 'iPhone SE'),
    testViewport(360, 780, 'Android'),
    testViewport(320, 568, 'iPhone 5'),
  ]);
  
  const allPass = results.every(r => r);
  console.log(`\nAll mobile tests passed: ${allPass}`);
  process.exit(allPass ? 0 : 1);
})();
