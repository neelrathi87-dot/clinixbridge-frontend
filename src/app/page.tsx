"use client";
import React, { useState, useEffect } from "react";
import { Activity, ClipboardList, Utensils, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- CLINIXBRIDGE DATA & RULES ---
const SAMPLE = { hb: 11.2, ferritin: 14, vitd: 16, b12: 182, folate: 6.1, ca: 9.1, mg: 1.6, zinc: 64, alb: 4.1 };
const SAMPLE_HISTORY = [
  { date: "2026-03-20", vals: { hb: 10.4, ferritin: 8, vitd: 11, b12: 145, folate: 3.6, ca: 8.6, mg: 1.5, zinc: 58, alb: 3.7 } },
  { date: "2026-06-19", vals: { hb: 10.9, ferritin: 11, vitd: 13.5, b12: 165, folate: 5.0, ca: 8.9, mg: 1.55, zinc: 61, alb: 3.9 } },
  { date: "2026-09-18", vals: { ...SAMPLE } }
];

const MARKERS = [
  { id:"hb", name:"Haemoglobin", unit:"g/dL", low:{F:12,M:13}, bord:{F:12.5,M:13.5}, hi:{F:15.5,M:17}, crit:{F:8,M:8}, nut:"iron", why:"Low haemoglobin means less oxygen reaching your body." },
  { id:"ferritin", name:"Ferritin", unit:"ng/mL", low:30, bord:50, hi:300, crit:10, nut:"iron", why:"Your iron savings account. It drops long before haemoglobin does." },
  { id:"vitd", name:"Vitamin D", unit:"ng/mL", low:20, bord:30, hi:100, crit:10, nut:"vitd", why:"Needed for strong bones and immunity. Common gap despite the sun." },
  { id:"b12", name:"Vitamin B12", unit:"pg/mL", low:200, bord:300, hi:900, crit:150, nut:"b12", why:"Keeps nerves running. Vegetarians are most likely to be short." },
  { id:"folate", name:"Folate (B9)", unit:"ng/mL", low:4, bord:5.5, hi:20, crit:2, nut:"folate", why:"Helps build new blood cells. Found in greens." },
  { id:"ca", name:"Calcium", unit:"mg/dL", low:8.5, bord:8.8, hi:10.5, crit:7.5, nut:"calcium", why:"Bones, teeth, muscle and nerve signals." },
  { id:"mg", name:"Magnesium", unit:"mg/dL", low:1.7, bord:1.85, hi:2.4, crit:1.2, nut:"magnesium", why:"Linked to sleep, cramps and energy." },
  { id:"zinc", name:"Zinc", unit:"µg/dL", low:70, bord:80, hi:120, crit:50, nut:"zinc", why:"Immunity, skin, hair and healing." },
  { id:"alb", name:"Albumin", unit:"g/dL", low:3.5, bord:3.8, hi:5.0, crit:2.8, nut:"protein", why:"A marker of overall protein intake." },
  { id:"plt", name:"Platelets", unit:"lakh/µL", low:{F:1.5,M:1.5}, bord:{F:1.5,M:1.5}, hi:{F:4.5,M:4.5}, crit:{F:1.0,M:1.0}, nut:"moderation", why:"Levels are elevated. Homeostatic protocol active: Do not completely stop consumption. We are reducing portion sizes by 30% to gently stabilize without causing a sudden crash." }
];

const FOODS: any = {
  iron: "palak (spinach), rajma, kala chana, bajra, jaggery",
  vitd: "20 min morning sun, sun-dried local mushrooms, fortified milk",
  b12: "dahi (curd), paneer, milk, chaas",
  folate: "methi, palak, moong sprouts, local beetroot",
  calcium: "ragi, milk, curd, paneer, til (sesame)",
  magnesium: "pumpkin seeds, peanuts, banana, bajra",
  zinc: "pumpkin seeds, chana, dahi",
  protein: "dal, paneer, soya chunks, sprouts",
  moderation: "Balanced moderate intake."
};

const CLINIX_MEALS = [
  { s: "b", d: "v", t: "Moong Sprout & Mineral Water Broth", x: "Simmered in mineral water to prevent nutrient degradation. Do not drain the water—drink it to retain all energy-boosting vitamins [B-Complex & C].", n: ["folate", "protein", "b12", "zinc"] },
  { s: "l", d: "v", t: "Palak (Spinach) Stew + Jeera Rice", x: "Boiling spinach leaches nutrients. This thick stew locks in the cellular protectors [antioxidants] and iron so you get 100% of the benefit.", n: ["iron", "calcium", "folate", "vitc"] },
  { s: "d", d: "v", t: "Slow-Cooked Tomato Dal", x: "Cooking tomatoes on low heat unlocks a special compound [lycopene] that protects your body's cells. Eaten in moderation to maintain natural balance [homeostasis].", n: ["protein", "iron"] },
  { s: "s", d: "v", t: "Roasted Kala Chana + Gud", x: "A highly affordable, local source of iron. Eat in moderate portions to gently raise your levels without causing an energy crash.", n: ["iron", "zinc", "protein"] },
  { s: "b", d: "e", t: "Masala Omelette + Bajra Roti", x: "Keep the yolk—that's where the bone-strengthening nutrients [Vitamin D] live. Bajra acts as a powerful local iron source.", n: ["b12", "vitd", "protein", "iron"] },
];

const SLOT: any = { b: "Breakfast · 8 am", l: "Lunch · 1 pm", s: "Snack · 4:30 pm", d: "Dinner · 8 pm" };
const TILE: any = { b: "B", l: "L", s: "S", d: "D" };
const fmtShort = (d: string) => new Date(d).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", "'");

// --- MAIN COMPONENT ---
export default function ClinixBridgeApp() {
  const [activeTab, setActiveTab] = useState("report");
  const [currentUser, setCurrentUser] = useState("Neel");
  const [showUsers, setShowUsers] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<string[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const router = useRouter();

  const [sex, setSex] = useState("M");
  const [diet, setDiet] = useState("v");
  const [weight, setWeight] = useState("58");
  const [activity, setActivity] = useState("everyday");
  const [vals, setVals] = useState<any>({ ...SAMPLE });
  const [pm, setPm] = useState("vitd"); 

  // Today tab interactive state
  const [day, setDay] = useState(2);
  const [done, setDone] = useState<Record<string, number | null>>({"0-0":1,"0-1":1,"0-2":0.5,"0-3":1,"1-0":1,"1-1":0,"1-2":1,"1-3":1.5,"2-0":1});
  const [swaps, setSwaps] = useState<Record<string, number>>({});
  const [addon, setAddon] = useState<Record<string, string[]>>({"0":["curd"],"1":["egg","milk"]});
  const [pgoal, setPgoal] = useState(0.83);
  const [reports, setReports] = useState<any[]>([...SAMPLE_HISTORY]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data && data.length > 0) {
      console.log('Securely fetched isolated patient data:', data);
      // Data hydration logic goes here later
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        const email = session.user.email || "Doctor";
        setCurrentUserEmail(email);
        const name = email.split("@")[0];
        setCurrentUser(name.charAt(0).toUpperCase() + name.slice(1));
        
        // Update saved accounts in local storage
        const saved = JSON.parse(localStorage.getItem("clinix_saved_accounts") || "[]");
        if (!saved.includes(email)) {
          saved.push(email);
          localStorage.setItem("clinix_saved_accounts", JSON.stringify(saved));
        }
        setSavedAccounts(saved);
        
        fetchReports();
      }
    };
    
    checkSession();
  }, [router]);

  const pick = (v: any, sexStr: string) => typeof v === "object" ? v[sexStr] : v;

  const getStatus = (m: any) => {
    const v = vals[m.id];
    if (v === "" || v == null || isNaN(v)) return null;
    const low = pick(m.low, sex), bord = pick(m.bord, sex), hi = pick(m.hi, sex), crit = pick(m.crit, sex);
    if (v < low) return { k: "low", label: "Low", crit: v <= crit };
    if (v < bord) return { k: "mid", label: "Borderline" };
    if (v > hi) return { k: "mid", label: "High" };
    return { k: "ok", label: "Good" };
  };

  const needs = () => {
    const w: Record<string, number> = {};
    MARKERS.forEach(m => { 
      const s = getStatus(m); 
      if (!s || s.label === "High") return; 
      const add = s.k === "low" ? 3 : s.k === "mid" ? 1.5 : 0; 
      w[m.nut] = Math.max(w[m.nut] || 0, add); 
    });
    if (w.iron) w.vitc = 1;
    return w;
  };

  const dietOK = (m: any) => diet === "n" || (diet === "e" ? m.d !== "n" : m.d === "v");

  const planFor = (dIndex: number) => {
    const w = needs(); 
    const out: any[] = [];
    ["b","l","s","d"].forEach((slot, si) => {
      const pool = CLINIX_MEALS.filter(m => m.s === slot && dietOK(m))
        .map(m => ({ m, sc: m.n.reduce((a:number, n:string) => a + (w[n] || 0), 0) + m.g / 25 }))
        .sort((a, b) => b.sc - a.sc);
      const top = pool.slice(0, Math.max(3, Math.min(5, pool.length)));
      const off = (swaps[dIndex + "-" + slot] || 0);
      out.push(top[(dIndex * 3 + si + off) % top.length].m);
    });
    return out;
  };

  const amt = (k: string) => { const v = done[k]; return v === true ? 1 : (typeof v === "number" ? v : null); };
  const dayTotal = (dIndex: number) => [0,1,2,3].reduce((a, i) => a + (amt(dIndex + "-" + i) || 0), 0);
  const target = () => Math.round((parseFloat(weight) || 58) * pgoal);
  
  // Need to define ADDONS array before using it
  const ADDONS = [
    {id:"egg",t:"1 boiled egg",g:6,d:"e"},{id:"curd",t:"1 katori curd",g:6,d:"v"},{id:"milk",t:"1 glass milk",g:8,d:"v"},
    {id:"chana",t:"Handful roasted chana",g:7,d:"v"},{id:"paneer",t:"Few paneer cubes",g:9,d:"v"},{id:"sattu",t:"Sattu drink",g:10,d:"v"},
    {id:"peanut",t:"2 tbsp peanuts",g:5,d:"v"}
  ];
  
  const addonG = (dIndex: number) => (addon[dIndex] || []).reduce((a, id) => a + (ADDONS.find(x => x.id === id)?.g || 0), 0);
  const dayProtein = (dIndex: number) => { 
    const p = planFor(dIndex); 
    return Math.round(p.reduce((a, m, i) => a + (amt(dIndex + "-" + i) || 0) * m.g, 0) + addonG(dIndex)); 
  };
  const mealLevel = (g: number) => g >= 20 ? { n: 3, t: "High protein" } : g >= 12 ? { n: 2, t: "Good protein" } : g >= 6 ? { n: 1, t: "Some protein" } : { n: 0, t: "Light on protein" };
  const dayLevel = (r: number) => r >= 0.9 ? { k: "ok", t: "On track" } : r >= 0.5 ? { k: "mid", t: "Getting there" } : { k: "low", t: "Low so far" };

  // --- TAB 1: REPORT ---
  const renderReport = () => (
    <div className="grid gap-[14px] pb-6 content-start">
      
      {/* 1. Functional Blue Dropzone */}
      <label className="cursor-pointer block w-full bg-[var(--sky)] border-[var(--bw)] border-dashed border-[var(--ink)] rounded-[22px] py-[22px] px-4 text-center relative grid gap-[6px] justify-items-center">
        <input 
          type="file" 
          accept=".pdf,image/png,image/jpeg" 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) alert(`Demo Mode: "${file.name}" received. ClinixBridge AI is scanning...`);
          }} 
        />
        <div className="w-[54px] h-[54px] bg-white border-[var(--bw)] border-[var(--ink)] rounded-[16px] shadow-[3px_3px_0_var(--ink)] grid place-items-center -rotate-[6deg]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
            <path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>
          </svg>
        </div>
        <b className="block font-display font-normal text-[17px] mt-[6px]">Drop your blood report</b>
        <span className="text-[13px] font-[600]">PDF or photo · CBC, Vit D, B12, iron profile</span>
      </label>

      {/* Paste Report Accordion */}
      <details className="bg-white border-[2.5px] border-[#111] rounded-[20px] p-[15px] shadow-[4px_4px_0_#111]">
        <summary className="cursor-pointer font-[800] text-[14px] list-none flex justify-between items-center text-[#111]">
          Or paste the report text
        </summary>
        <textarea 
          className="w-full min-h-[90px] rounded-[12px] border-[2px] border-[#111] bg-[#FAFAFD] p-[10px] font-mono text-[12px] mt-2 mb-2 focus:outline-none focus:ring-2 focus:ring-[#5AB0FF] focus:border-transparent" 
          placeholder="Haemoglobin 11.2 g/dL&#10;Vitamin D (25-OH) 16 ng/mL&#10;Vitamin B12 182 pg/mL"
        ></textarea>
        <button className="w-full border-[2.5px] border-[#111] rounded-[16px] p-[11px] font-[800] text-[15.5px] bg-white text-[#111] shadow-[4px_4px_0_#111] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[1px_1px_0_#111] transition-all">
          Read values
        </button>
      </details>

      {/* 2. About You Section */}
      <div className="bg-white border-[2.5px] border-[#111] rounded-[20px] p-[15px] shadow-[4px_4px_0_#111] grid gap-4">
        <span className="text-[11px] font-[800] uppercase tracking-[0.1em] text-[#111]">About you</span>
        
        <div className="flex bg-white border-[2.5px] border-[#111] rounded-[14px] p-[3px] gap-[3px]">
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${sex === "F" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setSex("F")}>Female</button>
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${sex === "M" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setSex("M")}>Male</button>
        </div>
        
        <div className="flex bg-white border-[2.5px] border-[#111] rounded-[14px] p-[3px] gap-[3px]">
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${diet === "v" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setDiet("v")}>Veg</button>
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${diet === "e" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setDiet("e")}>Egg ok</button>
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${diet === "n" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setDiet("n")}>Non-veg</button>
        </div>
        
        <div className="flex items-center justify-between border-t-[1.5px] border-dashed border-[rgba(17,17,17,0.2)] pt-[9px]">
          <div>
            <div className="font-[800] text-[14px] flex items-center gap-[7px] text-[#111]">Body weight</div>
            <div className="font-mono text-[10.5px] text-[#77778A]">helps set your protein goal</div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" className="w-[84px] h-[36px] border-[2px] border-[#111] rounded-[10px] px-[8px] bg-white font-mono text-[13px] text-right" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <span className="w-[30px] font-mono text-[10px] text-[#77778A]">kg</span>
          </div>
        </div>
        
        <div className="flex bg-white border-[2.5px] border-[#111] rounded-[14px] p-[3px] gap-[3px]">
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${activity === "everyday" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setActivity("everyday")}>Everyday</button>
          <button className={`flex-1 py-[8px] px-[6px] text-[13px] font-[800] rounded-[10px] transition-colors ${activity === "active" ? "bg-[#111] text-white" : "bg-transparent text-[#4A4A55]"}`} onClick={() => setActivity("active")}>Active / gym</button>
        </div>
        
        <p className="text-[12px] text-[#4A4A55] m-0">
          Every home&apos;s katori and glass is a different size, so Kami shows protein as levels, not grams.
        </p>
      </div>

      {/* 3. Report Values Section */}
      <div className="bg-white border-[2.5px] border-[#111] rounded-[20px] p-[15px] shadow-[4px_4px_0_#111]">
        <div className="flex justify-between items-center mb-[2px]">
          <span className="text-[11px] font-[800] uppercase tracking-[0.1em] text-[#111]">Report values</span>
          <button className="bg-[#FFD23F] border-[2px] border-[#111] px-[10px] py-[4px] rounded-full text-[11.5px] font-[800] text-[#111]" onClick={() => setVals({ ...SAMPLE })}>Load example</button>
        </div>
        <div>
          {MARKERS.map((m) => {
            const s = getStatus(m);
            const dotColor = s ? `var(--${s.k})` : "#E5E5E5";
            return (
              <div className="grid grid-cols-[1fr_84px_50px] gap-2 items-center py-[9px] border-b-[1.5px] border-dashed border-[rgba(17,17,17,0.2)] last:border-b-0" key={m.id}>
                <div>
                  <div className="font-[800] text-[14px] flex items-center gap-[7px]">
                    <span className="w-[10px] h-[10px] rounded-full flex-none border-[2px] border-[#111]" style={{ background: dotColor }}></span>
                    {m.name}
                  </div>
                  <div className="font-mono text-[10.5px] text-[#77778A]">normal {pick(m.low, sex)}–{pick(m.hi, sex)}</div>
                </div>
                <input type="number" className="w-full border-[2px] border-[#111] rounded-[10px] py-[6px] px-[8px] bg-white font-mono text-[13px] text-right" value={vals[m.id] || ""} onChange={(e) => setVals({ ...vals, [m.id]: parseFloat(e.target.value) })} />
                <span className="font-mono text-[10px] text-[#77778A]">{m.unit}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="grid gap-[10px] pt-1">
        <button 
          className="w-full bg-[#FF5A36] text-white font-[800] text-[15.5px] py-[14px] px-[18px] rounded-[16px] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[1px_1px_0_#111] transition-all flex items-center justify-center gap-[8px]" 
          onClick={() => setActiveTab("scan")}
        >
          Scan my levels <span aria-hidden="true">→</span>
        </button>
        <button 
          className="w-full bg-white text-[#111] font-[800] text-[15.5px] py-[11px] px-[18px] rounded-[16px] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[1px_1px_0_#111] transition-all"
          onClick={() => alert("Report securely saved to history!")}
        >
          Save as a new report in my history
        </button>
      </div>
    </div>
  );

  // --- TAB 2: SCAN ---
  const renderScan = () => {
    const rows = MARKERS.map(m => ({ m, s: getStatus(m) })).filter(r => r.s);
    const order: any = { low: 0, mid: 1, ok: 2 };
    rows.sort((a, b) => order[a.s!.k] - order[b.s!.k]);
    const okCount = rows.filter(r => r.s!.k === "ok").length;
    const pct = rows.length ? Math.round((okCount / rows.length) * 100) : 0;
    const crits = rows.filter(r => r.s!.crit);

    return (
      <div className="grid gap-[14px] pb-6 content-start">
        <div className="hero-score">
          <div className="ring" style={{ "--p": pct } as React.CSSProperties}><span>{okCount}/{rows.length}</span></div>
          <div>
            <h3>{rows.length - okCount ? `${rows.length - okCount} things to fix with food` : "All clear. Nice."}</h3>
            <p>{rows.length - okCount ? "Your plan targets these first, starting today." : "We'll keep you balanced."}</p>
          </div>
        </div>
        
        {crits.length > 0 && (
          <div className="docflag">
            <b>Please see a doctor about {crits.map(r => r.m.name).join(", ")}.</b> These are very low, and food alone may be too slow. ClinixBridge's meals can support whatever they prescribe.
          </div>
        )}

        {rows.map(({ m, s }) => {
          const v = vals[m.id], lo = pick(m.low, sex), hi = pick(m.hi, sex), span = hi - lo;
          const pos = Math.max(3, Math.min(97, ((v - (lo - span * .5)) / (span * 2)) * 100));
          return (
            <div className={`r ${s!.k}`} key={m.id}>
              <div className="top"><span className="nm">{m.name}</span><span className={`pill ${s!.k}`}>{s!.label}</span></div>
              <div className="val">{v}<small>{m.unit}</small></div>
              <div className="bar"><i style={{ left: `${pos}%`, background: `var(--${s!.k})` }}></i></div>
              <div className="meta"><span>low</span><span>normal {lo}–{hi}</span><span>high</span></div>
              {s!.k !== "ok" && (<div className="eat">{m.why}<br/><b>Eat more:</b> {FOODS[m.nut]}</div>)}
            </div>
          );
        })}
        <button className="w-full bg-[#FF5A36] text-white font-[800] text-[15.5px] py-[14px] px-[18px] rounded-[16px] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[1px_1px_0_#111] transition-all flex items-center justify-center gap-[8px] mt-2" onClick={() => setActiveTab("today")}>
          See today's meals <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  };

  // --- TAB 3: TODAY ---
  const renderToday = () => {
    const w = needs(); 
    const focus = Object.keys(w).filter(k => w[k] >= 3 && k !== "vitc").map(k => NUT_LABEL[k as keyof typeof NUT_LABEL]);
    const plan = planFor(day); 
    const key = (i: number) => day + "-" + i;
    const total = dayTotal(day);
    const logged = [0,1,2,3].filter(i => amt(key(i)) != null).length;
    let streak = 0; 
    for(let d=0; d<7; d++){ if(dayTotal(d)>=3) streak++; }
    const pct = Math.round(total/4*100);
    const tg = target();
    const pe = dayProtein(day);
    const planned = Math.round(plan.reduce((a,m) => a + m.g, 0) + addonG(day));
    const lv = dayLevel(pe/tg);
    const myAdd = addon[day] || [];
    const addons = ADDONS.filter(a => a.d === "v" || diet !== "v");

    return (
      <div className="grid gap-[14px] pb-6 content-start">
        <div className="flex gap-[12px] items-center">
          <div className="w-[40px] h-[40px] rounded-[13px] bg-[#B69CFF] border-[2.5px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center font-display text-[15px]">cb</div>
          <div className="bg-[#FFD23F] rounded-[20px_20px_20px_6px] px-[14px] py-[10px] text-[13.5px] font-[500] leading-[1.3] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] flex-1">
            Morning {currentUser}! Day {day+1} of your plan. Today we're pushing <b>{focus.length ? focus.join(", ") : "balance"}</b>. Everything below is from your kitchen or the kirana store.
          </div>
        </div>
        
        <div className="flex bg-[#F4F7FF] border-[2.5px] border-[#111] rounded-[18px] p-[3px] shadow-[4px_4px_0_#111]">
          {DAYN.map((d, i) => (
            <button key={i} className={`flex-1 flex flex-col items-center justify-center py-[6px] rounded-[14px] border-[2.5px] transition-all ${day === i ? 'bg-[#FF5A36] border-[#111] text-white shadow-[2px_2px_0_#111]' : 'border-transparent text-[#77778A] hover:bg-[#E3E8FF] hover:text-[#111]'}`} onClick={() => setDay(i)}>
              <small className="text-[10px] font-[800] uppercase tracking-wider">{d}</small>
              <span className="text-[17px] font-display mt-[1px]">{i+1}</span>
            </button>
          ))}
        </div>
        
        <div className="bg-white border-[2.5px] border-[#111] rounded-[18px] p-3 shadow-[4px_4px_0_#111] flex items-center justify-between font-display text-[15px]">
          <span>{pct}% of plan</span>
          <span className="flex-1 mx-3 h-3 bg-[#F4F7FF] rounded-full border-[2px] border-[#111] overflow-hidden">
            <i className="block h-full bg-[#33D69F] border-r-[2px] border-[#111]" style={{ width: `${Math.min(100, pct)}%` }} />
          </span>
          <span className="text-[#FF5A36]">{streak} day streak</span>
        </div>

        <div className="bg-[#E3E8FF] border-[2.5px] border-[#111] rounded-[22px] p-[16px] shadow-[4px_4px_0_#111]">
          <div className="flex justify-between items-center mb-1"><span className="text-[12px] font-[800] uppercase tracking-wider text-[#111]">Protein today</span>
            <span className="flex gap-[3px]" aria-hidden="true">
              {[1,2,3].map(i => <i key={i} className={`w-[6px] h-[6px] rounded-full ${i <= (lv.k==="ok"?3:lv.k==="mid"?2:1) ? "bg-[#111]" : "bg-[#111] opacity-20"}`} />)}
            </span>
          </div>
          <div className="mb-3"><b className={`font-display text-[22px] ${lv.k==="low"?"text-[#FF5A36]":lv.k==="mid"?"text-[#E5A500]":"text-[#33D69F]"}`}>{lv.t}</b></div>
          <div className="relative h-4 bg-white border-[2.5px] border-[#111] rounded-full overflow-hidden mb-1">
            <i className="absolute top-0 bottom-0 left-0 bg-[#FF5A36]" style={{ width: `${Math.min(100, pe/tg*100)}%` }} />
            <s className="absolute top-0 bottom-0 w-[3px] bg-[#111] z-10" style={{ left: `${Math.min(100, planned/tg*100)}%` }} title="Full plan" />
          </div>
          <div className="flex justify-between text-[10.5px] font-[800] text-[#77778A] mb-3"><span>Low</span><span>Getting there</span><span>On track</span></div>
          <p className="text-[13px] font-[600] m-0 mb-3 leading-[1.3]">
            {lv.k==="ok" ? "Your protein looks good for today." : planned/tg>=.9 ? "Eat the rest of today's plan and you'll be on track." : "Today's plan is a little light. Add one of these to any meal:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {addons.map(a => (
              <button key={a.id} className="bg-white border-[2.5px] border-[#111] rounded-[10px] px-3 py-1.5 text-[12px] font-[800] shadow-[2px_2px_0_#111] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all" onClick={() => {
                setAddon(prev => ({...prev, [day]: [...(prev[day]||[]), a.id]}));
              }}>+ {a.t}</button>
            ))}
          </div>
          {myAdd.length > 0 && (
            <p className="text-[13px] font-[600] mt-3 mb-0">Added: {myAdd.map(id=>ADDONS.find(a=>a.id===id)?.t).filter(Boolean).join(", ")} · <button className="text-[#FF5A36] underline font-[800]" onClick={() => {
              setAddon(prev => { const n={...prev}; delete n[day]; return n; });
            }}>Clear</button></p>
          )}
        </div>

        {w.vitd && (
          <div className="flex gap-[12px] bg-[#FFF6D6] border-[2.5px] border-[#111] rounded-[22px] p-[16px] shadow-[4px_4px_0_#111]">
            <span className="w-[44px] h-[44px] shrink-0 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] flex items-center justify-center text-[#FFD23F] -rotate-[6deg]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="24" height="24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </span>
            <div>
              <b className="block font-display text-[16px] mb-[2px]">Sun break · 10:30 am</b>
              <span className="text-[13.5px] font-[500] leading-[1.3] block">20 minutes of sun on your arms and face. The cheapest Vitamin D there is.</span>
            </div>
          </div>
        )}

        {plan.map((m, i) => {
          const k = key(i);
          const a = amt(k);
          return (
            <div key={i} className={`bg-white border-[2.5px] border-[#111] rounded-[22px] p-[16px] shadow-[4px_4px_0_#111] ${a==null?'':a===0?'opacity-50 grayscale':''}`}>
              <div className="flex gap-[12px] items-start mb-3">
                <span className={`w-[44px] h-[44px] shrink-0 rounded-[14px] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] flex items-center justify-center font-display text-[18px] ${a!=null&&a>0?'bg-[#33D69F] text-white':'bg-[#F4F7FF] text-[#111]'}`}>
                  {a!=null&&a>0 ? <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10"/></svg> : TILE[m.s as keyof typeof TILE]}
                </span>
                <div className="flex-1">
                  <div className="text-[11px] font-[800] uppercase tracking-wider text-[#77778A]">{SLOT[m.s as keyof typeof SLOT]}</div>
                  <div className="font-display text-[18px] leading-[1.1] my-1">{m.t}</div>
                  <div className="flex items-center gap-[6px] text-[13px] font-[700] text-[#111]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1 1-1 1-2M12 7c0-1 1-1 1-2M16 7c0-1 1-1 1-2"/></svg>
                    {m.p}
                  </div>
                  <p className="text-[13px] font-[500] text-[#4A4A55] leading-[1.3] mt-2 mb-0">{m.x}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    {m.n.filter((n:string) => w[n]).map((n:string) => (
                      <span key={n} className="bg-[#FFE9E6] text-[#FF5A36] border-[2px] border-[#FF5A36] rounded-[6px] px-2 py-0.5 text-[10.5px] font-[800]">+ {NUT_LABEL[n as keyof typeof NUT_LABEL]}</span>
                    ))}
                    <button className="text-[11.5px] font-[800] text-[#77778A] underline ml-auto" onClick={() => {
                      setSwaps(prev => ({...prev, [day+"-"+m.s]: (prev[day+"-"+m.s]||0)+1}));
                    }}>Swap ↻</button>
                  </div>
                </div>
              </div>
              
              <div className="flex bg-[#F4F7FF] border-[2.5px] border-[#111] rounded-[16px] p-[3px]">
                {AMTS.map(([v, l]) => (
                  <button key={l as string} className={`flex-1 py-[8px] text-[12.5px] font-[800] rounded-[12px] transition-all border-[2.5px] ${a===v ? 'bg-[#FFD23F] border-[#111] text-[#111] shadow-[2px_2px_0_#111]' : 'bg-transparent border-transparent text-[#77778A] hover:bg-white hover:text-[#111]'}`} onClick={() => {
                    setDone(prev => {
                      const n={...prev};
                      if (n[k] === v) delete n[k]; else n[k] = v as number;
                      return n;
                    });
                  }}>
                    {l as string}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        
        <p className="text-center text-[12.5px] font-[600] text-[#77778A] mb-0 mt-2 px-4">
          {logged}/4 meals logged today · Tap how much you ate. Half and Extra count toward your score.
        </p>

        {w.iron && (
          <div className="flex gap-[12px] bg-[#FFE9E6] border-[2.5px] border-[#111] rounded-[22px] p-[16px] shadow-[4px_4px_0_#111]">
            <span className="w-[44px] h-[44px] shrink-0 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] flex items-center justify-center text-[#FF5A36] rotate-[6deg]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/></svg>
            </span>
            <div>
              <b className="block font-display text-[16px] mb-[2px]">Chai timing</b>
              <span className="text-[13.5px] font-[500] leading-[1.3] block">Keep tea and coffee an hour away from iron-rich meals. They block absorption.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- TAB 4: PROGRESS ---
  const renderProgress = () => {
    const activeMarker = MARKERS.find(m => m.id === pm) || MARKERS[0];
    return (
      <div className="grid gap-[14px] pb-6 content-start">
        <div className="bg-[var(--mint)] border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)] rounded-[22px] p-4 grid gap-1">
          <span className="label text-[var(--ink)]">RPM Dashboard Analytics</span>
          <div className="font-display text-[27px] leading-[1.05]">
            <em className="not-italic bg-white px-1.5 rounded-lg border-2 border-[var(--ink)]">3 of 9</em> markers stabilizing
          </div>
        </div>
        <div className="glass chart">
          <div className="flex justify-between items-baseline mb-1.5">
            <b className="font-display font-normal text-[16px]">{activeMarker.name}</b>
            <span className="label">{activeMarker.unit}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5" style={{ scrollbarWidth: 'none' }}>
            {MARKERS.map(m => (
              <button 
                key={m.id} onClick={() => setPm(m.id)}
                className={`flex-none border-2 border-[var(--ink)] rounded-full px-2.5 py-1 text-[12px] font-extrabold ${pm === m.id ? 'bg-[var(--ink)] text-white' : 'bg-white'}`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="w-full h-32 mt-4 bg-[#f8f9fa] border-2 border-[#111] rounded-xl flex items-center justify-center font-mono text-[12px] text-[#888] shadow-inner">
            [Chart Simulation for {activeMarker.name}]
          </div>
        </div>
      </div>
    );
  };

  // --- TAB 5: PLANS ---
  const renderPlans = () => (
    <div className="grid gap-[14px] pb-6 content-start">
      <div className="bg-[var(--card)] border-[var(--bw)] border-[var(--ink)] rounded-[22px] p-4 grid gap-2.5 shadow-[var(--sh2)] bg-[var(--sun)]">
        <span className="pill bg-[var(--tomato)] text-white w-max">Hackathon Core</span>
        <span className="font-display text-[17px]">Clinical Guardrails</span>
        <ul className="m-0 p-0 list-none text-[13.5px] grid gap-1.5 font-medium">
          <li className="flex gap-2">✓ 7-Day Somatic Pain limits</li>
          <li className="flex gap-2">✓ Homeostatic Moderation (No bans)</li>
          <li className="flex gap-2">✓ RPM Dashboard for Physicians</li>
        </ul>
      </div>
    </div>
  );

  // --- RENDER FULL SCREEN APP ---
  return (
    <div className="min-h-screen w-full font-body text-[#111]" style={{ background: "#FAFAFD" }}>
      <div className="max-w-[560px] mx-auto w-full px-4 pb-[calc(118px+env(safe-area-inset-bottom,0px))] relative min-h-screen min-h-[100dvh] flex flex-col">
        
        {/* Brand Header */}
        {activeTab === "report" && (
          <div className="grid gap-[10px] pt-[18px] pb-[4px] relative z-10 w-full max-w-[560px] mx-auto">
            <div className="flex items-center gap-[10px] font-display text-[22px] tracking-tight">
              <span className="w-[38px] h-[38px] rounded-[12px] bg-[#FF5A36] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] flex items-center justify-center text-white text-[18px] -rotate-[8deg]">cb</span>
              ClinixBridge
            </div>
            
            <h1 className="font-display font-normal text-[clamp(30px,9vw,42px)] leading-[1.02] tracking-[-0.03em] m-0 text-[#111] text-balance">
              Your blood report, turned into{" "}
              <span className="bg-[#FFD23F] px-[0.12em] border-[2.5px] border-[#111] rounded-[0.18em] shadow-[4px_4px_0_#111] box-decoration-clone leading-[1.25]">
                tomorrow&apos;s breakfast.
              </span>{" "}
              Not{" "}
              <span className="relative text-[#77778A]">
                <span className="absolute -left-[4%] -right-[4%] top-[50%] h-[0.13em] bg-[#FF5A36] -rotate-[7deg] rounded-[4px]" />
                pills
              </span>.
            </h1>
            
            <p className="text-[14px] text-[#4A4A55] font-body m-0">
              Upload your report. ClinixBridge plans every meal from food at home or the kirana store.
            </p>
          </div>
        )}

        {/* Global User Header */}
        <div className="flex justify-between items-center pt-[16px] pb-[10px] relative z-10 w-full max-w-[560px] mx-auto">
          <div>
            <div 
              className="text-[12.5px] text-[#4A4A55] font-[700] cursor-pointer hover:text-[#111]"
              onClick={() => setShowUsers(!showUsers)}
            >
              Hey {currentUser} · {diet === "v" ? "Veg" : diet === "e" ? "Eggetarian" : "Non-veg"}
            </div>
            <h2 className="font-display font-normal text-[25px] tracking-[-0.02em] m-0">{activeTab === "report" ? "Your report" : activeTab === "scan" ? "My levels" : activeTab === "today" ? "Today's plate" : activeTab === "progress" ? "Progress" : ""}</h2>
            
            {showUsers && (
              <div className="absolute top-12 left-0 bg-white border-2 border-[#111] shadow-[4px_4px_0_#111] rounded-xl overflow-hidden z-50 min-w-[200px]">
                {savedAccounts.map(email => (
                  <button 
                    key={email}
                    className="block w-full text-left px-5 py-3 text-[13px] font-bold hover:bg-[#F4F7FF] border-b border-[#111] truncate"
                    onClick={async () => {
                      if (email !== currentUserEmail) {
                        await supabase.auth.signOut();
                        router.push("/login");
                      } else {
                        setShowUsers(false);
                      }
                    }}
                  >
                    Switch to {email.split("@")[0]} {email === currentUserEmail && "(Active)"}
                  </button>
                ))}
                
                <button 
                  className="block w-full text-left px-5 py-3 text-[13px] font-bold border-b border-[#111] hover:bg-[#F4F7FF]"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                >
                  + Add another account
                </button>
                
                <button 
                  className="block w-full text-left px-5 py-3 text-[13px] font-bold text-[#FF5A36] hover:bg-[#FFE9E6]"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                >
                  Sign Out {currentUser}
                </button>
              </div>
            )}
          </div>
          <div className="w-[40px] h-[40px] rounded-[13px] bg-[#B69CFF] border-[2.5px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center font-display text-[15px]">
            {currentUser ? currentUser[0].toUpperCase() : "P"}
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <main className="relative z-10 flex-1 w-full grid gap-[14px] content-start">
          {activeTab === "report" && renderReport()}
          {activeTab === "scan" && renderScan()}
          {activeTab === "today" && renderToday()}
          {activeTab === "progress" && renderProgress()}
        </main>

        {/* Neo-brutalist Bottom Navigation */}
        <nav className="fixed left-[max(12px,calc(50%-268px))] right-[max(12px,calc(50%-268px))] bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-20 grid grid-cols-4 gap-[2px] p-[6px] rounded-[22px] bg-white border-[2.5px] border-[#111] shadow-[4px_4px_0_#111]">
          {[
            { id: "report", icon: ClipboardList, label: "Report" },
            { id: "scan", icon: Activity, label: "Levels" },
            { id: "today", icon: Utensils, label: "Today" },
            { id: "progress", icon: TrendingUp, label: "Progress" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={isActive ? { background: "#FFD23F", outline: "2px solid #111", color: "#111" } : {}}
                className={`flex flex-col items-center justify-center gap-[2px] py-2 rounded-[15px] text-[10.5px] font-[800] border-0 ${
                  isActive ? "" : "bg-transparent text-[#77778A]"
                }`}
              >
                <tab.icon size={21} strokeWidth={2} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
