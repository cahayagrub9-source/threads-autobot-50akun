const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

exports.handler = async () => {
  // Baca dari environment atau hardcoded
  const accounts = [
    {
      username: "Bernice.Paxton24",
      password: "freedom123",
      totp_secret: "G76NKKCIXYZNEVG5U653ZZ5ZTHWSKD4",
      caption: "Auto post dari Threads Bot! 🚀 #autobot"
    }
  ];

  const results = [];
  
  for (const account of accounts) {
    try {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      
      // Login + post logic sama seperti post.js
      await page.goto('https://www.instagram.com/accounts/login/');
      // ... full login + post flow
      
      results.push({ username: account.username, status: 'success' });
      await browser.close();
    } catch (error) {
      results.push({ username: account.username, status: 'error', error: error.message });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results })
  };
};
