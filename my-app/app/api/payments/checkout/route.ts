import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not set");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Application URL is not configured",
          },
        },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: "プレミアムプラン（テスト）",
            },
            unit_amount: 500,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing/success`,
      cancel_url: `${appUrl}/billing`,
    });

    if (!session.url) {
      console.error("Stripe Checkout session.url is null");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CHECKOUT_SESSION_URL_NOT_FOUND",
            message: "Checkout URL was not returned by Stripe",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        url: session.url,
      },
      error: null,
    });
  } catch (error) {
    console.error("Failed to create Stripe Checkout session", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CHECKOUT_SESSION_CREATE_FAILED",
          message: "Failed to create Stripe Checkout session",
        },
      },
      { status: 500 }
    );
  }
}
