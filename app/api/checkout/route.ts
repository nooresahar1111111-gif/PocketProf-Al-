import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.SAFEPAY_API_KEY;
    
    const response = await fetch("https://sandbox.api.getsafepay.com/order/v1/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client: apiKey,
        amount: 50000, // 500 PKR in paisas
        currency: "PKR",
        environment: "sandbox",
      }),
    });

    const data = await response.json();
    const tracker = data?.data?.token;
    const checkoutUrl = `https://sandbox.api.getsafepay.com/checkout/pay?tracker=${tracker}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    return NextResponse.json({ error: "Failed to initialize Safepay checkout" }, { status: 500 });
  }
}
