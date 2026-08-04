import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SAFEPAY_API_KEY; // Your Safepay Secret Key

    if (!apiKey) {
      return NextResponse.json(
        { error: "SAFEPAY_API_KEY is not configured in Vercel environment variables." },
        { status: 500 }
      );
    }

    // Determine environment (Use 'sandbox' for testing, 'production' for live)
    const environment = process.env.NODE_ENV === "production" ? "sandbox" : "sandbox"; 
    
    // Safepay Sandbox API URL
    const baseUrl = "https://sandbox.api.getsafepay.com";

    // Step 1: Create a payment tracker / session
    const response = await fetch(`${baseUrl}/v1/payments/tracker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-API-KEY": apiKey,
      },
      body: JSON.stringify({
        client: "sec_...", // Safepay Secret or Merchant Key
        amount: 50000, // Amount in lowest currency subunit (500.00 PKR = 50000 paisa)
        currency: "PKR",
        environment: "sandbox", // <--- THIS PREVENTS THE "Required environment is missing" ERROR
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Safepay creation error:", data);
      return NextResponse.json({ error: data.message || "Failed to create payment session" }, { status: 400 });
    }

    // Extract checkout token/URL
    const token = data.data?.token || data.token;
    const checkoutUrl = `https://sandbox.api.getsafepay.com/checkout/pay?beacon=${token}&env=sandbox`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
