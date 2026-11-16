import {waitUntil} from "@vercel/functions";
import {unwrapWebhook} from "@whop/sdk/helpers";
import {NextRequest, NextResponse} from "next/server";
import {adminClient} from "@/lib/admin";

type WhopMembershipData = {
    metadata?: { userid?: string };
    current_period_end?: number | string;
    current_period_start?: number | string;
    [key: string]: unknown;
    "cancel_at_period_end": string;
    payment: { metadata: { userid?: string } };
};

type WhopWebhookEvent = {
    type: string;
    data: WhopMembershipData;
};

export async function POST(request: NextRequest) {
    const payload = await request.text();
    const headers = Object.fromEntries(request.headers);

    let event: WhopWebhookEvent;
    try {
        event = unwrapWebhook<WhopWebhookEvent>(payload, {
            headers,
            key: process.env.WHOP_WEBHOOK_SECRET!
        });
    } catch {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    if (event.type === "refund.created") {
        console.log(event.type);
        // event.data.current_period_end = new Date().toISOString();
        waitUntil(revokeAccess(event.data));
    }

    if (event.type === "membership.updated" || event.type === "membership.activated") {
        console.log(event.type);
        waitUntil(grantAccess(event.data));
    }

    return new Response("OK", {status: 200});
}

async function grantAccess(data: WhopMembershipData) {
    const userId = data.metadata?.userid;
    const rawValidUntil = data.current_period_end;

    if (!userId || !rawValidUntil) {
        console.error("Missing userId or valid_until in webhook data");
        return;
    }

    // 1. Safely convert to milliseconds
    const validUntilMs = new Date(rawValidUntil).getTime();
    const nowMs = Date.now();
    const status = validUntilMs > nowMs ? "active" : "inactive";

    // 2. Convert the milliseconds into an ISO string/SQL-friendly timestamp
    const validUntilIsoString = new Date(validUntilMs).toISOString();

    console.log("Updating profile:", {
        userId,
        valid_until: validUntilIsoString,
        calculatedStatus: status,
    });

    const {data: updatedProfile, error} = await adminClient
        .from("profile")
        .update({
            valid_until: validUntilIsoString,
            status: status,
        })
        .eq("id", userId);

    if (error) {
        console.error("Error updating profile:", error);
        throw error;
    } else {
        console.log("Updated profile successfully:", updatedProfile);
    }
}

async function revokeAccess(refund: WhopMembershipData) {

    const userid = refund.payment?.metadata.userid;
    const recentTime = Date.now();
    const validateUntil = new Date(recentTime).toISOString()

    console.log(userid)

    // if(!userid) return new Response("No user found (revoke access function)");

    console.log("Updating profile:", {
        userid,
        validateUntil
    });

    const {data: revokeProfile, error} = await adminClient
        .from("profile")
        .update({
            valid_until: validateUntil,
            status: "inactive",
        })
        .eq("id", userid);

    if (error) {
        console.error("Error updating profile:", error);
    }
    console.log("Result:", revokeProfile)
}
