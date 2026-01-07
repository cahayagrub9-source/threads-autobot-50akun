import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { TOTP } from 'otpauth';

puppeteer.use(StealthPlugin());

async function get2FACode(secret) {
  try {
    // Try 2fa.live first
    const controller = new AbortController();
    const res = await fetch(`https://2fa.live/api/${secret}`, {
      signal: controller.signal
    });
    const data = await res.json();
    return data.token;
  } catch {
    // Fallback to local TOTP
    const totp = new TOTP({
      issuer: 'Threads',
      label: 'Threads',
      secret: secret,
      digits: 6
    });
    return totp.generate();
  }
}

export async function postToThreads(account) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1366, height: 768 });

  try {
    console.log(`🔐 Login ${account.username}...`);
    
    // Login Threads/Instagram
    await page.goto('https://www.threads.net/login', { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.type('input[name="username"]', account.username, { delay: 150 });
    await page.type('input[name="password"]', account.password, { delay: 150 });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2FA.LIVE AUTO
    try {
      await page.waitForSelector(
        'input[aria-label*="code"], input[name="verificationCode"], input[placeholder*="Enter code"]', 
        { timeout: 5000 }
      );
      
      if (account.totp_secret) {
        const twoFactorCode = await get2FACode(account.totp_secret);
        console.log(`🔑 2FA.LIVE ${account.username}: ${twoFactorCode}`);
        
        await page.type('input[aria-label*="code"], input[name="verificationCode"]', twoFactorCode);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log(`✅ No 2FA for ${account.username}`);
    }

    // Verify login success
    await page.waitForURL(/\/(home|\*\/)/, { timeout: 10000 });

    // Create post
    console.log(`📝 Creating post for ${account.username}...`);
    await page.click('a[href*="/newpost"], div[role="button"]:has-text("Post")');
    await page.waitForTimeout(2000);

    // Upload image
    const imagePath = `./images/akun${account.id}.jpg`;
    if (await fs.pathExists(imagePath)) {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(3000);
      }
    }

    // Type caption
    const captionSelectors = [
      'textarea[placeholder*="What"]',
      'textarea[placeholder*="happening"]', 
      'div[contenteditable="true"]',
      'textarea'
    ];
    
    for (const selector of captionSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.type(selector, account.caption, { delay: 50 });
        break;
      } catch (e) {
        continue;
      }
    }

    // Post button
    const postSelectors = [
      'button:has-text("Post")',
      'div[role="button"]:has-text("Post")',
      'button[type="submit"]'
    ];
    
    for (const selector of postSelectors) {
      try {
        await page.click(selector);
        await page.waitForTimeout(5000);
        break;
      } catch (e) {
        continue;
      }
    }

    console.log(`✅ SUCCESS ${account.username}: "${account.caption.slice(0, 50)}..."`);

  } catch (error) {
    console.error(`❌ FAILED ${account.username}:`, error.message);
    throw new Error(error.message);
  } finally {
    await browser.close();
  }
}
