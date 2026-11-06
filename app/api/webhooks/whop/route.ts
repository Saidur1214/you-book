import { waitUntil } from "@vercel/functions";
import { unwrapWebhook } from "@whop/sdk/helpers";
import type { NextRequest } from "next/server";

// Minimal shape of what we use. Add fields as you need them.
type WhopPayment = {
    id: string;
    metadata?: { order_id?: string } & Record<string, unknown>;
    [key: string]: unknown;
};

type WhopWebhookEvent = {
    type: string;
    data: WhopPayment;
};

export async function POST(request: NextRequest) {
    // Must use the raw body, or signature verification fails
    const payload = await request.text(); // what is payload and from where it coming from?
    const headers = Object.fromEntries(request.headers); // what is fromentries?

    let event: WhopWebhookEvent;
    try {
        event = unwrapWebhook(payload, {
            headers,
            key: process.env.WHOP_WEBHOOK_SECRET!,
        }) as unknown as WhopWebhookEvent;
        console.log("event", event); // TODO: I will delete it later
    } catch {
        return new Response("Invalid signature", { status: 401 });
    }

    if (event.type === "payment.succeeded") {
        waitUntil(fulfillOrder(event.data));
    }

    // Must respond within 5 seconds or Whop retries
    return new Response("OK", { status: 200 });
}

async function fulfillOrder(payment: WhopPayment) { // we are passing event.data here it's accepting payment
    const orderId = payment.metadata?.order_id; // we are sending order id from another component so we can know who just paid?
    // TODO: mark the order paid in your DB, grant access, send the email.
    // TODO: Make this idempotent, because webhooks can be delivered more than once. like marking status = paid
    console.log(`[PAYMENT SUCCEEDED] ${payment.id} for order ${orderId}`);
}