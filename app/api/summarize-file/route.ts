
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadFileToGCS } from "../../services/logic/gcs_upload";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Only .txt files are allowed" },
        { status: 400 }
      );
    }

    const fileContent = await file.text();

    if (!fileContent) {
        return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // 1. Generate Summary using Gemini
    console.log("Starting Gemini generation...");
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    console.log(`Using Gemini model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Please summarize the following text:\n\n${fileContent}`;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    console.log("Gemini generation successful.");

    // 2. Upload to Google Cloud Storage
    const buffer = Buffer.from(fileContent);
    const uploadResult = await uploadFileToGCS(buffer, file.name, "text/plain");

    if (!uploadResult) {
        return NextResponse.json({ 
            summary, 
            message: "Summary generated, but file upload failed or skipped." 
        });
    }

    return NextResponse.json({
      summary: summary,
      download_link: uploadResult.url,
    });

  } catch (error: any) {
    console.error("Error processing file:", error);
    // Log detailed error structure if available
    if (error.response) {
        console.error("Error details:", JSON.stringify(error.response, null, 2));
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
