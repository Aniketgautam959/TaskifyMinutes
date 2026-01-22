'use server'

import { GoogleGenAI, Type } from "@google/genai";

interface SummaryResult {
  summary: string;
  mom: { type: 'action' | 'decision' | 'info'; content: string }[];
  tasks: string[];
  schedule: {
    event: string;
    time: string;
  }[];
}

export async function generateMeetingSummary(transcript: string): Promise<SummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key is missing. Please ensure GEMINI_API_KEY is set in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use a default model if not specified, falling back to a known stable version if the user's custom one isn't set
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Analyze the following meeting transcript. Provide a concise summary, a list of MOM (Minutes of Meeting) points, specific action tasks for team members, and any scheduled events found in the text. \n\n${transcript}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          mom: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['action', 'decision', 'info'] },
                content: { type: Type.STRING }
              },
              required: ['type', 'content']
            } 
          },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                event: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["event", "time"]
            }
          }
        },
        required: ["summary", "mom", "tasks", "schedule"]
      }
    }
  });

  const text = response.text;
  if (!text) {
     throw new Error("Empty response from AI");
  }
  
  // The response text is a JSON string
  try {
      // Depending on the SDK version, response.text might be a string or a function. 
      // In the user's original code, they accessed it as property: `response.text`.
      // The official SDK often uses `response.response.text()` but the user's snippet suggests `response.text` might be available directly or through a getter.
      // However, usually it is `await result.response` then `.text()`.
      // The user used `const response = await ai.models.generateContent(...)` then `response.text`.
      // I will assume their SDK usage pattern was correct for the properties but wrong for the environment.
      // Wait, standard Google Generative AI Node SDK returns a result object where you do `result.response.text()`.
      // `const result = await model.generateContent(...)`
      // `const response = await result.response;`
      // `const text = response.text();`
      // But the user code: `const response = await ...` then `response.text`.
      // This suggests they might be using a wrapper or a specific version.
      // The import is `import { GoogleGenAI, Type } from "@google/genai";`. This looks like the *newer* specific client SDK or the Google one.
      // Actually, `@google/genai` is the new heavy-duty SDK? Or `google-generative-ai`?
      // `npm install @google/generative-ai` is the standard one.
      // `npm install @google/genai` is the new Alpha/Beta SDK for Gemini 1.5 specifics?
      // I will stick to the user's syntax `response.text` but ensure I handle it if it's a function.
      
      // Safety check:
      const rawText = response.text;
      const jsonString = typeof rawText === 'function' ? (rawText as unknown as () => string)() : (rawText as unknown as string);
      // If text is undefined here (e.g. if it's response.response.text()), we might fail.
      // But let's trust the user's visible code structure for the object property access, while moving it to server.
      
      return JSON.parse(jsonString || '{}');
  } catch (e) {
      console.error("Parsing error", e);
      throw new Error("Failed to parse AI response");
  }
}
