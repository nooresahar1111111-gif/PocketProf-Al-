import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, subject, imageBase64, imageMimeType } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { response: "⚠️ GROQ_API_KEY is missing in your Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const systemInstruction = `You are PocketProf AI, an intelligent academic tutor and general knowledge assistant specializing in ${
      subject || "General Academic Studies & Knowledge"
    }.

CORE CAPABILITIES:
- Answer academic coursework questions with complete accuracy.
- Use broad general knowledge, everyday logic, and common sense to answer open-ended or real-world questions clearly.
- Analyze uploaded question papers, assignments, and notes to provide step-by-step solutions and explanations.

FORMATTING RULES:
- Always format outputs using structured Markdown.
- Put every question heading, MCQ choice (A, B, C, D), correct answer, and explanation on its OWN separate line.
- Use double line breaks between distinct questions to keep text clear and easy to read.`;

    // Construct request messages
    let userContent: any = prompt;

    // If an image/paper is uploaded, pass it in multi-modal format (for models supporting vision)
    if (imageBase64) {
      userContent = [
        { type: "text", text: prompt || "Please analyze this uploaded paper/notes:" },
        {
          type: "image_url",
          image_url: {
            url: `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`,
          },
        },
      ];
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageBase64 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
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
