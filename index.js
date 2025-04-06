const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

/**
 * POST /screenshot
 * Description: Captures a screenshot of a webpage using Puppeteer.
 *
 * Request Body (JSON):
 * {
 *   "url": "https://example.com",   // Required. URL to capture.
 *   "format": "png",                // Optional. "png" or "jpeg". Default is "png".
 *   "width": 1280,                  // Optional. Viewport width when not using fullPage.
 *   "height": 720,                  // Optional. Viewport height when not using fullPage.
 *   "fullPage": false,              // Optional. Boolean flag to capture full page.
 *   "waitTime": 0,                  // Optional. Time in milliseconds to wait before screenshot.
 *   "hideSelectors": [".ad"],       // Optional. Array of CSS selectors to hide.
 *   "customJS": "window.scrollTo(0, document.body.scrollHeight);" // Optional. Custom JS to execute.
 * }
 *
 * Response:
 * - On success: Returns the screenshot image with the appropriate content-type.
 * - On error: Returns a JSON error message.
 */
app.post('/screenshot', async (req, res) => {
  const {
    url,
    format = 'png',
    width = 1280,
    height = 720,
    fullPage = false,
    waitTime = 0,
    hideSelectors = [],
    customJS = ''
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Parameter "url" is required.' });
  }

  let browser;
  try {

	browser = await puppeteer.launch({
  		headless: 'new', // or true if you're using Puppeteer < 21
  		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
    const page = await browser.newPage();

    // Set viewport if fullPage is false
    if (!fullPage) {
      await page.setViewport({ width, height });
    }

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Hide specified elements
    if (Array.isArray(hideSelectors) && hideSelectors.length > 0) {
      await page.evaluate((selectors) => {
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.visibility = 'hidden';
          });
        });
      }, hideSelectors);
    }

    // Execute custom JavaScript if provided
    if (customJS && customJS.trim() !== '') {
      await page.evaluate((code) => {
        // Using eval in the page context to run custom JS
        eval(code);
      }, customJS);
    }

    // Wait for additional time if specified
    if (waitTime > 0) {
      // Wait for additional time if specified

	  await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Capture screenshot
    const screenshotBuffer = await page.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      fullPage: fullPage
    });

    await browser.close();

    // Set content type and send the image
    res.contentType(`image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
    res.send(screenshotBuffer);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error capturing screenshot:', error);
    res.status(500).json({ error: 'Failed to capture screenshot.' });
  }
});

app.listen(port, () => {
  console.log(`Screenshot API is running on port ${port}`);
});
