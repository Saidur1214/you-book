'use client';

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function AddResource() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();

    const isModalOpen = searchParams.get("modal") === "add-resource";
    const router = useRouter()

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);


        try {
            const { data } = await axios.post("/api/gemini", {
                url,
            });

            console.log(data.text);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("API Error:", error.response?.data);
            }
        } finally {
            setLoading(false);
            setUrl("");
            router.push("/")
        }
    };

    if (!isModalOpen) return null;




    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl">

                {/* Close Button that clears the URL parameter back to root */}
                <Link
                    href="/"
                    className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold p-2 z-10"
                >
                    ✕
                </Link>

                <div className="mb-6 pr-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Add New Resource</h1>
                    <p className="text-sm text-slate-400">Paste your link below to share or add it to your resource collection.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
                            Resource URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/20 mt-2"
                    >
                        {loading ? "Analyzing..." : "Submit Resource"}
                    </button>
                </form>
            </div>
        </div>
    );
}