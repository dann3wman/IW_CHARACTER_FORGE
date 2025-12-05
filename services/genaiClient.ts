import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;
let activeApiKey: string | null = null;

export const setGeminiApiKey = (apiKey: string | null) => {
  if (apiKey !== activeApiKey) {
    client = null;
  }
  activeApiKey = apiKey;
};

const getGeminiApiKey = () => {
  return activeApiKey || process.env.GEMINI_API_KEY || null;
};

export const getGeminiClient = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
};
