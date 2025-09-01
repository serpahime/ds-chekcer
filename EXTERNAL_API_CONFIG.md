# 🔧 External API Configuration Guide

## ❌ Current Issue: 403 Access Denied

Your application is receiving a **403 "Доступ запрещён" (Access Denied)** error from the external API `fishonxd.su`.

## 🔍 Root Causes

The 403 error typically indicates one of these issues:

1. **Missing API Key** - The service requires authentication
2. **Rate Limiting** - Too many requests in a short time
3. **IP Blocking** - Your server IP is blocked
4. **CORS Issues** - Cross-origin request restrictions
5. **Service Restrictions** - The API service is down or restricted

## 🛠️ Solutions

### Solution 1: Add API Authentication (Recommended)

If `fishonxd.su` requires an API key:

1. **Contact the service provider** to get an API key
2. **Add to your `config.env`**:
```env
# External API Configuration
FISHONXD_API_KEY=your_api_key_here
FISHONXD_API_URL=https://fishonxd.su
```

3. **Update the API calls** in `server.js` to include headers:
```javascript
const response = await axios.get(`https://corsproxy.io/?https://fishonxd.su/api/checks/user/${discordId}`, {
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${process.env.FISHONXD_API_KEY}`,
    'User-Agent': 'DiscordChecker/1.0'
  }
});
```

### Solution 2: Implement Retry Logic

Add retry mechanisms with exponential backoff:

```javascript
const retryRequest = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.response?.status === 403) {
        // Wait longer for 403 errors
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } else {
        // Wait shorter for other errors
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};
```

### Solution 3: Use Alternative CORS Proxy

Try different CORS proxy services:

```javascript
// Option 1: cors-anywhere
const response = await axios.get(`https://cors-anywhere.herokuapp.com/https://fishonxd.su/api/checks/user/${discordId}`);

// Option 2: allorigins
const response = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://fishonxd.su/api/checks/user/${discordId}`)}`);

// Option 3: No proxy (if CORS is fixed)
const response = await axios.get(`https://fishonxd.su/api/checks/user/${discordId}`);
```

### Solution 4: Implement Fallback Data

Provide fallback functionality when the external API is unavailable:

```javascript
// In your search endpoint
if (!trackedUser) {
  try {
    // Try external API first
    const response = await axios.get(/* ... */);
    // ... process response
  } catch (apiError) {
    if (apiError.response?.status === 403) {
      // Create basic user data from Discord ID
      trackedUser = new TrackedUser({
        discordId: discordId,
        username: `User_${discordId}`,
        status: 'unknown',
        activity: { views: 0, messageCount: 0, voiceTime: '0ч' }
      });
      console.log('⚠️ Using fallback user data due to API access denied');
    } else {
      throw apiError;
    }
  }
}
```

## 🔧 Immediate Actions

1. **Check the service status** - Visit `https://fishonxd.su` to see if it's operational
2. **Contact support** - Reach out to the API provider about access requirements
3. **Check your IP** - Ensure your server IP isn't blocked
4. **Review rate limits** - Check if you're exceeding request limits

## 📊 Monitoring

Add logging to track API failures:

```javascript
// Add to your error handling
console.log('🚨 API Failure Stats:', {
  timestamp: new Date().toISOString(),
  endpoint: '/api/checks/user',
  status: apiError.response?.status,
  message: apiError.response?.data?.error,
  userAgent: req.headers['user-agent'],
  ip: req.ip
});
```

## 🚀 Next Steps

1. **Implement the error handling** (already done in this update)
2. **Add API key configuration** if required
3. **Implement retry logic** for better reliability
4. **Add fallback data** for offline scenarios
5. **Monitor API health** and implement alerts

## 📞 Support

If you continue experiencing issues:
- Check the API provider's documentation
- Verify your server's IP address and location
- Consider implementing a different data source
- Add comprehensive error logging for debugging
