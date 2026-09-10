import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, subject, imageBase64 } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { response: "⚠️ GROQ_API_KEY is missing from environment variables." },
        { status: 500 }
      );
    }

    const systemInstruction = `You are PocketProf AI, an elite, highly knowledgeable, and friendly personal academic tutor.
Selected Subject context: ${subject || "General Academic Studies"}.

CORE CAPABILITIES:
- Answer academic coursework questions with clear, step-by-step explanations.
- Analyze question paper images or handwritten notes accurately.
- Adapt explanations to be concise, easy to read, and educational.`;

    // Active Groq models (llama-3.3-70b-versatile for text, qwen/qwen3.6-27b for vision)
    const selectedModel = imageBase64
      ? "qwen/qwen3.6-27b"
      : "llama-3.3-70b-versatile";

    let messageContent: any;

    if (imageBase64) {
      messageContent = [
        { type: "text", text: prompt || "Please evaluate this image and help me solve or understand it." },
        {
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith("data:")
              ? imageBase64
              : `data:image/jpeg;base64,${imageBase64}`,
          },
        },
      ];
    } else {
      messageContent = prompt;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: messageContent },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return NextResponse.json(
        { response: `⚠️ Groq API Error: ${data.error?.message || "Failed to fetch response."}` },
        { status: response.status }
      );
    }

    const reply = data.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json(
      { response: `⚠️ Internal Server Error: ${error.message || "An unexpected error occurred."}` },
      { status: 500 }
    );
  }
}
