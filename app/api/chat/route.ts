import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { prompt, subject, imageBase64, imageMimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { response: `[${subject}] Gemini API key missing. Please check Vercel environment variables.` },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare content parts
    const contents: any[] = [];

    // System instruction prefix
    const contextPrefix = `You are PocketProf AI, an expert tutor for ${subject || "General Academic"}. Provide accurate, detailed academic help.\n\nUser Question: ${prompt || "Analyze this attached content."}`;

    if (imageBase64 && imageMimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    contents.push(contextPrefix);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const text = response.text || "No answer generated.";

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { response: `[${subject || "Error"}] Unable to fetch response: ${error?.message || "Internal server error"}` },
      { status: 500 }
    );
  }
}
