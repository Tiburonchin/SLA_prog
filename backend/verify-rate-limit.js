const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/trabajadores',
  method: 'GET',
};

let success = 0;
let rateLimited = 0;
let errors = 0;

const totalRequests = 40;
let completed = 0;

console.log(`Sending ${totalRequests} requests to the backend...`);

for (let i = 0; i < totalRequests; i++) {
  const req = http.request(options, (res) => {
    if (res.statusCode === 200) success++;
    else if (res.statusCode === 429) rateLimited++;
    else if (res.statusCode === 401) success++; // We expect 401 without token, but rate limit (429) triggers before 401 usually.
    else {
      console.log('Unexpected status:', res.statusCode);
      errors++;
    }

    res.on('data', () => {}); // Consume data

    res.on('end', () => {
      completed++;
      if (completed === totalRequests) {
        console.log(`\nResults:`);
        console.log(`Success / Allowed (200/401): ${success}`);
        console.log(`Rate Limited (429): ${rateLimited}`);
        console.log(`Errors: ${errors}`);
        if (rateLimited === 0) {
          console.log(`\nVERIFICATION PASSED: No rate limit hits for ${totalRequests} requests.`);
        } else {
          console.log(`\nVERIFICATION FAILED: Hit rate limit.`);
        }
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    errors++;
    completed++;
  });

  req.end();
}
