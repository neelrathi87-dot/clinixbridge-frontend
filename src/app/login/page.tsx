"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", error: false });
  const router = useRouter();

  // If already logged in, go straight to dashboard
  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/");
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", error: false });

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      if (data?.session) {
        // Save email to local storage for multi-tenant dropdown
        const accountsStr = localStorage.getItem("clinix_saved_accounts") || "[]";
        const accounts = JSON.parse(accountsStr);
        if (!accounts.includes(email)) {
          accounts.push(email);
          localStorage.setItem("clinix_saved_accounts", JSON.stringify(accounts));
        }
        router.push("/");
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to sign in", error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-body" style={{ background: "#FAFAFD" }}>
      <div className="w-full max-w-[400px] grid gap-6">
        <div className="text-center grid gap-2">
          <div className="w-[50px] h-[50px] mx-auto rounded-[14px] bg-[#FF5A36] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] flex items-center justify-center text-white text-[22px] font-display -rotate-[8deg] mb-2">cb</div>
          <h1 className="font-display text-[32px] tracking-tight m-0 leading-none">ClinixBridge</h1>
          <p className="text-[#4A4A55] text-[15px] font-[600]">Food as medicine, without the guesswork.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border-[2.5px] border-[#111] rounded-[22px] p-6 shadow-[6px_6px_0_#111] grid gap-5">
          <div className="grid gap-1.5">
            <label className="text-[13px] font-[800] uppercase tracking-wider text-[#111]">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[12px] border-[2px] border-[#111] bg-[#FAFAFD] font-[600] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-[13px] font-[800] uppercase tracking-wider text-[#111]">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[12px] border-[2px] border-[#111] bg-[#FAFAFD] font-[600] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-[12px] border-[2px] text-[13.5px] font-[700] ${message.error ? "bg-[#FFE9E6] border-[#FF5A36] text-[#FF5A36]" : "bg-[#F4F7FF] border-[#5AB0FF] text-[#111]"}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-[52px] bg-[#FF5A36] text-white font-display text-[18px] rounded-[14px] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0_#111] transition-all disabled:opacity-70 flex items-center justify-center mt-2"
          >
            {loading ? "Please wait..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-[14px] font-[600] text-[#4A4A55]">
          New here?{" "}
          <Link href="/signup" className="text-[#FF5A36] font-[800] hover:underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
