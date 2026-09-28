"use client";
import React, { useState } from "react";
import { Activity, ClipboardList, Utensils, TrendingUp, ShieldCheck } from "lucide-react";

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
  const PATIENTS = ["Neel", "Priya", "Dr. Kailash"];
  const [sex, setSex] = useState("M");
  const [diet, setDiet] = useState("v");
  const [weight, setWeight] = useState("58");
  const [activity, setActivity] = useState("everyday");
  const [vals, setVals] = useState<any>({ ...SAMPLE });
  const [pm, setPm] = useState("vitd"); 

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

  // --- TAB 1: REPORT ---
  const renderReport = () => (
    <div className="flex flex-col gap-5 pb-8">
      
      {/* 1. Functional Blue Dropzone */}
      <label className="cursor-pointer block w-full bg-[#5EB0FF] border-[2.5px] border-dashed border-[#111] rounded-[24px] py-10 px-4 text-center relative transition-transform active:scale-[0.98]">
        <input 
          type="file" 
          accept=".pdf,image/png,image/jpeg" 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) alert(`Demo Mode: "${file.name}" received. Kami AI is scanning...`);
          }} 
        />
        <div className="mx-auto w-[54px] h-[54px] bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[3px_3px_0_#111] flex items-center justify-center mb-4 -rotate-[6deg]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
            <path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>
          </svg>
        </div>
        <b className="block text-[19px] font-black mb-1.5 text-[#111]">Drop your blood report</b>
        <span className="text-[12px] font-bold text-[#111] opacity-90">PDF or photo · CBC, Vit D, B12, iron profile</span>
      </label>

      {/* Paste Report Accordion */}
      <details className="bg-white border-[2.5px] border-[#111] rounded-[20px] p-[15px] shadow-[4px_4px_0_#111]">
        <summary className="cursor-pointer font-[800] text-[14px] list-none flex justify-between items-center text-[#111]">
          Or paste the report text
        </summary>
        <textarea 
          className="w-full min-h-[90px] rounded-[12px] border-[2px] border-[#111] bg-[#FAFAFD] p-[10px] font-[var(--font-mono)] text-[12px] mt-2 mb-2 focus:outline-none focus:ring-2 focus:ring-[#5AB0FF] focus:border-transparent" 
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
            <div className="font-[var(--font-mono)] text-[10.5px] text-[#77778A]">helps set your protein goal</div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" className="w-[84px] h-[36px] border-[2px] border-[#111] rounded-[10px] px-[8px] bg-white font-[var(--font-mono)] text-[13px] text-right" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <span className="w-[30px] font-[var(--font-mono)] text-[10px] text-[#77778A]">kg</span>
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
                  <div className="font-[var(--font-mono)] text-[10.5px] text-[#77778A]">normal {pick(m.low, sex)}–{pick(m.hi, sex)}</div>
                </div>
                <input type="number" className="w-full border-[2px] border-[#111] rounded-[10px] py-[6px] px-[8px] bg-white font-[var(--font-mono)] text-[13px] text-right" value={vals[m.id] || ""} onChange={(e) => setVals({ ...vals, [m.id]: parseFloat(e.target.value) })} />
                <span className="font-[var(--font-mono)] text-[10px] text-[#77778A]">{m.unit}</span>
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
      <div className="flex flex-col gap-3.5 pb-6">
        <div className="hero-score">
          <div className="ring" style={{ "--p": pct } as React.CSSProperties}><span>{okCount}/{rows.length}</span></div>
          <div>
            <h3>{rows.length - okCount ? `${rows.length - okCount} biomarkers to balance` : "Homeostasis Achieved"}</h3>
            <p>{rows.length - okCount ? "Generating bioavailable moderation protocols." : "We'll keep you balanced."}</p>
          </div>
        </div>
        
        {crits.length > 0 && (
          <div className="docflag">
            <b>Mandatory 7-Day Triage Alert:</b> Please consult a physician about {crits.map(r => r.m.name).join(", ")}. These markers fall outside safe homeostatic moderation limits.
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
              {s!.k !== "ok" && (<div className="eat">{m.why}<br/><b>Bioavailable Culinary Source:</b> {FOODS[m.nut]}</div>)}
            </div>
          );
        })}
      </div>
    );
  };

  // --- TAB 3: TODAY ---
  const renderToday = () => {
    const dietOK = (m: any) => diet === "n" || (diet === "e" ? m.d !== "n" : m.d === "v");
    const todayMeals = CLINIX_MEALS.filter(dietOK).slice(0, 4);

    return (
      <div className="flex flex-col gap-3.5 pb-6">
        <div className="grid grid-cols-[36px_1fr] gap-2.5 items-end">
          <div className="w-9 h-9 rounded-xl bg-[var(--tomato)] text-white border-[var(--bw)] border-[var(--ink)] flex items-center justify-center font-[var(--font-display)] text-[15px] -rotate-6">cb</div>
          <div className="bg-[var(--sun)] rounded-[20px_20px_20px_6px] p-3 text-sm font-medium border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)]">
            Morning Neel! Day 1 of your homeostatic protocol. All recipes below prioritize zero-waste cooking to maximize bioavailability.
          </div>
        </div>
        {todayMeals.map((m, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr] gap-3 items-start bg-[var(--card)] rounded-[20px] p-3 border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)]">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center font-[var(--font-display)] text-[17px] border-[var(--bw)] border-[var(--ink)] ${m.s === 'b' ? 'bg-[var(--sun)] text-[var(--ink)]' : m.s === 'l' ? 'bg-[var(--tomato)] text-white' : m.s === 's' ? 'bg-[var(--sky)] text-[var(--ink)]' : 'bg-[var(--lilac)] text-[var(--ink)]'}`}>
              {TILE[m.s]}
            </span>
            <div>
              <div className="text-[10.5px] font-extrabold tracking-widest uppercase text-[var(--muted)]">{SLOT[m.s]}</div>
              <div className="font-extrabold text-[15.5px] my-0.5 leading-tight">{m.t}</div>
              <p className="text-[12.5px] text-[var(--muted)] m-0">{m.x}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- TAB 4: PROGRESS ---
  const renderProgress = () => {
    const activeMarker = MARKERS.find(m => m.id === pm) || MARKERS[0];
    return (
      <div className="flex flex-col gap-3.5 pb-6">
        <div className="bg-[var(--mint)] border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)] rounded-[22px] p-4 grid gap-1">
          <span className="label text-[var(--ink)]">RPM Dashboard Analytics</span>
          <div className="font-[var(--font-display)] text-[27px] leading-[1.05]">
            <em className="not-italic bg-white px-1.5 rounded-lg border-2 border-[var(--ink)]">3 of 9</em> markers stabilizing
          </div>
        </div>
        <div className="glass chart">
          <div className="flex justify-between items-baseline mb-1.5">
            <b className="font-[var(--font-display)] font-normal text-[16px]">{activeMarker.name}</b>
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
    <div className="flex flex-col gap-3.5 pb-6">
      <div className="bg-[var(--card)] border-[var(--bw)] border-[var(--ink)] rounded-[22px] p-4 grid gap-2.5 shadow-[var(--sh2)] bg-[var(--sun)]">
        <span className="pill bg-[var(--tomato)] text-white w-max">Hackathon Core</span>
        <span className="font-[var(--font-display)] text-[17px]">Clinical Guardrails</span>
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
    <div className="min-h-screen w-full font-[var(--font-body)] text-[#111]">
      <div className="max-w-[540px] mx-auto w-full px-5 pt-6 pb-[120px] relative min-h-screen flex flex-col">
        
        {/* Brand Header */}
        {activeTab === "report" && (
          <div className="grid gap-[10px] pt-[18px] pb-[4px] px-[2px] relative z-10 w-full max-w-[560px] mx-auto">
            <div className="flex items-center gap-[10px] font-[var(--font-display)] text-[22px] tracking-tight">
              <span className="w-[38px] h-[38px] rounded-[12px] bg-[#FF5A36] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] flex items-center justify-center text-white text-[18px] -rotate-[8deg]">cb</span>
              ClinixBridge
            </div>
            
            <h1 className="font-[var(--font-display)] font-normal text-[clamp(30px,9vw,42px)] leading-[1.02] tracking-[-0.03em] m-0 text-[#111] text-balance">
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
            
            <p className="text-[14px] text-[#4A4A55] font-[var(--font-body)] m-0">
              Upload your report. ClinixBridge plans every meal from food at home or the kirana store.
            </p>
          </div>
        )}

        {/* Global User Header */}
        <div className="flex justify-between items-center py-[18px] px-0 pb-[10px] relative z-10">
          <div>
            <div 
              className="text-[12.5px] text-[#4A4A55] font-[700] cursor-pointer hover:text-[#111]"
              onClick={() => setShowUsers(!showUsers)}
            >
              Hey {currentUser} · {diet === "v" ? "Veg" : diet === "e" ? "Eggetarian" : "Non-veg"}
            </div>
            <h2 className="font-[var(--font-display)] font-normal text-[25px] tracking-[-0.02em] capitalize m-0 mt-0.5">{activeTab}</h2>
            
            {showUsers && (
              <div className="absolute top-12 left-0 bg-white border-2 border-[#111] shadow-[4px_4px_0_#111] rounded-xl overflow-hidden z-50">
                {PATIENTS.map(patient => (
                  <button 
                    key={patient}
                    className="block w-full text-left px-5 py-3 text-[14px] font-bold hover:bg-[#F4F7FF] border-b last:border-0 border-[#111]"
                    onClick={() => { setCurrentUser(patient); setShowUsers(false); }}
                  >
                    Switch to {patient}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-[40px] h-[40px] rounded-[13px] bg-[#B69CFF] border-[2.5px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center font-[var(--font-display)] text-[15px]">
            {currentUser ? currentUser[0].toUpperCase() : "P"}
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <main className="relative z-10 flex-1 w-full">
          {activeTab === "report" && renderReport()}
          {activeTab === "scan" && renderScan()}
          {activeTab === "today" && renderToday()}
          {activeTab === "progress" && renderProgress()}
          {activeTab === "plans" && renderPlans()}
        </main>

        {/* Neo-brutalist Bottom Navigation */}
        <nav className="fixed left-[max(12px,calc(50%-268px))] right-[max(12px,calc(50%-268px))] bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-20 grid grid-cols-5 gap-[2px] p-[6px] rounded-[22px] bg-white border-[2.5px] border-[#111] shadow-[4px_4px_0_#111]">
          {[
            { id: "report", icon: ClipboardList, label: "Report" },
            { id: "scan", icon: Activity, label: "Levels" },
            { id: "today", icon: Utensils, label: "Today" },
            { id: "progress", icon: TrendingUp, label: "Progress" },
            { id: "plans", icon: ShieldCheck, label: "Pro" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-[2px] py-2 rounded-[15px] text-[10.5px] font-[800] transition-all bg-transparent border-0 ${
                  isActive
                    ? "bg-[#FFD23F] text-[#111] outline outline-2 outline-[#111]"
                    : "text-[#77778A]"
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