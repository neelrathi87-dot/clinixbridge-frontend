"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
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
    if (!email || !password) {
      setMessage({ text: "Please enter both an email and a password.", error: true });
      return;
    }

    setLoading(true);
    setMessage({ text: "", error: false });
    
    let result;
    if (mode === "signup") {
      result = await supabase.auth.signUp({ email, password });
      if (result.data?.session) {
        router.push("/");
      } else if (result.data?.user) {
        setMessage({ text: "Account created successfully! You can now log in.", error: false });
        setMode("login");
      }
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
      if (result.data?.session) {
        router.push("/");
      }
    }

    if (result.error) {
      setMessage({ text: result.error.message, error: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center font-[var(--font-body)]">
      <div className="w-full max-w-[400px] p-6">
        <div className="flex items-center gap-2.5 font-[var(--font-display)] text-[28px] tracking-tight mb-8 justify-center">
          <span className="w-10 h-10 rounded-xl bg-[var(--tomato)] border-[var(--bw)] border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] flex items-center justify-center text-white text-lg -rotate-6">cb</span>
          ClinixBridge
        </div>
        
        <div className="bg-white border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)] rounded-2xl p-6">
          <h2 className="font-[var(--font-display)] text-[22px] mb-6 text-center">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[var(--muted)] mb-1 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-[var(--ink)] rounded-xl px-4 py-3 bg-[var(--paper)] font-bold text-[14px]"
                placeholder="doctor@clinic.com"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[var(--muted)] mb-1 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-[var(--ink)] rounded-xl px-4 py-3 bg-[var(--paper)] font-bold text-[14px]"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-xl text-[13px] font-bold border-2 border-[var(--ink)] ${message.error ? 'bg-[#FFE9E6] text-[var(--tomato)]' : 'bg-[#E3F2FF] text-[var(--sky)]'}`}>
                {message.text}
              </div>
            )}
            
            <div className="pt-2 grid gap-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full border-[var(--bw)] border-[var(--ink)] rounded-xl py-3 font-extrabold text-[15px] bg-[var(--sun)] text-[var(--ink)] shadow-[var(--sh)] hover:-translate-y-[1px] transition-transform disabled:opacity-50"
              >
                {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Sign Up"}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setMessage({ text: "", error: false });
                }}
                disabled={loading}
                className="w-full text-[13px] font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors mt-2"
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
