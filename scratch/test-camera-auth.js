const http = require('http');

const req = http.get('http://10.12.21.11/images/snapshot.jpg', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});
