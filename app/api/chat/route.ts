import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, subject } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { response: "⚠️ GROQ_API_KEY is missing in your Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const systemInstruction = `You are PocketProf AI, an expert academic tutor specializing in ${
      subject || "General Academic"
    }. Provide concise, clear, accurate, and highly educational answers.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Groq API Error:", data.error);
      return NextResponse.json(
        { response: `⚠️ Groq API Error: ${data.error.message}` },
        { status: 500 }
      );
    }

    const responseText = data.choices?.[0]?.message?.content || "No response generated.";
    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { response: `⚠️ Server Error: ${error?.message || "Failed to process request."}` },
      { status: 500 }
    );
  }
}
