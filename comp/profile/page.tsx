'use client';

import { useRouter } from "next/navigation";
import LogoutButton from "../auth/log-out";
import axios from "axios";
import { browserClient } from "@/lib/client";
import { useState, useEffect, useCallback, useRef } from "react";


interface QueueItem {
    id: string;
    url: string;
    status: string;
}

export default function Profile() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [queue, setQueue] = useState<QueueItem[]>([]);

    const supabase = browserClient();
    const prevQueueCount = useRef(0);

    const fetchQueue = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("posts")
            .select("id, url, status")
            .eq("uid", user.id)
            .in("status", ["pending", "processing"])
            .order("created_at", { ascending: true });
        if (data) {
            // When an item finishes, refresh the feed cleanly!
            if (prevQueueCount.current > 0 && data.length < prevQueueCount.current) {
                console.log("Item finished processing, refreshing feed...");
                router.refresh();
            }
            prevQueueCount.current = data.length;
            setQueue(data);
        }
    }, [supabase, router]);
    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 3000);
        return () => clearInterval(interval);
    }, [fetchQueue]); const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            await axios.post("/api/gemini", { url });
            setUrl("");
            // Immediately refresh the queue so the newly submitted URL appears
            await fetchQueue();
            router.refresh();
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || "Failed to generate summary");
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sticky top-8 hidden w-full max-w-xs flex-col gap-6 md:flex lg:shrink-0">
            {/* Profile Card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center text-center gap-3 shadow-lg">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-4xl font-bold shadow-md">
                    S
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-white">Name</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Description</p>
                </div>
            </div>

            {/* URL Submission Form */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                <h4 className="font-medium text-slate-200 mb-3 text-sm">Add Resource</h4>

                {/* --- QUEUE DISPLAY SECTION (Above URL Bar) --- */}
                {queue.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
                            <span>Processing Queue</span>
                            <span className="bg-blue-950 text-blue-400 border border-blue-800/50 px-2 py-0.5 rounded-full text-[10px]">
                                {queue.length} in queue
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                            {queue.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="relative flex h-2 w-2 shrink-0">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.status === 'processing' ? 'bg-amber-400' : 'bg-blue-400'
                                                }`} />
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${item.status === 'processing' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`} />
                                        </span>
                                        <span className="truncate text-slate-300 font-mono text-[11px]" title={item.url}>
                                            {item.url}
                                        </span>
                                    </div>

                                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${item.status === 'processing'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                                        : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {item.status === 'processing' ? 'Processing' : 'Queued'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* --------------------------------------------- */}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-3">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium p-2.5 rounded-xl text-sm transition shadow-sm"
                    >
                        {loading ? "Adding..." : "Submit"}
                    </button>
                </form>

                {errorMessage && (
                    <div className="mt-3 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 leading-relaxed">
                        <span className="block font-semibold text-red-400 mb-1">Notice:</span>
                        <p>{errorMessage}</p>
                    </div>
                )}
                <LogoutButton />
            </div>
        </div>
    );
}
