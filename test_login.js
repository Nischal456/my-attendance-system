import http from 'http';

const data = JSON.stringify({ email: 'geckoworks.work@gmail.com', password: 'password123' }); // Try default creds

const req = http.request('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    console.log("Login Status:", res.statusCode);
    const cookies = res.headers['set-cookie'];
    console.log("Cookies:", cookies);
    if (!cookies) return;
    
    // Now request /hr/dashboard
    const tokenCookie = cookies[0].split(';')[0];
    const req2 = http.request('http://localhost:3000/hr/dashboard', {
      headers: { 'Cookie': tokenCookie }
    }, (res2) => {
      console.log("Dashboard Status:", res2.statusCode);
      if (res2.statusCode !== 200) console.log("Headers:", res2.headers);
    });
    req2.end();
  });
});
req.write(data);
req.end();
