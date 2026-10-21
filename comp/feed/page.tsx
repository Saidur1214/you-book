import { serverClient } from "@/lib/server";
import { connection } from "next/server";

export default async function Feed() {
    await connection();
    const supabase = await serverClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
        return (
            <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                Please log in to view your feed.
            </div>
        );
    }

    const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('uid', user.id)
        .order('created_at', { ascending: false });

    if (postError) {
        console.error("Error fetching posts:", postError.message);
        return (
            <div className="text-center p-8 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-300">
                Failed to load posts. Please try refreshing.
            </div>
        );
    }

    return (
        <div>
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
                {/* Main Feed Column */}
                <main className="flex w-full min-w-0 max-w-2xl flex-col gap-4">
                    {posts && posts.length > 0 ? (
                        posts.map((post) => (
                            <article
                                key={post.id}
                                className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg transition hover:border-slate-700"
                            >
                                {/* Author Header */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                                        A.I
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-200">{post.user_name || "A.I"}</h3>
                                        {post.subject && (
                                            <p className="text-xs text-slate-400">{post.subject}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="space-y-3">
                                    <p className="text-slate-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                                        {post.post}
                                    </p>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                            No posts yet. Submit a YouTube URL from the sidebar to create your first story!
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}