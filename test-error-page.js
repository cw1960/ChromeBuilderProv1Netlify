/**
 * Test script for the error page and error handling
 * This script tests the error page with different parameters to ensure it works properly
 */
const fetch = require('node-fetch');

// Import open using dynamic import for ESM compatibility
let openUrl;
async function importModules() {
  const open = await import('open');
  openUrl = open.default;
}

// Configuration
const BASE_URL = 'http://localhost:3336';
const ERROR_PAGE_URL = `${BASE_URL}/error`;
const SYSTEM_CHECK_URL = `${BASE_URL}/api/debug/system-check`;

// Test cases for the error page
const ERROR_TEST_CASES = [
  {
    name: 'Basic Error',
    params: 'message=Basic%20Error&code=500&type=server',
    description: 'Basic server error with minimal parameters'
  },
  {
    name: 'Not Found Error',
    params: 'message=Resource%20Not%20Found&code=404&type=not_found',
    description: 'Resource not found error'
  },
  {
    name: 'Database Error',
    params: 'message=Database%20Connection%20Failed&code=500&type=database',
    description: 'Database connection error'
  },
  {
    name: 'Validation Error',
    params: 'message=Invalid%20Input%20Data&code=400&type=validation',
    description: 'Input validation error'
  },
  {
    name: 'With Project ID',
    params: 'message=Project%20Load%20Error&code=500&type=server&projectId=0c4dedb4-b915-4f8d-a218-e71794c14782',
    description: 'Error with project ID'
  }
];

// Function to test the system check endpoint
async function testSystemCheck() {
  console.log('\n🧪 Testing system check endpoint...');
  
  try {
    const response = await fetch(SYSTEM_CHECK_URL);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Data: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      console.log('✅ System check endpoint is working');
      return true;
    } else {
      console.log('❌ System check endpoint returned an error');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to system check endpoint:', error.message);
    return false;
  }
}

// Function to test the error page
async function testErrorPage() {
  console.log('\n🧪 Testing error page with different parameters...');
  
  for (const testCase of ERROR_TEST_CASES) {
    console.log(`\nTest Case: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    
    const url = `${ERROR_PAGE_URL}?${testCase.params}`;
    console.log(`URL: ${url}`);
    
    try {
      await openUrl(url);
      console.log(`✅ Opened error page for: ${testCase.name}`);
    } catch (error) {
      console.error(`❌ Failed to open error page: ${error.message}`);
    }
    
    // Add a delay to allow viewing each test case
    console.log('Waiting 3 seconds before next test case...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

// Main test function
async function runTests() {
  console.log('🔍 Starting Error Page Test Suite');
  
  // First, import required ES modules
  await importModules();
  
  const systemCheckWorking = await testSystemCheck();
  console.log(`System Check Status: ${systemCheckWorking ? 'Online' : 'Offline'}`);
  
  await testErrorPage();
  
  console.log('\n🏁 Error Page tests completed');
  console.log('Check that all error pages displayed correctly in your browser');
  console.log('Remember to verify that:');
  console.log('- The error message is displayed correctly');
  console.log('- Recovery suggestions are appropriate for each error type');
  console.log('- System status indicator shows correctly');
  console.log('- Technical details can be shown/hidden');
  console.log('- Navigation buttons work correctly');
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
}); 