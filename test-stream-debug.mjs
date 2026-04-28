async function testStream() {
  const url = 'http://localhost:3000/api/chat/stream';
  const payload = {
    user_id: 'test-user-id',
    messages: [{ role: 'user', content: 'Hello' }],
    session_id: 'new'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testStream();
