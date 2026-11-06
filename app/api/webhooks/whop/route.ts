import { waitUntil } from "@vercel/functions";
import { unwrapWebhook } from "@whop/sdk/helpers";
import type { NextRequest } from "next/server";

// Minimal shape of what we use. Add fields as you need them.
type WhopPayment = {
    id: string;
    metadata?: { order_id?: string } & Record<string, unknown>;
    // what is Record<string, unknown>? what it does? { order_id?: string }this order id coming from whop? what use we can make of this?
    [key: string]: unknown;
};

type WhopWebhookEvent = {
    type: string;
    data: WhopPayment;
};

// whats the difference between whopwebhookevent and whop payment? what both does?

export async function POST(request: NextRequest) {
    // Must use the raw body, or signature verification fails. but what does this mine mean? what is the raw body and where it coming from?
    const payload = await request.text(); // what is a payload? how it look like?
    const headers = Object.fromEntries(request.headers); //object? never heard of it. what is formEntries?

    let event: WhopWebhookEvent; // what is this event? does it contain thing we send to whop like order details? or 
    try { //what we are doing from here to
        event = unwrapWebhook(payload, { // what payload and unwrapwebhook is? and what they both doing in here?
            headers, //what a header contain?
            key: process.env.WHOP_WEBHOOK_SECRET!, // where we can get this secret if it from whop webhook it asking me to check some request. which request shold this webhook want?
        }) as unknown as WhopWebhookEvent; // what is as unknown? here we are seeing it just headers and key but whiile declaring the type we set for 2 thing type and data
        // here ? 
    } catch {
        return new Response("Invalid signature", { status: 401 });
    }

    if (event.type === "payment.succeeded") {
        waitUntil(fulfillOrder(event.data)); // we are saying is to wait the server for fulfillOrder but I never head of these 2 thing before? 
    } // so event is basically some data whop sending us from webhook like how does the payment goes? also the event name was set by was we can also name to to banana?

    // Must respond within 5 seconds or Whop retries
    return new Response("OK", { status: 200 });
}

async function fulfillOrder(payment: WhopPayment) { // hey we send event data here but we are accepting payment?  
    const orderId = payment.metadata?.order_id; // are we sending order id to whop or whop sending it to user. because once we are accepting another time we are creating type to send it to whop
    // TODO: mark the order paid in your DB, grant access, send the email.
    // Make this idempotent, because webhooks can be delivered more than once. what is an indempotent? you are saying webhook can send us more then one request? okey I got it but what can I do with? should I stop sending it to do that?
    console.log(`[PAYMENT SUCCEEDED] ${payment.id} for order ${orderId}`);
}