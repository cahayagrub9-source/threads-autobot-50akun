const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const id = event.path.match(/reset\/(\d+)/)?.[1];
  if (!id) return { statusCode: 400, body: 'ID required' };
  
  const accountsPath = path.join(process.cwd(), '../accounts.json');
  
  try {
    let accounts = [];
    try {
      const data = await fs.readFile(accountsPath, 'utf8');
      accounts = JSON.parse(data);
    } catch {}
    
    const accountIndex = accounts.findIndex(a => a.id == id);
    if (accountIndex !== -1) {
      accounts[accountIndex].status = 'waiting';
      accounts[accountIndex].lastError = '';
      accounts[accountIndex].postedAt = '';
      await fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
