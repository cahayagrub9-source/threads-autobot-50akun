import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { postToThreads } from './poster.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let accounts = [];

// Load accounts
async function loadAccounts() {
  try {
    accounts = await fs.readJson('accounts.json');
    console.log(`📊 Loaded ${accounts.length} accounts`);
  } catch {
    accounts = [];
  }
}

// Save accounts
async function saveAccounts() {
  await fs.writeJson('accounts.json', accounts, { spaces: 2 });
}

// CRON JOB - Check every minute
cron.schedule('* * * * *', async () => {
  console.log('🔄 [2FA.LIVE CRON] Checking schedules...');
  const now = new Date();
  
  for (let account of accounts) {
    if (!account.posted) {
      const scheduleTime = new Date(account.schedule);
      if (now >= scheduleTime) {
        try {
          console.log(`📤 [${now.toLocaleTimeString('id-ID')}] Posting ${account.username}...`);
          await postToThreads(account);
          
          account.posted = true;
          account.status = 'posted';
          account.postedAt = now.toISOString();
          await saveAccounts();
          console.log(`✅ SUCCESS ${account.username} posted!`);
        } catch (error) {
          account.status = 'error';
          account.lastError = error.message;
          await saveAccounts();
          console.error(`❌ ERROR ${account.username}: ${error.message}`);
        }
      }
    }
  }
});

// API Routes
app.get('/api/accounts', async (req, res) => {
  await loadAccounts();
  res.json(accounts);
});

app.post('/api/accounts', async (req, res) => {
  accounts = req.body;
  await saveAccounts();
  res.json({ success: true });
});

app.post('/api/reset/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const account = accounts.find(a => a.id === id);
  if (account) {
    account.posted = false;
    account.status = 'waiting';
    await saveAccounts();
    res.json({ success: true });
  }
});

// Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', accounts: accounts.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Threads AutoBot 2FA.LIVE running on port ${PORT}`);
  await loadAccounts();
});
