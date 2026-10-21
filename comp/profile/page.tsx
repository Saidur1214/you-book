'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../auth/log-out";
import axios from "axios";

export default function Profile() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const { data } = await axios.post("/api/gemini", { url });
            console.log("Post created:", data);
            setUrl("");
            router.refresh();
        } catch (error: any) {
            console.error("API Error:", error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || "Failed to generate summary");
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
                    <h3 className="font-semibold text-lg text-white">Saidur Rahman</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Content Creator & Developer</p>
                </div>
            </div>

            {/* URL Submission Form */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                <h4 className="font-medium text-slate-200 mb-3 text-sm">Add Resource</h4>
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
                        {loading ? "Generating..." : "Submit"}
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