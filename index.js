const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

/**
 * GET /screenshot
 * Description: Captures a screenshot of a webpage using Puppeteer.
 *
 * Query Parameters:
 *   url           : (string)  Required. URL to capture (must include http/https).
 *   format        : (string)  Optional. "png" (default) or "jpeg".
 *   width         : (number)  Optional. Viewport width when not using fullPage (default: 1280).
 *   height        : (number)  Optional. Viewport height when not using fullPage (default: 720).
 *   fullPage      : (boolean) Optional. Whether to capture the full page (default: false).
 *   waitTime      : (number)  Optional. Time (in milliseconds) to wait before capturing (default: 0).
 *   hideSelectors : (string)  Optional. Comma-separated list of CSS selectors to hide.
 *   customJS      : (string)  Optional. Custom JavaScript to execute on the page before capture.
 */
app.get('/screenshot', async (req, res) => {
  // Extract parameters from the query string
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

  // URL is required—return error if missing
  if (!url) {
    return res.status(400).json({ error: 'Parameter "url" is required.' });
  }

  // Convert values to appropriate data types
  const fullPageBool = fullPage.toLowerCase() === 'true';
  const waitTimeNum = parseInt(waitTime, 10);
  const widthNum = parseInt(width, 10);
  const heightNum = parseInt(height, 10);
  const hideSelectorsArray = hideSelectors ? hideSelectors.split(',') : [];

  let browser;
  try {
    // Launch Puppeteer with sandbox disabled (for container environments)
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport if full page capture is not desired
    if (!fullPageBool) {
      await page.setViewport({ width: widthNum, height: heightNum });
    }

    // Navigate to the specified URL (must include http/https)
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Hide any specified elements by CSS selectors
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

    // Wait additional time if specified
    if (waitTimeNum > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTimeNum));
    }

    // Capture the screenshot with the specified options
    const screenshotBuffer = await page.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      fullPage: fullPageBool
    });

    await browser.close();

    // Set the appropriate content type and send back the screenshot
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
