const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const accountsPath = path.join(process.cwd(), '../accounts.json');
  
  try {
    if (event.httpMethod === 'GET') {
      let accounts = [];
      try {
        const data = await fs.readFile(accountsPath, 'utf8');
        accounts = JSON.parse(data);
      } catch {}
      
      return {
        statusCode: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify(accounts)
      };
    }
    
    if (event.httpMethod === 'POST') {
      const accounts = JSON.parse(event.body);
      await fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      };
    }
    
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
