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

  // Debug: log the raw incoming query
  console.log('Incoming query parameters:', req.query);

  // URL is required—return error if missing
  if (!url) {
    console.error('No URL provided!');
    return res.status(400).json({ error: 'Parameter "url" is required.' });
  }

  // Convert values to appropriate data types
  const fullPageBool = fullPage.toLowerCase() === 'true';
  const waitTimeNum = parseInt(waitTime, 10);
  const widthNum = parseInt(width, 10);
  const heightNum = parseInt(height, 10);
  const hideSelectorsArray = hideSelectors ? hideSelectors.split(',') : [];

  // Debug: log the converted values
  console.log('Converted parameters:');
  console.log('  url:', url);
  console.log('  format:', format);
  console.log('  width:', widthNum);
  console.log('  height:', heightNum);
  console.log('  fullPage:', fullPageBool);
  console.log('  waitTime:', waitTimeNum);
  console.log('  hideSelectors:', hideSelectorsArray);
  console.log('  customJS:', customJS);

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

    // Debug: log before navigation
    console.log(`Navigating to: ${url}`);
    
    // Navigate to the specified URL (must include http/https)
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Hide any specified elements by CSS selectors
    if (hideSelectorsArray.length > 0) {
      console.log('Hiding selectors:', hideSelectorsArray);
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
      console.log('Executing custom JS');
      await page.evaluate((code) => { eval(code); }, customJS);
    }

    // Wait additional time if specified
    if (waitTimeNum > 0) {
      console.log(`Waiting for ${waitTimeNum} milliseconds`);
      await new Promise(resolve => setTimeout(resolve, waitTimeNum));
    }

    // Capture the screenshot with the specified options
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
