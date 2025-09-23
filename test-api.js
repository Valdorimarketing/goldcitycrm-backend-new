const fetch = require('node-fetch');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGl5aWZpeWF0LmNvbSIsInN1YiI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU3ODA1MzE3LCJleHAiOjE3NTc4OTE3MTd9.gNAi1pnpYWVK3D7NX_JMf3TOuW910BGpl7Ao8pUpvIg';

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/doctors/by-hospital-and-branch?hospitalId=1&branchId=129', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
