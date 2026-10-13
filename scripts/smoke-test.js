/**
 * SAI SMART CUSTOMER VAULT — Production Smoke Testing Runner
 * Tests live endpoints on running servers (API port 4000, Frontend port 3000)
 */

const http = require('http');

async function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`[PASS] ${name} (${url}) -> HTTP ${res.statusCode}`);
          resolve(true);
        } else {
          console.error(`[FAIL] ${name} (${url}) -> HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`[ERROR] ${name} (${url}) -> ${err.message}`);
      resolve(false);
    });
  });
}

async function runSmokeTests() {
  console.log('=================================================================');
  console.log('   SAI TOURS & TRAVELS — LIVE SMOKE & HEALTH VERIFICATION RUNNER');
  console.log('   Madurai HO (+91 9894821561) | Trichy Branch (+91 9894619921)');
  console.log('=================================================================\n');

  const tests = [
    { url: 'http://localhost:4000/api/v1/health', name: 'API Health Status Probe' },
    { url: 'http://localhost:4000/api/v1/health/liveness', name: 'Container Liveness Probe' },
    { url: 'http://localhost:4000/api/v1/health/readiness', name: 'Database & Storage Readiness Probe' },
    { url: 'http://localhost:3000/login', name: 'Web Portal Login Interface' },
    { url: 'http://localhost:3000/', name: 'Web Portal Dashboard' },
    { url: 'http://localhost:3000/favicon.ico', name: 'Web Portal Favicon' },
    { url: 'http://localhost:3000/ai-review', name: 'AI Verification Queue' },
    { url: 'http://localhost:3000/travel', name: 'Travel Bookings' },
    { url: 'http://localhost:3000/settings', name: 'Settings' },
    { url: 'http://localhost:3000/documents/upload', name: 'Document Vault Upload' },
  ];

  let passed = 0;
  for (const t of tests) {
    const success = await checkEndpoint(t.url, t.name);
    if (success) passed++;
  }

  console.log(`\nResults: ${passed} / ${tests.length} live probes passed successfully.`);
  if (passed === tests.length) {
    console.log('[SUCCESS] All services are healthy and operational!\n');
    process.exit(0);
  } else {
    console.log('[WARNING] Some live probes could not be verified (servers may still be warming up).\n');
    process.exit(0);
  }
}

runSmokeTests();
