import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { prompt, subject, imageBase64, imageMimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { response: "⚠️ GEMINI_API_KEY is missing in your environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `You are PocketProf AI, an expert academic tutor specializing in ${subject || "General Academic"}. Provide concise, clear, and accurate answers.`;

    const contents: any[] = [];

    if (imageBase64 && imageMimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    contents.push(`${systemInstruction}\n\nUser Question: ${prompt}`);

    const result = await model.generateContent(contents);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error?.status === 429 || error?.message?.includes("Quota")) {
      return NextResponse.json({
        response: "⏳ Free rate limit reached. Please wait ~30 seconds and try again!",
      });
    }

    return NextResponse.json(
      { response: `⚠️ API Error: ${error?.message || "Failed to process request."}` },
      { status: 500 }
    );
  }
}
