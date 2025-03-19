/**
 * Test script for error handling solution
 * 
 * This script tests various aspects of the error handling solution:
 * 1. System check endpoint
 * 2. Direct project access
 * 3. Robust API endpoints
 * 4. Error page functionality
 */

const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const BASE_URL = 'http://localhost:3336';
const TEST_PROJECT_ID = 'cf534ccf-5e16-4783-84d0-d8c14f94814f'; // Updated with a valid project ID
const INVALID_PROJECT_ID = 'invalid-project-id';

// Helper functions
const log = {
  info: (msg) => console.log(chalk.blue('INFO:'), msg),
  success: (msg) => console.log(chalk.green('SUCCESS:'), msg),
  error: (msg) => console.log(chalk.red('ERROR:'), msg),
  warning: (msg) => console.log(chalk.yellow('WARNING:'), msg),
  section: (title) => console.log('\n' + chalk.bold.cyan('===== ' + title + ' ====='))
};

async function testEndpoint(url, options = {}) {
  log.info(`Testing endpoint: ${url}`);
  try {
    const response = await fetch(url, options);
    const status = response.status;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { status, data, ok: response.ok };
    } else {
      const text = await response.text();
      return { status, text, ok: response.ok };
    }
  } catch (error) {
    log.error(`Failed to fetch ${url}: ${error.message}`);
    return { status: 0, error: error.message, ok: false };
  }
}

// Main test function
async function runTests() {
  log.section('Starting Error Handling Tests');
  
  // Test 1: System Check
  log.section('Testing System Check Endpoint');
  const systemCheck = await testEndpoint(`${BASE_URL}/api/debug/system-check`);
  
  if (systemCheck.ok) {
    log.success('System check endpoint is working');
    console.log('Database status:', systemCheck.data.status.database.status);
    console.log('Projects count:', systemCheck.data.status.database.projectsCount);
    console.log('Conversations count:', systemCheck.data.status.database.conversationsCount);
  } else {
    log.error('System check endpoint failed');
    console.log(systemCheck);
  }
  
  // Test 2: Direct Project Access
  log.section('Testing Direct Project Access');
  
  // Valid project ID
  log.info('Testing with valid project ID');
  const validProject = await testEndpoint(`${BASE_URL}/api/projects/direct-get-project?projectId=${TEST_PROJECT_ID}`);
  
  if (validProject.ok) {
    log.success('Direct project access is working for valid project ID');
    console.log('Project name:', validProject.data.project.name);
    console.log('Conversations count:', validProject.data.conversations.length);
  } else {
    log.error('Direct project access failed for valid project ID');
    console.log(validProject);
  }
  
  // Invalid project ID
  log.info('Testing with invalid project ID');
  const invalidProject = await testEndpoint(`${BASE_URL}/api/projects/direct-get-project?projectId=${INVALID_PROJECT_ID}`);
  
  if (!invalidProject.ok && invalidProject.status === 404) {
    log.success('Direct project access correctly returns 404 for invalid project ID');
  } else {
    log.error('Direct project access did not handle invalid project ID correctly');
    console.log(invalidProject);
  }
  
  // Test 3: Robust API Endpoints
  log.section('Testing Robust API Endpoints');
  
  // Robust project endpoint
  log.info('Testing robust project endpoint');
  const robustProject = await testEndpoint(`${BASE_URL}/api/projects/robust-get-project?projectId=${TEST_PROJECT_ID}`);
  
  if (robustProject.ok) {
    log.success('Robust project endpoint is working');
  } else {
    log.error('Robust project endpoint failed');
    console.log(robustProject);
  }
  
  // Robust conversations list endpoint
  log.info('Testing robust conversations list endpoint');
  const robustConversations = await testEndpoint(`${BASE_URL}/api/conversations/robust-list?projectId=${TEST_PROJECT_ID}`);
  
  if (robustConversations.ok) {
    log.success('Robust conversations list endpoint is working');
    console.log('Conversations count:', robustConversations.data.conversations.length);
  } else {
    log.error('Robust conversations list endpoint failed');
    console.log(robustConversations);
  }
  
  log.section('Tests Completed');
  
  // Summary
  log.section('Test Summary');
  console.log('System check:', systemCheck.ok ? chalk.green('PASS') : chalk.red('FAIL'));
  console.log('Direct project access (valid):', validProject.ok ? chalk.green('PASS') : chalk.red('FAIL'));
  console.log('Direct project access (invalid):', (!invalidProject.ok && invalidProject.status === 404) ? chalk.green('PASS') : chalk.red('FAIL'));
  console.log('Robust project endpoint:', robustProject.ok ? chalk.green('PASS') : chalk.red('FAIL'));
  console.log('Robust conversations list:', robustConversations.ok ? chalk.green('PASS') : chalk.red('FAIL'));
}

// Run the tests
runTests().catch(error => {
  log.error('Test script failed:');
  console.error(error);
}); 