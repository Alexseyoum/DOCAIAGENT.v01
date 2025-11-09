/**
 * Comprehensive deployment test for Document Processing Agent
 * Tests all API endpoints to identify what's broken after deployment
 */

const API_BASE = 'https://docaiagent-v01.onrender.com/api/v1';
let authToken = null;

async function testEndpoint(name, fn) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('='.repeat(60));
  try {
    const result = await fn();
    console.log('✅ PASSED:', JSON.stringify(result, null, 2).slice(0, 500));
    return { name, status: 'PASS', result };
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Error details:', error.response ? JSON.stringify(error.response, null, 2).slice(0, 500) : error);
    return { name, status: 'FAIL', error: error.message };
  }
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Request failed');
    error.response = data;
    throw error;
  }

  return data;
}

async function runTests() {
  console.log('🚀 Document Processing Agent - Deployment Diagnostic');
  console.log('🌐 API Base:', API_BASE);
  console.log('⏰ Started at:', new Date().toISOString());

  const results = [];

  // Test 1: Health Check
  results.push(await testEndpoint('Health Check (Public)', async () => {
    const response = await fetch('https://docaiagent-v01.onrender.com/health');
    return await response.json();
  }));

  // Test 2: Register User
  results.push(await testEndpoint('User Registration', async () => {
    const email = `test_${Date.now()}@example.com`;
    const data = await makeRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'TestPassword123',
        name: 'Test User'
      })
    });

    authToken = data.data.token;
    return { registered: true, hasToken: !!authToken };
  }));

  // Test 3: Login
  results.push(await testEndpoint('User Login', async () => {
    const response = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@test.com',
        password: 'testpass123'
      })
    });
    return { loggedIn: true };
  }));

  // Test 4: List Documents (Empty)
  results.push(await testEndpoint('List Documents (Empty)', async () => {
    return await makeRequest(`${API_BASE}/documents`);
  }));

  // Test 5: Upload Document (Text file as test)
  results.push(await testEndpoint('Upload Text Document', async () => {
    const formData = new FormData();
    const blob = new Blob(['This is a test document about machine learning and artificial intelligence.'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error?.message || 'Upload failed');
      error.response = data;
      throw error;
    }

    return data;
  }));

  // Test 6: Get Document (if upload succeeded)
  if (results[results.length - 1].status === 'PASS') {
    const documentId = results[results.length - 1].result?.data?.documentId;
    if (documentId) {
      results.push(await testEndpoint('Get Document Details', async () => {
        return await makeRequest(`${API_BASE}/documents/${documentId}`);
      }));

      // Test 7: Process Document (Extract Text)
      results.push(await testEndpoint('Process Document (Extract Text)', async () => {
        return await makeRequest(`${API_BASE}/documents/${documentId}/process`, {
          method: 'POST'
        });
      }));

      // Test 8: Generate Summary
      results.push(await testEndpoint('Generate Summary', async () => {
        return await makeRequest(`${API_BASE}/generate/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId,
            summaryType: 'brief'
          })
        });
      }));

      // Test 9: Generate Quiz
      results.push(await testEndpoint('Generate Quiz', async () => {
        return await makeRequest(`${API_BASE}/generate/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId,
            questionCount: 3,
            questionTypes: ['multiple_choice']
          })
        });
      }));

      // Test 10: Generate Flashcards
      results.push(await testEndpoint('Generate Flashcards', async () => {
        return await makeRequest(`${API_BASE}/generate/flashcards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId,
            cardCount: 5
          })
        });
      }));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status === 'PASS' ? '✅' : '❌'} ${result.name}`);
    if (result.status === 'FAIL') {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n⏰ Completed at:', new Date().toISOString());
}

runTests().catch(console.error);
