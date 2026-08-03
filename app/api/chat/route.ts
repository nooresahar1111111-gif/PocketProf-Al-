import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let currentSubject = "General Academic";
  
  try {
    const { prompt, subject, imageBase64, imageMimeType } = await req.json();
    if (subject) {
      currentSubject = subject;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { response: `[${currentSubject}] GEMINI_API_KEY missing in Vercel environment variables.` },
        { status: 500 }
      );
    }

    const systemInstruction = `You are PocketProf AI, an expert academic tutor for ${currentSubject}. Provide accurate, clear, and comprehensive answers.`;

    const contents: any[] = [];

    if (imageBase64 && imageMimeType) {
      contents.push({
        parts: [
          { inline_data: { mime_type: imageMimeType, data: imageBase64 } },
          { text: `${systemInstruction}\n\nQuestion: ${prompt || "Analyze this attached material."}` }
        ]
      });
    } else {
      contents.push({
        parts: [
          { text: `${systemInstruction}\n\nQuestion: ${prompt}` }
        ]
      });
    }

    // Using active stable gemini-1.5-flash model endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error details:", data);
      return NextResponse.json(
        { response: `[${currentSubject}] Gemini API Error: ${data.error?.message || "Failed to process request"}` },
        { status: 500 }
      );
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    return NextResponse.json({ response: answer });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json(
      { response: `[${currentSubject}] Server issue: ${error?.message || "Internal error"}` },
      { status: 500 }
    );
  }
}
