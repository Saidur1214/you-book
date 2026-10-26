import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const supabase = await serverClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const inputUrl = body?.url;

        if (!inputUrl) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction:
                "You are a sharp friend who just watched this video and is retelling it to me over coffee. The transcript is below. Retell it as a flowing story, in plain spoken language. KEEP: Every concrete example, number, name, and case study the speaker mentions. His personal stories: what he tried, what went wrong, what he learned. The reasoning behind each piece of advice (the why, not just the what). The order of events, so it reads like a journey: situation to problem to attempts to turning point to lesson. CUT (do not mention at all): Hooks and teasers. Sponsor reads, product pitches, link in the description, course/software promotion. Calls to subscribe/like, repeated points, filler and self-praise. If a tool or product is mentioned only as a pitch, drop it. If it is part of a genuine example he actually used it to solve something, keep it but mention it neutrally. STYLE: Prose paragraphs only. No bullet points, no headers, no bold, no numbered lists. Write like a person talking, not like a report. Short, natural sentences. Tell it as he did X, then ran into Y, so he tried Z, not the speaker emphasizes the importance of Z. Length: roughly 400-700 words, about 1 page per 20 minutes of video. End with one short paragraph: the single idea worth stealing, and where it would or would not apply. If the speaker's claim looks like a sales pitch dressed as advice, add a quick note in plain words, like worth noting he sells this.",
        });

        const isYouTube =
            typeof inputUrl === "string" &&
            (inputUrl.includes("youtube.com") || inputUrl.includes("youtu.be"));
        let text

        if (isYouTube) {
            try {
                let result;
                let attempts = 3;

                while (attempts > 0) {
                    try {
                        result = await model.generateContent([
                            {
                                fileData: {
                                    fileUri: inputUrl,
                                    mimeType: "video/mp4"
                                },

                            },
                            "Give me summary of this video"
                        ]);
                        text = result?.response.text() || "";
                        break;
                    } catch (err: any) {
                        attempts--;
                        if (attempts === 0 || err?.status !== 503) throw err;
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                    }
                }


            } catch (err: any) {
                console.warn("Could not fetch transcript from YouTube:", err?.message);
            }
        }


        const { data: postData, error: postError } = await supabase
            .from("posts")
            .insert([
                {
                    uid: user.id,
                    subject: "Video Summary",
                    user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
                    post: text,
                }
            ])
            .select()
            .single();

        if (postError) {
            return NextResponse.json(
                { error: postError.message || "Failed to save post to database" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            text,
            post: postData,
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error || "Failed to generate content" },
            { status: error.status || 500 }
        );
    }
}
