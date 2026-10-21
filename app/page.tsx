import Feed from "@/comp/feed/page";
import Profile from "@/comp/profile/page";
import Link from "next/link";
import AddResource from "@/comp/add-resource/page";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 flex flex-col relative">

      {/* Mobile Button */}
      <nav className="block md:hidden mb-6 flex justify-center">
        <Link
          href="/?modal=add-resource"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 border border-blue-500/30"
        >
          <span>➕</span> Add Resource
        </Link>
      </nav>
      <div className="hell"></div>

      {/* Main Content Layout */}
      <div className="mx-auto flex w-full max-w-6xl gap-6 flex-1">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Suspense fallback={<div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">Loading feed...</div>}>
            <Feed />
          </Suspense>
        </div>

        <aside className="hidden w-80 shrink-0 lg:block">
          <Profile />
        </aside>
      </div>
      <Suspense fallback={null}>
        <AddResource />
      </Suspense>
    </div>
  );
}