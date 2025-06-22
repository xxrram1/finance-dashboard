// file: api/askGemini.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export const config = {
  runtime: 'edge',
};

async function fileToGenerativePart(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    return {
        inlineData: {
            data: Buffer.from(arrayBuffer).toString("base64"),
            mimeType: file.type,
        },
    };
}

export default async function handler(request: Request) {
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in Vercel" }), { status: 500 });
  }

  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const file = formData.get('file') as File | null;
    
    if (!prompt && !file) {
      return new Response(JSON.stringify({ error: "Prompt or file is required" }), { status: 400 });
    }
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // UPDATED: Relaxed safety settings to avoid blocking harmless content
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];
    
    const textPart = { text: prompt || "อธิบายรูปภาพนี้" };
    const imagePart = file ? [await fileToGenerativePart(file)] : [];
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [textPart, ...imagePart] }],
        safetySettings, // Apply the new safety settings
    });
    
    // Check if the response was blocked
    if (!result.response) {
      throw new Error("The response from Gemini was blocked due to safety settings.");
    }

    const text = result.response.text();
    return new Response(JSON.stringify({ answer: text }), { status: 200 });

  } catch (error: any) {
    console.error("Error in askGemini handler:", error);
    // Provide a more specific error message if available
    const errorMessage = error.message || "Failed to process request to Gemini";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}