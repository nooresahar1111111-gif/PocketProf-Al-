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
        { response: `[${currentSubject}] GEMINI_API_KEY is missing in Vercel settings.` },
        { status: 500 }
      );
    }

    const systemInstruction = `You are PocketProf AI, an expert academic tutor for ${currentSubject}. Provide concise, thorough, and clear academic answers.`;

    const parts: any[] = [];
    
    if (imageBase64 && imageMimeType) {
      parts.push({
        inline_data: { mime_type: imageMimeType, data: imageBase64 }
      });
    }
    
    parts.push({
      text: `${systemInstruction}\n\nQuestion: ${prompt || "Analyze the provided content."}`
    });

    // Use standard 1.5 flash endpoint to minimize quota consumption
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);

      // Clean, human-readable error handling for UI overflow prevention
      if (response.status === 429 || data.error?.message?.includes("Quota exceeded")) {
        return NextResponse.json({
          response: `⏳ Free rate limit reached. Please wait ~30 seconds and try again!`
        });
      }

      return NextResponse.json({
        response: `⚠️ AI Service temporarily busy (${data.error?.code || response.status}). Please try again in a moment.`
      });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    return NextResponse.json({ response: answer });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json(
      { response: `⚠️ Server connection issue. Please check your network.` },
      { status: 500 }
    );
  }
}
