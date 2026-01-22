"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// --- TypeScript Interfaces ---

export interface TranscriptSegment {
  speakername: string;
  content: string;
  timestamp: string;
}

export interface MOMItem {
  type: string; // e.g., decision, action, or insight
  content: string;
}

export interface TaskItem {
  title: string;
  description: string;
  priority: string;
  tags: string[];
}

export interface MeetingAnalysisResult {
  title: string;
  summary: string;
  transcript: TranscriptSegment[];
  mom: MOMItem[];
  tags: string[];
  category: string;
  tasks: TaskItem[];
  confidence_level: number;
}

// --- Schema Definition ---

const schema = {
  description: "Meeting analysis schema",
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "A concise title for the meeting" },
    summary: { type: SchemaType.STRING, description: "A short summary of the meeting discussion" },
    transcript: {
      type: SchemaType.ARRAY,
      description: "The full transcript with speaker identification",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          speakername: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
          timestamp: { type: SchemaType.STRING },
        },
        required: ["speakername", "content", "timestamp"],
      },
    },
    mom: {
      type: SchemaType.ARRAY,
      description: "Minutes of the meeting including decisions and actions",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "Must be exactly one of: 'action', 'decision', 'info'" },
          content: { type: SchemaType.STRING },
        },
        required: ["type", "content"],
      },
    },
    tags: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
      description: "Relevant tags for the meeting" 
    },
    category: { type: SchemaType.STRING, description: "General category (e.g., Engineering, Sales)" },
    tasks: {
      type: SchemaType.ARRAY,
      description: "Actionable tasks identified in the meeting",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, description: "High, Medium, or Low" },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["title", "priority"],
      },
    },
    confidence_level: { type: SchemaType.NUMBER, description: "Confidence score of the analysis (0-100) based on transcript clarity and content extraction reliability" },
  },
  required: ["title", "summary", "mom", "tasks", "tags", "category", "transcript", "confidence_level"],
};

// --- Main Function ---

export async function processMeetingTranscript(rawTranscript: string): Promise<MeetingAnalysisResult> {
    const apiKey : string = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
        throw new Error("API Key is required for processing transcript.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 1.5 Flash for speed and efficiency with transcripts
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
        },
    });

    const prompt = `
        Analyze the following meeting transcript to extract structured data.
        
        Transcript:
        ${rawTranscript}

        Instructions:
        1. Extract the transcript segments with approximate timestamps.
        2. Write a concise summary of the entire discussion.
        3. Generate Minutes of Meeting (MOM). For each item, assign a 'type' which MUST be one of: 'action', 'decision', or 'info'.
        4. Categorize the meeting (e.g., specific department or topic) and provide relevant tags.
        5. Identify specific, actionable tasks. Assign a priority (High, Medium, Low) to each.
        6. Provide a confidence level (0-100) for the analysis based on the clarity of the transcript and the certainty of the extracted information.
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return JSON.parse(responseText) as MeetingAnalysisResult;
    } catch (error) {
        console.error("Error processing transcript:", error);
        throw new Error("Failed to process transcript. Please check the API key and transcript content.");
    }
}