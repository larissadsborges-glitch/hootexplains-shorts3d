// Render ticket previews (PNG) and numbered print PDFs. Run after scripts/make_tickets.py.
// Usage: node scripts/tickets_pdf.js [preview|pdf] [versions...]   e.g. node scripts/tickets_pdf.js pdf 1 3
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dir = path.join(__dirname, '..', 'public', 'promo_unidos', 'print', 'tickets');
const out = path.join(__dirname, '..', 'out', 'bilhetes_print');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const mode = process.argv[2] || 'preview';
  const vs = process.argv.slice(3).length ? process.argv.slice(3) : ['1', '2', '3', '4', '5'];
  const b = await chromium.launch();
  if (mode === 'preview') {
    const p = await b.newPage({ viewport: { width: 1060, height: 800 }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(dir, process.env.PREVIEW || 'preview.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(out, process.env.PREVIEW_OUT || 'versoes_preview.png'), fullPage: true });
  } else {
    for (const v of vs) {
      const p = await b.newPage();
      await p.goto('file://' + path.join(dir, `sheets_v${v}.html`), { timeout: 0 });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(1000);
      await p.pdf({ path: path.join(out, `bilhetes_v${v}_0001-2000_A4.pdf`), width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true, timeout: 0 });
      console.log('pdf', v);
      await p.close();
    }
  }
  await b.close();
})();
