#!/usr/bin/env node

/**
 * Test script for the robust error handling solution
 * 
 * This script tests the various robust API endpoints to verify they are working correctly.
 * 
 * Usage:
 * 1. Start the development server: npm run dev
 * 2. Run this script: node test-robust-solution.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3336';
const NONEXISTENT_PROJECT_ID = '00000000-0000-0000-0000-000000000000';
const INVALID_FORMAT_PROJECT_ID = 'not-a-valid-uuid';

// Main function to run tests
async function runTests() {
  console.log('Starting tests...\n');
  
  // First, check if we can get valid project ID from the system
  let VALID_PROJECT_ID;
  
  try {
    console.log('Checking for existing projects...');
    const systemCheckResponse = await fetch(`${BASE_URL}/api/debug/system-check`);
    const systemCheckData = await systemCheckResponse.json();
    
    if (systemCheckData.status && systemCheckData.status.database && systemCheckData.status.database.projectsCount > 0) {
      console.log(`Found ${systemCheckData.status.database.projectsCount} projects in database`);
      
      // Try to get a project from the dashboard - this is a hack but should work
      const dashboardResponse = await fetch(`${BASE_URL}/api/projects/list`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        if (dashboardData.projects && dashboardData.projects.length > 0) {
          VALID_PROJECT_ID = dashboardData.projects[0].id;
          console.log(`Using valid project ID from API: ${VALID_PROJECT_ID}`);
        }
      }
    }
    
    if (!VALID_PROJECT_ID) {
      console.log('Could not find a valid project ID from the API, using hardcoded one');
      VALID_PROJECT_ID = 'cf534ccf-5e16-4783-84d0-d8c14f94814f';
    }
  } catch (error) {
    console.log('Error checking for projects:', error.message);
    VALID_PROJECT_ID = 'cf534ccf-5e16-4783-84d0-d8c14f94814f';
  }
  
  console.log(`Using project ID for tests: ${VALID_PROJECT_ID}\n`);
  
  // Test cases
  const tests = [
    {
      name: 'System Check',
      url: `${BASE_URL}/api/debug/system-check`,
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => {
        console.log(`  Database status: ${data.status.database.status}`);
        console.log(`  Projects count: ${data.status.database.projectsCount}`);
        console.log(`  Conversations count: ${data.status.database.conversationsCount}`);
        return data.status && data.status.database;
      }
    },
    {
      name: 'Direct Project Access (Valid ID)',
      url: `${BASE_URL}/api/projects/direct-get-project?projectId=${VALID_PROJECT_ID}`,
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => {
        console.log(`  Project name: ${data.project?.name || 'N/A'}`);
        return data.project && data.project.id === VALID_PROJECT_ID;
      }
    },
    {
      name: 'Direct Project Access (Invalid Format ID)',
      url: `${BASE_URL}/api/projects/direct-get-project?projectId=${INVALID_FORMAT_PROJECT_ID}`,
      method: 'GET',
      expectedStatus: 400,
      validate: (data) => {
        console.log(`  Error message: ${data.message}`);
        return data.message && data.message.includes('Invalid');
      }
    },
    {
      name: 'Direct Project Access (Nonexistent ID)',
      url: `${BASE_URL}/api/projects/direct-get-project?projectId=${NONEXISTENT_PROJECT_ID}`,
      method: 'GET',
      expectedStatus: 404,
      validate: (data) => {
        console.log(`  Error message: ${data.message}`);
        return data.message && data.message.includes('not found');
      }
    },
    {
      name: 'Robust Project Access (Valid ID)',
      url: `${BASE_URL}/api/projects/robust-get-project?projectId=${VALID_PROJECT_ID}`,
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => {
        console.log(`  Project name: ${data.project?.name || 'N/A'}`);
        return data.project && data.project.id === VALID_PROJECT_ID;
      }
    },
    {
      name: 'Robust Conversations List',
      url: `${BASE_URL}/api/conversations/robust-list?projectId=${VALID_PROJECT_ID}`,
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => {
        console.log(`  Conversations count: ${data.conversations?.length || 0}`);
        return data.conversations !== undefined;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`Running test: ${test.name}`);
    
    try {
      const response = await fetch(test.url, { method: test.method });
      const status = response.status;
      const data = await response.json();
      
      console.log(`  Status: ${status} (Expected: ${test.expectedStatus})`);
      
      if (status === test.expectedStatus && test.validate(data)) {
        console.log('  ✅ PASSED');
        passed++;
      } else {
        console.log('  ❌ FAILED');
        console.log('  Response:', JSON.stringify(data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Print summary
  console.log('Test Summary:');
  console.log(`  Total: ${tests.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed! The robust error handling solution is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the logs above for details.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
}); 