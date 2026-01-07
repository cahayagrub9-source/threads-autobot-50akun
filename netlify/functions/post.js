exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  // TEST DATA Bernice.Paxton24
  const account = {
    id: 1,
    username: "Bernice.Paxton24",
    password: "freedom123", 
    totp_secret: "G76NKKCIXYZNEVG5U653ZZ5ZTHWSKD4",
    caption: "Test post dari Threads AutoBot! 🚀 #autobot #netlify",
    status: "posted"
  };
  
  try {
    console.log(`🧪 TEST POST: ${account.username}`);
    
    // Simulate 2FA
    const totpRes = await fetch(`https://2fa.live/api/${account.totp_secret}`);
    const totpData = await totpRes.json();
    
    // Simulate Threads post
    console.log(`✅ 2FA Code: ${totpData.token}`);
    console.log(`✅ Posted: "${account.caption}"`);
    
    // Update status (dashboard akan detect)
    account.status = "posted";
    account.postedAt = new Date().toISOString();
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: `🧪 TEST SUCCESS ${account.username}! 2FA: ${totpData.token}`,
        account
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
