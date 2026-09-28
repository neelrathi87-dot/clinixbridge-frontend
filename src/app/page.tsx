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
  { id:"alb", name:"Albumin", unit:"g/dL", low:3.5, bord:3.8, hi:5.0, crit:2.8, nut:"protein", why:"A marker of overall protein intake." }
];

const FOODS: any = {
  iron: "palak (spinach), rajma, kala chana, bajra, jaggery",
  vitd: "20 min morning sun, sun-dried local mushrooms, fortified milk",
  b12: "dahi (curd), paneer, milk, chaas",
  folate: "methi, palak, moong sprouts, local beetroot",
  calcium: "ragi, milk, curd, paneer, til (sesame)",
  magnesium: "pumpkin seeds, peanuts, banana, bajra",
  zinc: "pumpkin seeds, chana, dahi",
  protein: "dal, paneer, soya chunks, sprouts"
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
  const router = useRouter();
  
  const fetchReports = async () => {
    // Because of RLS, this automatically only fetches data for the logged-in user!
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data && data.length > 0) {
      // In a full integration, you'd map this directly to setVals, setDiet, etc.
      console.log('Securely fetched isolated patient data:', data);
    }
  };

  const [savedAccounts, setSavedAccounts] = useState<string[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

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

  const removeAccount = (emailToRemove: string) => {
    const updated = savedAccounts.filter(e => e !== emailToRemove);
    setSavedAccounts(updated);
    localStorage.setItem("clinix_saved_accounts", JSON.stringify(updated));
  };

  const [activeTab, setActiveTab] = useState("report");
  const [currentUser, setCurrentUser] = useState("Doctor");
  const [showUsers, setShowUsers] = useState(false);
  const [sex, setSex] = useState("M");
  const [diet, setDiet] = useState("v");
  const [weight, setWeight] = useState("58");
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
    <div className="flex flex-col gap-3.5 pb-6">
      <label className="drop">
        <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26"><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg></span>
        <b>Drop your lab report</b>
        <span>PDF or photo · CBC, Vit D, B12, iron profile</span>
      </label>

      <div className="glass" style={{ display: "grid", gap: "10px" }}>
        <span className="label">About you</span>
        <div className="seg" role="group">
          <button aria-pressed={sex === "F"} onClick={() => setSex("F")}>Female</button>
          <button aria-pressed={sex === "M"} onClick={() => setSex("M")}>Male</button>
        </div>
        <div className="seg" role="group">
          <button aria-pressed={diet === "v"} onClick={() => setDiet("v")}>Veg</button>
          <button aria-pressed={diet === "e"} onClick={() => setDiet("e")}>Egg ok</button>
          <button aria-pressed={diet === "n"} onClick={() => setDiet("n")}>Non-veg</button>
        </div>
        <div className="mk" style={{ border: 0, padding: "2px 0" }}>
          <div>
            <div className="nm">Body weight</div>
            <div className="rg">helps set protein limits</div>
          </div>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <span className="u">kg</span>
        </div>
      </div>

      <div className="glass">
        <div className="row" style={{ marginBottom: "2px" }}>
          <span className="label">Report values</span>
          <button className="mini" onClick={() => setVals({ ...SAMPLE })}>Load example</button>
        </div>
        {MARKERS.map((m) => {
          const s = getStatus(m);
          const dotColor = s ? `var(--${s.k})` : "var(--dim)";
          return (
            <div className="mk" key={m.id}>
              <div>
                <div className="nm"><span className="dot" style={{ background: dotColor }}></span>{m.name}</div>
                <div className="rg">normal {pick(m.low, sex)}–{pick(m.hi, sex)}</div>
              </div>
              <input type="number" value={vals[m.id] || ""} onChange={(e) => setVals({ ...vals, [m.id]: parseFloat(e.target.value) })} />
              <span className="u">{m.unit}</span>
            </div>
          );
        })}
      </div>
      <button className="btn" onClick={() => setActiveTab("scan")}>Scan my levels <span>→</span></button>
    </div>
  );

  // --- TAB 2: SCAN (HOMEOSTASIS) ---
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

  // --- TAB 3: TODAY (RECIPES) ---
  const renderToday = () => {
    const dietOK = (m: any) => diet === "n" || (diet === "e" ? m.d !== "n" : m.d === "v");
    const todayMeals = CLINIX_MEALS.filter(dietOK).slice(0, 4);

    return (
      <div className="flex flex-col gap-3.5 pb-6">
        <div className="grid grid-cols-[36px_1fr] gap-2.5 items-end">
          <div className="w-9 h-9 rounded-xl bg-[var(--tomato)] text-white border-[var(--bw)] border-[var(--ink)] flex items-center justify-center font-[var(--font-display)] text-[15px] -rotate-6">cb</div>
          <div className="bg-[var(--sun)] rounded-[20px_20px_20px_6px] p-3 text-sm font-medium border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)]">
            Morning Neel! Day 1 of your homeostatic protocol. All recipes below prioritize zero-waste cooking to maximize <b>bioavailability</b>.
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[18px] p-3 text-[13px] text-[var(--muted)] bg-[#E3F2FF] border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)]">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--sky)] border-2 border-[var(--ink)] flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          </span>
          <div>
            <b className="block text-[var(--ink)] text-[13.5px]">Somatic Pain Protocol Active</b>
            Minor joint pain reported. Organic relief foods prioritized. If pain persists beyond 7 days, a mandatory physician referral will trigger.
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
              <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                {m.n.map((nut: string) => (<span key={nut} className="text-[10.5px] font-extrabold py-0.5 px-2 rounded-full bg-[var(--pink)] border-[1.5px] border-[var(--ink)] capitalize">+ {nut}</span>))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- TAB 4: PROGRESS (RPM) ---
  const renderProgress = () => {
    const activeMarker = MARKERS.find(m => m.id === pm) || MARKERS[0];
    
    // Inline SVG Line Chart Generator
    const renderLineChart = (m: any) => {
      const pts = SAMPLE_HISTORY.map(r => ({ d: r.date, v: (r.vals as any)[m.id] }));
      const W = 320, H = 180, L = 14, R = 14, T = 26, B = 28;
      const lo = pick(m.low, sex), hi = pick(m.hi, sex);
      const vs = pts.map(p => p.v);
      let mn = Math.min(...vs, lo), mx = Math.max(...vs, lo);
      const pad = (mx - mn || lo * .2) * .35;
      mn = Math.max(0, mn - pad); mx = mx + pad;
      const y = (v: number) => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
      const x = (i: number) => pts.length < 2 ? W / 2 : L + 18 + i * ((W - L - R - 36) / (pts.length - 1));
      const bandTop = y(Math.min(hi, mx)), bandBot = y(lo);
      const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
      const area = pts.length > 1 ? `${path} L${x(pts.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z` : "";
      
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block mt-4">
          <defs>
            <linearGradient id="lg" x1="0" x2="1"><stop offset="0" stopColor="#FF7A45" /><stop offset=".5" stopColor="#FF4D8D" /><stop offset="1" stopColor="#8D6CFF" /></linearGradient>
            <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FF4D8D" stopOpacity=".28" /><stop offset="1" stopColor="#FF4D8D" stopOpacity="0" /></linearGradient>
          </defs>
          <rect x={L} y={bandTop} width={W - L - R} height={Math.max(0, bandBot - bandTop)} fill="rgba(51,214,159,.16)" />
          <line x1={L} x2={W - R} y1={bandBot} y2={bandBot} stroke="#33D69F" strokeOpacity=".7" strokeDasharray="4 4" />
          <text x={W - R} y={bandBot - 6} textAnchor="end" fill="#0E9F6E" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="700">NORMAL ≥ {lo}</text>
          {area && <path d={area} fill="url(#ag)" />}
          <path d={path} fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => {
            const last = i === pts.length - 1;
            return (
              <g key={i}>
                <circle cx={x(i)} cy={y(p.v)} r={last ? 6.5 : 4.5} fill={last ? "#FFD23F" : "#FFFFFF"} stroke={last ? "#FF4D8D" : "#444444"} strokeWidth={last ? 3.5 : 2} />
                <text x={x(i)} y={y(p.v) - 12} textAnchor="middle" fill={last ? "#111111" : "#444444"} fontFamily="var(--font-mono)" fontSize="11" fontWeight="700">{p.v}</text>
                <text x={x(i)} y={H - 8} textAnchor="middle" fill="#6A6A7A" fontFamily="var(--font-body)" fontSize="10.5" fontWeight="700">{fmtShort(p.d)}</text>
              </g>
            );
          })}
        </svg>
      );
    };

    return (
      <div className="flex flex-col gap-3.5 pb-6">
        <div className="bg-[var(--mint)] border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)] rounded-[22px] p-4 grid gap-1">
          <span className="label text-[var(--ink)]">RPM Dashboard Analytics</span>
          <div className="font-[var(--font-display)] text-[27px] leading-[1.05]">
            <em className="not-italic bg-white px-1.5 rounded-lg border-2 border-[var(--ink)]">3 of 9</em> markers stabilizing
          </div>
          <p className="text-[13px] font-semibold m-0 mt-1">Biggest win: Vitamin D safely rising toward homeostasis via organic absorption.</p>
        </div>

        <div className="glass retest grid gap-2">
          <span className="label text-[var(--tomato)]">Somatic Pain Triage Active</span>
          <span className="font-[var(--font-display)] text-[18px]">Day 2 of 7</span>
          <div className="h-[14px] rounded-full bg-white border-2 border-[var(--ink)] overflow-hidden">
             <div className="h-full bg-[var(--tomato)] transition-all" style={{ width: '28%' }}></div>
          </div>
          <small className="text-[12px] text-[var(--muted)] leading-snug">
            If self-reported minor joint pain does not resolve by Day 7, organic recommendations halt and a mandatory physician referral triggers.
          </small>
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
          {renderLineChart(activeMarker)}
        </div>
      </div>
    );
  };

  // --- RENDER FULL SCREEN MOBILE APP ---
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-[var(--font-body)]">
      <div className="max-w-[560px] mx-auto w-full px-4 pt-4 pb-[120px] relative min-h-screen flex flex-col">
        
        {/* Full-Screen Mobile Brand Header (Only visible on Report tab) */}
        {activeTab === "report" && (
          <div className="grid gap-2.5 pt-4 pb-2 relative z-10">
            <div className="flex items-center gap-2.5 font-[var(--font-display)] text-[22px] tracking-tight">
              <span className="w-[38px] h-[38px] rounded-xl bg-[var(--tomato)] border-[var(--bw)] border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] flex items-center justify-center text-white text-lg -rotate-6">cb</span>
              ClinixBridge
            </div>
            <h1 className="font-normal text-[clamp(30px,9vw,42px)] leading-[1.02] tracking-tight m-0">
              Your lab report, turned into <span className="bg-[var(--sun)] px-1.5 border-[var(--bw)] border-[var(--ink)] rounded-md shadow-[var(--sh)] inline-block">bioavailable nutrition.</span> Not <span className="relative text-[var(--dim)] after:content-[''] after:absolute after:-left-[4%] after:-right-[4%] after:top-1/2 after:h-[0.13em] after:bg-[var(--tomato)] after:-rotate-[7deg] after:rounded-sm">pills</span>.
            </h1>
            <p className="text-sm text-[var(--muted)] m-0">
              Upload your report. ClinixBridge calculates homeostatic thresholds and generates local recipes using zero-waste cooking methods.
            </p>
          </div>
        )}

        {/* Global App Header with Patient Switcher */}
        <div className="flex justify-between items-center py-4 relative z-10" style={{ zIndex: 100 }}>
          <div>
            {/* Clickable Profile Switcher */}
            <div 
              className="text-[12.5px] text-[var(--muted)] font-bold cursor-pointer hover:text-[var(--ink)] flex items-center gap-1"
              onClick={() => setShowUsers(!showUsers)}
            >
              Patient: {currentUser} · {diet === "v" ? "Veg" : diet === "e" ? "Eggetarian" : "Non-veg"}
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            
            <h2 className="font-[var(--font-display)] font-normal text-[25px] tracking-tight capitalize m-0">{activeTab}</h2>
            
            {/* Dropdown Menu */}
            {showUsers && (
              <div className="absolute top-12 left-0 w-[220px] bg-white border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)] rounded-xl overflow-hidden z-50">
                <div className="px-4 py-2 bg-[var(--paper)] border-b border-[var(--ink)] text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                  Saved Accounts
                </div>
                
                {savedAccounts.map(email => (
                  <div key={email} className="flex justify-between items-center border-b border-[var(--ink)] hover:bg-[var(--paper)] transition-colors">
                    <button 
                      className="flex-1 text-left px-4 py-2.5 text-[13px] font-bold truncate"
                      onClick={async () => {
                        if (email !== currentUserEmail) {
                          await supabase.auth.signOut();
                          // In a full implementation, you'd pass the email as a URL param to prefill the login
                          router.push("/login");
                        } else {
                          setShowUsers(false);
                        }
                      }}
                    >
                      {email.split("@")[0]} {email === currentUserEmail && "(Active)"}
                    </button>
                    
                    {email !== currentUserEmail && (
                      <button 
                        onClick={() => removeAccount(email)}
                        className="px-3 py-2.5 text-[var(--tomato)] hover:bg-[#FFE9E6] font-extrabold text-[12px] border-l border-[var(--ink)]"
                        title="Remove Account"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  className="block w-full text-left px-4 py-2.5 text-[13px] font-bold border-b border-[var(--ink)] hover:bg-[var(--paper)]"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                >
                  + Add another account
                </button>
                
                <button 
                  className="block w-full text-left px-4 py-2.5 text-[13px] font-bold text-[var(--tomato)] hover:bg-[#FFE9E6]"
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
          
          <div className="w-10 h-10 rounded-xl bg-[var(--lilac)] border-[var(--bw)] border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center font-[var(--font-display)] text-[15px]">
            {currentUser.charAt(0)}
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <main className="relative z-10 flex-1 w-full">
          {activeTab === "report" && renderReport()}
          {activeTab === "scan" && renderScan()}
          {activeTab === "today" && renderToday()}
          {activeTab === "progress" && renderProgress()}
        </main>

        {/* Fixed Bottom Navigation */}
        <nav className="fixed left-4 right-4 md:left-1/2 md:-translate-x-1/2 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] md:w-full md:max-w-[536px] z-20 grid grid-cols-4 gap-0.5 p-1.5 rounded-[22px] bg-white border-[var(--bw)] border-[var(--ink)] shadow-[var(--sh)]">
          {[
            { id: "report", icon: ClipboardList, label: "Report" },
            { id: "scan", icon: Activity, label: "Levels" },
            { id: "today", icon: Utensils, label: "Today" },
            { id: "progress", icon: TrendingUp, label: "Progress" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-[15px] text-[10.5px] font-extrabold transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--sun)] text-[var(--ink)] outline outline-2 outline-[var(--ink)]"
                  : "text-[var(--dim)] hover:text-[var(--ink)]"
              }`}
            >
              <tab.icon size={21} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}