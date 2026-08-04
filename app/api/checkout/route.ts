import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SAFEPAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "SAFEPAY_API_KEY is missing in Vercel environment variables." },
        { status: 400 }
      );
    }

    // Safepay Sandbox API Call
    const response = await fetch("https://sandbox.api.getsafepay.com/v1/payments/tracker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-API-KEY": apiKey,
      },
      body: JSON.stringify({
        client: apiKey,
        amount: 50000, // 500.00 PKR (represented in paisa)
        currency: "PKR",
        environment: "sandbox",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to initialize Safepay session." },
        { status: response.status }
      );
    }

    const token = data.data?.token || data.token;
    if (!token) {
      return NextResponse.json(
        { error: "No session token returned from Safepay." },
        { status: 500 }
      );
    }

    const checkoutUrl = `https://sandbox.api.getsafepay.com/checkout/pay?beacon=${token}&env=sandbox`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Server error processing payment session." },
      { status: 500 }
    );
  }
}
