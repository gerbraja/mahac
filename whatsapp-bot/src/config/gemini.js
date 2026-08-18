import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiInstance = null;

export function getGeminiInstance() {
  if (aiInstance) {
    return aiInstance;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY no está definida en las variables de entorno.');
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}
