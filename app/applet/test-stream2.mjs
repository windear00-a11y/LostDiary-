import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'test-user-id',
      session_id: 'test-session-id',
      messages: [{ role: 'user', content: 'hello' }]
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test();
