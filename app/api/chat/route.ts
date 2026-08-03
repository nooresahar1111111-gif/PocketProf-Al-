import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, subject, imageBase64, imageMimeType } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemContext = `You are PocketProf AI, an expert academic tutor for the subject: ${subject}. 
If an image of a question paper, assignment, or note is provided, read and analyze all text/diagrams carefully and provide step-by-step complete solutions.`;

    const contents: any[] = [systemContext];

    // If an image was uploaded, add it to the Gemini contents payload
    if (imageBase64 && imageMimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    contents.push(prompt || "Please solve all questions shown in this image in detail.");

    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response for image/text." },
      { status: 500 }
    );
  }
}
