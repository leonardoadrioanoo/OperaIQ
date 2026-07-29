const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

async function run() {
  // First login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@operaiq.com', password: 'admin' }) // Using default admin
  });
  
  if (!loginRes.ok) {
    console.log('Login failed', loginRes.status);
    return;
  }
  
  const { session } = await loginRes.json();
  const token = session.access_token;
  
  // Create a dummy file
  fs.writeFileSync('test.txt', 'hello world');
  
  const formData = new FormData();
  formData.append('arquivo', fs.createReadStream('test.txt'));
  
  // Need a project ID. Let's list projects first.
  const pRes = await fetch('http://localhost:5000/api/projetos', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pData = await pRes.json();
  const projectId = pData.projetos[0]?.id;
  
  if (!projectId) {
    console.log('No project found');
    return;
  }
  
  console.log(`Uploading to project ${projectId}...`);
  
  const uploadRes = await fetch(`http://localhost:5000/api/projetos/${projectId}/upload-midia`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    },
    body: formData
  });
  
  const uploadText = await uploadRes.text();
  console.log('Upload response:', uploadRes.status, uploadText);
}

run();
