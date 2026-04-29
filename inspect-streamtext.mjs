import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: 'fake-key',
});

try {
  const result = streamText({
    model: google('gemini-3-flash-preview'),
    prompt: 'test',
  });

  console.log('Result constructor name:', result.constructor.name);
  console.log('Own Keys:', Object.getOwnPropertyNames(result));
  console.log('Prototype Keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
  
  if (result.fullStream) {
     console.log('fullStream is available');
     // We can't easily wait for it without real model, but we can check types.
  }
} catch (e) {
  // Even if it throws, if result was partially assigned? No.
  console.error("Error during streamText:", e.message);
}
