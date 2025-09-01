#!/usr/bin/env node

/**
 * 🔧 External API Test Script
 * 
 * This script helps diagnose connection issues with the fishonxd.su API
 * and tests different approaches to resolve the 403 access denied error.
 */

const axios = require('axios');
require('dotenv').config({ path: './config.env' });

// Test configurations
const TEST_CONFIGS = [
  {
    name: 'Direct API Call',
    url: 'https://fishonxd.su/api/checks/guilds',
    headers: {}
  },
  {
    name: 'CORS Proxy (corsproxy.io)',
    url: 'https://corsproxy.io/?https://fishonxd.su/api/checks/guilds',
    headers: {}
  },
  {
    name: 'CORS Anywhere',
    url: 'https://cors-anywhere.herokuapp.com/https://fishonxd.su/api/checks/guilds',
    headers: {}
  },
  {
    name: 'AllOrigins',
    url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://fishonxd.su/api/checks/guilds'),
    headers: {}
  },
  {
    name: 'With User-Agent',
    url: 'https://fishonxd.su/api/checks/guilds',
    headers: {
      'User-Agent': 'DiscordChecker/1.0',
      'Accept': 'application/json'
    }
  },
  {
    name: 'With API Key (if configured)',
    url: 'https://fishonxd.su/api/checks/guilds',
    headers: {
      'Authorization': process.env.FISHONXD_API_KEY ? `Bearer ${process.env.FISHONXD_API_KEY}` : 'No API key configured',
      'User-Agent': 'DiscordChecker/1.0',
      'Accept': 'application/json'
    }
  }
];

async function testAPI(config) {
  console.log(`\n🔍 Testing: ${config.name}`);
  console.log(`📍 URL: ${config.url}`);
  console.log(`🔑 Headers:`, config.headers);
  
  try {
    const startTime = Date.now();
    const response = await axios.get(config.url, {
      timeout: 10000,
      headers: config.headers
    });
    const endTime = Date.now();
    
    console.log(`✅ SUCCESS - Status: ${response.status}`);
    console.log(`⏱️  Response time: ${endTime - startTime}ms`);
    console.log(`📊 Data length: ${JSON.stringify(response.data).length} characters`);
    
    if (response.data && typeof response.data === 'object') {
      console.log(`📋 Response keys:`, Object.keys(response.data));
    }
    
    return { success: true, status: response.status, time: endTime - startTime };
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📋 Error data:`, error.response.data);
      console.log(`🔍 Headers:`, error.response.headers);
    } else if (error.request) {
      console.log(`🌐 No response received`);
    }
    
    return { success: false, error: error.message, status: error.response?.status };
  }
}

async function runTests() {
  console.log('🚀 Starting External API Tests...');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const config of TEST_CONFIGS) {
    const result = await testAPI(config);
    results.push({ ...config, result });
    
    // Wait between tests to avoid rate limiting
    if (config !== TEST_CONFIGS[TEST_CONFIGS.length - 1]) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Working configurations:');
    successful.forEach(r => {
      console.log(`  • ${r.name} (${r.result.time}ms)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n🚨 Failed configurations:');
    failed.forEach(r => {
      console.log(`  • ${r.name}: ${r.result.error}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (successful.length > 0) {
    console.log('  • Use one of the working configurations above');
    console.log('  • Update your server.js to use the working approach');
  } else {
    console.log('  • All tests failed - the API may be completely down');
    console.log('  • Check if the service requires authentication');
    console.log('  • Contact the API provider for support');
    console.log('  • Consider implementing fallback data sources');
  }
  
  if (!process.env.FISHONXD_API_KEY) {
    console.log('  • Consider adding an API key if the service requires authentication');
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPI, runTests };
