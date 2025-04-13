const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

// Since we're using query parameters, no need for express.json() middleware for now
// app.use(express.json());

/**
 * GET /screenshot
 * Description: Captures a screenshot of a webpage using Puppeteer.
 *
 * Query Parameters:
 *   url            : (string) Required. URL to capture.
 *   format         : (string) Optional. "png" (default) or "jpeg".
 *   width          : (number) Optional. Viewport width when not using fullPage (default: 1280).
 *   height         : (number) Optional. Viewport height when not using fullPage (default: 720).
 *   fullPage       : (boolean) Optional. Whether to capture the full page. (default: false).
 *   waitTime       : (number) Optional. Time in milliseconds to wait before taking the screenshot (default: 0).
 *   hideSelectors  : (string) Optional. Comma-separated list of CSS selectors to hide.
 *   customJS       : (string) Optional. Custom JS code to execute before capturing.
 */
app.get('/screenshot', async (req, res) => {
  // Read parameters from req.query
  const {
    url,
    format = 'png',
    width = 1280,
    height = 720,
    fullPage = 'false',
    waitTime = 0,
    hideSelectors,
    customJS = ''
  } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter "url" is required.' });
  }

  // Convert string values to their proper data types
  const fullPageBool = fullPage.toLowerCase() === 'true';
  const waitTimeNum = parseInt(waitTime, 10);
  const widthNum = parseInt(width, 10);
  const heightNum = parseInt(height, 10);
  // hideSelectors: if provided as comma-separated list, split it into an array
  const hideSelectorsArray = hideSelectors ? hideSelectors.split(',') : [];

  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport if not capturing full page
    if (!fullPageBool) {
      await page.setViewport({ width: widthNum, height: heightNum });
    }

    // Navigate to the URL (must be valid, e.g., include http/https)
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Hide specified elements, if any
    if (hideSelectorsArray.length > 0) {
      await page.evaluate((selectors) => {
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.visibility = 'hidden';
          });
        });
      }, hideSelectorsArray);
    }

    // Execute custom JavaScript if provided
    if (customJS && customJS.trim() !== '') {
      await page.evaluate((code) => {
        eval(code);
      }, customJS);
    }

    // Wait for additional time if specified
    if (waitTimeNum > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTimeNum));
    }

    // Capture screenshot
    const screenshotBuffer = await page.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      fullPage: fullPageBool
    });

    await browser.close();

    // Return the screenshot with the proper content type
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
