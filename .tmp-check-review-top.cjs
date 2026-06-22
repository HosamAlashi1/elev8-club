const { chromium } = require('C:/Users/Hosam/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 600 } });
  await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;background:#05050a}.upper{height:300px;background:linear-gradient(180deg,#071024,#050b1d)}.review{position:relative;height:500px;overflow:hidden;isolation:isolate}.review:before{content:'';position:absolute;top:-130px;bottom:-120px;left:50%;z-index:-1;width:100vw;transform:translateX(-50%);background:linear-gradient(180deg,#050b1d 0%,rgba(5,11,29,.98) 16%,rgba(5,11,29,.74) 44%,rgba(5,11,29,.28) 74%,transparent 100%) center 130px/100% 340px no-repeat,radial-gradient(ellipse 1120px 500px at 50% 38%,rgba(0,78,238,.09),rgba(0,78,238,.025) 48%,transparent 74%)}</style><div class="upper"></div><div class="review"></div>`);
  await page.evaluate(() => scrollTo(0, 150));
  await page.screenshot({ path: '.tmp-check-review-top.png' });
  await browser.close();
})();
