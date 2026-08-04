import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let currentSubject = "General Academic";

  try {
    const { prompt, subject, imageBase64, imageMimeType } = await req.json();
    if (subject) currentSubject = subject;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { response: `[${currentSubject}] GEMINI_API_KEY is missing in Vercel environment variables.` },
        { status: 500 }
      );
    }

    const systemInstruction = `You are PocketProf AI, an expert academic tutor for ${currentSubject}. Provide concise, accurate, and clear answers.`;

    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
      parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
    }
    parts.push({ text: `${systemInstruction}\n\nQuestion: ${prompt || "Analyze the context."}` });

    // Try primary v1beta endpoint with gemini-1.5-flash
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    // Fallback to standard v1 endpoint if v1beta returns 404
    if (response.status === 404) {
      apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error details:", data);

      if (response.status === 429 || data.error?.message?.includes("Quota")) {
        return NextResponse.json({
          response: "⏳ Free rate limit reached. Please wait ~30 seconds and try again!",
        });
      }

      return NextResponse.json({
        response: `⚠️ API Error (${response.status}): ${data.error?.message || "Model service unavailable."}`,
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response text was generated.";

    return NextResponse.json({ response: answer });
  } catch (error: any) {
    console.error("Server Route Error:", error);
    return NextResponse.json(
      { response: "⚠️ Network or server connection error. Please try again." },
      { status: 500 }
    );
  }
}
