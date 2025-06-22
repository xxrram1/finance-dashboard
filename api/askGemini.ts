// file: api/askGemini.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export const config = {
  runtime: 'edge',
};

// Helper function to convert a file to a Base64 string
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
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
    // CHANGED: อัปเกรดโมเดลเป็น 1.5 Pro เพื่อความสามารถสูงสุด
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const textPart = { text: prompt || "อธิบายรูปภาพนี้" }; // Provide a default prompt if only image is sent
    const imagePart = file ? [await fileToGenerativePart(file)] : [];
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [textPart, ...imagePart] }],
    });
    
    const text = result.response.text();

    return new Response(JSON.stringify({ answer: text }), { status: 200 });

  } catch (error) {
    console.error("Error in askGemini handler:", error);
    return new Response(JSON.stringify({ error: "Failed to process request to Gemini" }), { status: 500 });
  }
}