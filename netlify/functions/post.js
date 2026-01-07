const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

  try {
    const accounts = JSON.parse(event.body || '[]');
    const account = accounts[0] || { username: "Bernice.Paxton24", password: "freedom123", totp_secret: "G76NKKCIXYZNEVG5U653ZZ5ZTHWSKD4", caption: "Test real post! 🚀" };

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');

    // Instagram login → Threads
    await page.goto('https://www.instagram.com/accounts/login/');
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    await page.type('input[name="username"]', account.username, { delay: 100 });
    await page.type('input[name="password"]', account.password, { delay: 100 });
    await page.click('button[type="submit"]');
    
    // 2FA
    const totpRes = await fetch(`https://2fa.live/api/${account.totp_secret}`);
    const totpData = await totpRes.json();
    await page.waitForSelector('input[name="authenticationCode"]', { timeout: 10000 });
    await page.type('input[name="authenticationCode"]', totpData.token, { delay: 100 });
    await page.click('button[type="submit"]');
    
    // Threads post
    await page.goto('https://threads.net');
    await page.waitForSelector('textarea[placeholder*="What"]', { timeout: 10000 });
    await page.type('textarea[placeholder*="What"]', account.caption, { delay: 50 });
    await page.click('button:has-text("Post")');
    
    await browser.close();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: `✅ ${account.username} POSTED "${account.caption}"`,
        totp: totpData.token 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
