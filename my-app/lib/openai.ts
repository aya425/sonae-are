import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // 必要なら timeout をここで調整
  // OpenAI公式SDKのデフォルトタイムアウトは10分
});
