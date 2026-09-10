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

    const systemInstruction = `You are PocketProf AI, an intelligent academic tutor for ${
      subject || "General Academic Studies"
    }. Provide clear step-by-step explanations formatted cleanly in Markdown.`;

    // Active production model ID on Groq Cloud
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt || "Hello!" },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Groq Raw Error:", data.error);
      return NextResponse.json(
        { response: `⚠️ Groq Error: ${data.error?.message || "Model request failed."}` },
        { status: response.status || 500 }
      );
    }

    const responseText = data.choices?.[0]?.message?.content || "No response generated.";
    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    return NextResponse.json(
      { response: `⚠️ Server Error: ${error?.message || "Failed to process request."}` },
      { status: 500 }
    );
  }
}
