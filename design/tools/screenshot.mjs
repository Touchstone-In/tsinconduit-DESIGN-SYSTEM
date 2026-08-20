// Renders every mockup in ../mockups to ../screenshots as PNG.
// Usage: node screenshot.mjs [file.html ...]   (no args = all mockups)
// Requires a Playwright install (uses the global one on the CI/dev image).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mockups = path.join(here, '..', 'mockups');
const out = path.join(here, '..', 'screenshots');

// Pages also captured in dark mode, to document automatic theming.
const DARK_ALSO = ['02-dashboard.html'];
// Pages captured full-page rather than viewport-height.
const FULL_PAGE = ['00-foundations.html'];

const args = process.argv.slice(2);
const files = (args.length ? args : readdirSync(mockups).filter((f) => f.endsWith('.html'))).sort();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

async function shoot(file, colorScheme, suffix) {
  await page.emulateMedia({ colorScheme });
  await page.goto('file://' + path.join(mockups, file));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const name = file.replace(/\.html$/, '') + suffix + '.png';
  await page.screenshot({ path: path.join(out, name), fullPage: FULL_PAGE.includes(file) });
  console.log('✓', name);
}

for (const f of files) {
  await shoot(f, 'light', '');
  if (DARK_ALSO.includes(f)) await shoot(f, 'dark', '-dark');
}
await browser.close();
