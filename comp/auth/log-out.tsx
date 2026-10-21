"use client";

import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = browserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button 
      onClick={logout} 
      className="w-full bg-slate-800 hover:bg-red-950/40 hover:border-red-900/50 hover:text-red-400 border border-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl text-sm transition shadow-sm"
    >
      Sign out
    </button>
  );
}