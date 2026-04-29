import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var _openaiClient: OpenAI | undefined;
}

export const openai: OpenAI =
  global._openaiClient ??
  (global._openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }));
