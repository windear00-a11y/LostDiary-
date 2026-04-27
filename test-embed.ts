import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.embedContent({ model: 'text-embedding-004', contents: 'Hello' });
    console.log(Object.keys(res));
    if (res.embeddings && res.embeddings[0].values) console.log('values length:', res.embeddings[0].values.length);
  } catch (e) {
    console.error(e);
  }
}
run();
