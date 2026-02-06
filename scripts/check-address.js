(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Use a lighter wait strategy and longer timeout to avoid networkidle timeouts
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Try to find the input used by AddressSearch
    const input = await page.$('input[aria-controls="address-results"]');
    if (!input) {
      console.error('Address input not found (selector input[aria-controls="address-results"])');
      process.exit(2);
    }

      // Focus and type slowly to trigger client-side debounce/search
      await input.click();
      await input.fill('');
      await page.type('input[aria-controls="address-results"]', '10 Rue de Rivoli', { delay: 100 });
      await page.waitForTimeout(1200);

    // Wait for results container
    const results = await page.$('#address-results');
    if (!results) {
      console.error('Address results container not present (#address-results)');
      process.exit(3);
    }

    const visible = await results.isVisible().catch(() => false);
    console.log('Results container present and visible:', visible);

    const items = await results.$$('li');
    console.log('Result items count:', items.length);

    if (items.length > 0) {
      const firstText = await items[0].innerText();
      console.log('First suggestion:', firstText.replace(/\n/g, ' | '));
      process.exit(0);
    } else {
      console.error('No suggestion items found');
      process.exit(4);
    }
  } catch (err) {
    console.error('Error during check:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
