import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processQueue(url: string) {
    console.log("🚀 [Worker] processQueue started for user");

    const supabase = await serverClient();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    while (true) {
        console.log("🔍 [Worker Loop] Querying for next 'pending' item...");
        const { data: item } = await supabase
            .from("posts")
            .select("*")
            .eq("uid", userId)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        // If no more pending items, break the loop cleanly
        if (!item) {
            console.log("🏁 [Worker Loop] No more pending items found. Worker finished!");
            break;
        }

        console.log(`📌 [Worker Loop] Picked item ID: ${item.id} | URL: ${item.url}`);

        // Mark as processing
        const { data: updatedData, error: updateError } = await supabase
            .from("posts")
            .update({ status: "processing" })
            .eq("id", item.id)
            .select();

        console.log("🔄 [Worker Loop] Status update to 'processing':", {
            success: updatedData && updatedData.length > 0,
            updateError
        });

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-3.1-flash-lite",
                systemInstruction: `You are a helpful assistant that generates concise summaries of Youtube videos`
            });

            console.log(`⏳ [Gemini] Calling API for item ${item.id}...`);
            const result = await model.generateContent([
                {
                    fileData: {
                        fileUri: item.url.split("&")[0],
                        mimeType: "video/mp4"
                    }
                },
                "this is the video"
            ]);

            const reply = result?.response.text() || "";
            console.log(`✅ [Gemini] Success! Generated ${reply.length} characters.`);

            // Save summary and mark completed
            const { error: completeError } = await supabase
                .from("posts")
                .update({
                    post: reply,
                    status: "processed",
                })
                .eq("id", item.id);

            console.log(`🎉 [Worker Loop] Item ${item.id} saved as 'processed'!`, { completeError });

        } catch (error: any) {
            console.error(`🚨 [Worker Loop] Failed to process video for item ${item.id}:`, error?.message || error);

            const isPermanentError = error?.status === 400;

            if (isPermanentError) {
                console.log(`❌ [Worker Loop] Video permanently failed (400). Deleting from DB: ${item.id}`);
                // Delete the row so it doesn't get stuck in 'processing' or block the queue
                await supabase
                    .from("posts")
                    .delete()
                    .eq("id", item.id);
            } else {
                // Temporary error (429 rate limit / network error) -> keep in pending and move to back
                await supabase
                    .from("posts")
                    .update({
                        status: "pending",
                        created_at: new Date().toISOString(),
                        post: "Failed to generate summary"
                    })
                    .eq("id", item.id);

                console.log(`🛑 [Worker Loop] Marked item ${item.id} as 'pending' to retry later.`);

                // Pause on temporary errors (55s on 429 for Google's quota to reset, otherwise 5s)
                const pauseSeconds = error?.status === 429 ? 55 : 5;
                console.log(`⏱️ [Worker Loop] Pausing for ${pauseSeconds}s...`);
                await new Promise((resolve) => setTimeout(resolve, pauseSeconds * 1000));
            }
        }
    }
}


export async function POST(req: Request) {
    console.log("📥 [POST /api/gemini] Request received");

    const supabase = await serverClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("❌ [POST /api/gemini] Unauthorized request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
        console.warn("⚠️ [POST /api/gemini] Missing URL in body");
        return NextResponse.json({ error: "URL not found" }, { status: 400 });
    }

    console.log(`📝 [POST /api/gemini] Inserting pending row for URL: ${url}`);
    const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert([{
            uid: user.id,
            url: url,
            status: "pending",
            user_name: "AI",
            subject: "Video Summary",
            post: ""
        }])
        .select()
        .single();

    if (postError) {
        console.error("❌ [POST /api/gemini] DB Insert error:", postError.message);
        return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    console.log(`✅ [POST /api/gemini] Row created with ID: ${postData.id}`);

    // Check if worker is already processing
    const { data: isQueue } = await supabase
        .from("posts")
        .select("id")
        .eq("uid", user.id)
        .eq("status", "processing")
        .limit(1)
        .maybeSingle();

    if (!isQueue) {
        console.log("▶️ [POST /api/gemini] No active worker found. Starting worker now...");
        processQueue(url);
    } else {
        console.log(`⏸️ [POST /api/gemini] Worker already active on post ID: ${isQueue.id}. Item queued safely.`);
    }

    return NextResponse.json({ success: true, post: postData }, { status: 200 });
}
