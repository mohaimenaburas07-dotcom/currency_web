const http = require('http');

const options = {
  hostname: '10.30.1.20',
  port: 3000,
  path: '/api/smart-bank/customer/42044/accounts/query/',
  method: 'GET',
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${data}`);
  });
});

req.on('error', e => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
