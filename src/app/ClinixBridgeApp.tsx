"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// --- CONSTANTS & DATA ---
const NUT_LABEL: any = { iron: "Iron", b12: "B12", vitd: "Vit D", vitc: "Vit C", calcium: "Calcium", mag: "Magnesium", zinc: "Zinc", folate: "Folate", tlc: "WBC Boost", neutro: "Neutrophils", lympho: "Lymphocytes", rbc: "RBC Boost", eosino: "Eosinophils", mono: "Monocytes", baso: "Basophils", hct: "HCT", mcv: "MCV", mch: "MCH", mchc: "MCHC" };
const FOODS: any = {
  iron: "Moong, chana, palak, methi, bajra, seeds, raisins.",
  b12: "Curd, milk, paneer, eggs, chicken, fish. (Very hard on purely veg diet).",
  vitd: "Sunlight! Plus egg yolks, fortified milk, mushrooms.",
  calcium: "Milk, curd, paneer, ragi, sesame, chia, almonds, leafy greens.",
  mag: "Pumpkin seeds, almonds, peanuts, spinach, dark chocolate.",
  zinc: "Pumpkin seeds, chickpeas, cashews, curd, eggs.",
  folate: "Lentils, chana, spinach, bhindi, beetroot."
};

const MARKERS = [
  { id: "hb", name: "Haemoglobin", unit: "g/dL", keys: ["haemoglobin","hemoglobin","hb"], low: { M: 13.0, F: 12.0 }, hi: { M: 17.0, F: 15.0 }, nut: "iron", why: "Carries oxygen. Low hb means fatigue and weakness.", crit: { M: 10, F: 9 } },
  { id: "ferritin", name: "Ferritin", unit: "ng/mL", keys: ["ferritin"], low: 30, hi: { M: 400, F: 150 }, nut: "iron", why: "Your iron storage. It runs out before hb drops. Low ferritin causes hair fall and exhaustion.", crit: 15 },
  { id: "vitd", name: "Vitamin D", unit: "ng/mL", keys: ["vitamin d","25-oh","25 oh","vit d"], low: 30, hi: 100, nut: "vitd", why: "Needed to absorb calcium. Low vit D causes bone pain, weak immunity, and tiredness.", crit: 12 },
  { id: "b12", name: "Vitamin B12", unit: "pg/mL", keys: ["vitamin b12","b12","cobalamin"], low: 300, hi: 900, nut: "b12", why: "Vital for nerves and brain. Low B12 causes tingling, memory issues, and extreme fatigue.", crit: 150 },
  { id: "folate", name: "Folate (B9)", unit: "ng/mL", keys: ["folate","folic acid"], low: 4.0, hi: 20.0, nut: "folate", why: "Works with B12 to make red blood cells. Low folate causes anemia and mouth ulcers.", crit: 2 },
  { id: "calcium", name: "Calcium", unit: "mg/dL", keys: ["calcium"], low: 8.5, hi: 10.5, nut: "calcium", why: "Builds bones. If low, your body steals it from your skeleton.", crit: 7.5 },
  { id: "mag", name: "Magnesium", unit: "mg/dL", keys: ["magnesium","mag"], low: 1.7, hi: 2.2, nut: "mag", why: "Controls muscle and nerve function. Low mag causes cramps, twitches, and bad sleep.", crit: 1.2 },
  { id: "zinc", name: "Zinc", unit: "μg/dL", keys: ["zinc"], low: 70, hi: 120, nut: "zinc", why: "Crucial for immunity and healing. Low zinc leads to frequent colds and skin issues.", crit: 50 },
    { id:"tlc", name:"Total Leukocyte (WBC)", unit:"cumm", keys: ["tlc", "total leukocyte", "wbc", "white blood cell"], low:4800, hi:10800, crit:3500, nut:"vitc", why:"Measures overall immune health. Low values risk infection; high indicates acute stress." },
    { id:"neutro", name:"Neutrophils", unit:"%", keys: ["neutrophils", "neutro"], low:40, hi:80, crit:20, nut:"vitc", why:"First responders to bacterial infections in the body." },
    { id:"lympho", name:"Lymphocytes", unit:"%", keys: ["lymphocytes", "lympho"], low:20, hi:40, crit:10, nut:"zinc", why:"Vital for viral defense and creating protective antibodies." },
    { id:"eosino", name:"Eosinophils", unit:"%", keys: ["eosinophils", "eosino"], low:1, hi:6, crit:0, nut:"iron", why:"Elevated levels typically indicate allergic responses or parasitic infections." },
    { id:"mono", name:"Monocytes", unit:"%", keys: ["monocytes", "mono"], low:2, hi:10, crit:1, nut:"iron", why:"Cleans up dead cells and boosts the immune response." },
    { id:"baso", name:"Basophils", unit:"%", keys: ["basophils", "baso"], low:0, hi:2, crit:0, nut:"iron", why:"Involved in inflammatory reactions and allergic responses." },
    { id:"rbc", name:"Total RBC Count", unit:"mil/cumm", keys: ["rbc", "total rbc", "red blood cell"], low:4.5, hi:5.5, crit:3.5, nut:"iron", why:"Carries oxygen through the body. Low values point to chronic hypoxia or anemia." },
    { id:"hct", name:"Hematocrit (HCT)", unit:"%", keys: ["hct", "hematocrit"], low:40, hi:50, crit:30, nut:"iron", why:"Percentage of blood volume that consists of red blood cells." },
    { id:"mcv", name:"MCV", unit:"fL", keys: ["mcv"], low:83, hi:101, crit:75, nut:"b12", why:"Measures the physical size of RBCs. High points to macrocytic anemia (B12 lack)." },
    { id:"mch", name:"MCH", unit:"Pg", keys: ["mch"], low:27, hi:32, crit:24, nut:"iron", why:"Calculates the absolute amount of hemoglobin per red blood cell." },
    { id:"mchc", name:"MCHC", unit:"%", keys: ["mchc"], low:31.5, hi:34.5, crit:28, nut:"iron", why:"Calculates the concentration of hemoglobin in RBCs." }
  ];

const SAMPLE: any = { 
  hb: 15, ferritin: 14, vitd: 16, b12: 182, folate: 6.1, calcium: 9.1, mag: 1.6, zinc: 64, alb: 4.1, plt: 3.5,
  tlc: 5100, neutro: 79, lympho: 18, eosino: 1, mono: 1, baso: 1, rbc: 5, hct: 42, mcv: 84.0, mch: 30.0, mchc: 35.7 
};
const SAMPLE_HISTORY = [
  { date: "2024-03-12", vals: { hb: 10.1, ferritin: 12, vitd: 12, b12: 140, folate: 2.5, calcium: 8.4, mag: 1.3, zinc: 55 } },
  { date: "2024-06-15", vals: { hb: 11.2, ferritin: 18, vitd: 16, b12: 182, folate: 3.2, calcium: 8.8, mag: 1.5, zinc: 65 } }
];


  const SYMPTOMS_LIST = [
    { id: "fatigue", label: "Severe Fatigue", tests: ["CBC", "Iron Profile"] },
    { id: "joint", label: "Joint/Muscle Pain", tests: ["Vitamin D", "Calcium"] },
    { id: "hair", label: "Hair Loss", tests: ["Zinc", "Iron Profile"] }
  ];

  const ADDONS = [
  { id: "curd", t: "1 katori curd", g: 4, d: "v" },
  { id: "milk", t: "1 glass milk", g: 8, d: "v" },
  { id: "paneer", t: "Few paneer cubes", g: 6, d: "v" },
  { id: "egg", t: "1 boiled egg", g: 6, d: "e" },
  { id: "peanut", t: "2 tbsp peanuts", g: 5, d: "v" },
  { id: "chana", t: "Handful roasted chana", g: 5, d: "v" },
  { id: "sattu", t: "Sattu drink", g: 6, d: "v" }
];

const MEALS: any = {
  b: [
      { t: "Bajra Roti + Moringa Dal", d: "v", g: 10, m: "1 roti + 1 bowl dal", v: "Use fresh moringa leaves if available.", n: ["iron", "zinc", "vitc", "rbc", "lympho", "tlc"] },
      { t: "Guava & Curd Bowl", d: "v", g: 8, m: "1 guava chopped + 1 katori curd", v: "Sprinkle black salt for taste.", n: ["vitc", "b12", "calcium", "tlc", "neutro", "mcv"] },
      { t: "Moong sprout chilla + curd", d: "v", g: 14, m: "2 chilla + 1 katori curd", v: "Blend soaked moong, add onion and coriander.", n: ["iron", "b12", "zinc", "calcium"] },
    { t: "Besan chilla + curd", d: "v", g: 12, m: "2 chilla + 1 katori curd", v: "Add spinach and ajwain to batter.", n: ["iron", "b12", "calcium"] },
    { t: "Oats upma + peanuts", d: "v", g: 9, m: "1 big bowl", v: "Load with carrots, peas, and roasted peanuts.", n: ["iron", "mag"] },
    { t: "Poha + sprouts", d: "v", g: 8, m: "1 bowl poha + half bowl sprouts", v: "Squeeze lemon on poha (Vit C helps iron!).", n: ["iron", "vitc"] },
    { t: "Boiled eggs + toast", d: "e", g: 14, m: "2 eggs + 2 slice whole wheat toast", v: "Sprinkle salt and pepper.", n: ["b12", "vitd", "zinc", "iron"] },
    { t: "Paneer bhurji + paratha", d: "v", g: 16, m: "1 bowl bhurji + 1 paratha", v: "Use 50g paneer, add capsicum.", n: ["b12", "calcium"] }
  ],
  l: [
      { t: "Palak Paneer + Bajra Roti", d: "v", g: 18, m: "1 bowl palak paneer + 2 rotis", v: "Rich in iron and calcium.", n: ["iron", "calcium", "b12", "zinc", "rbc", "mchc"] },
      { t: "Rajma chawal + curd", d: "v", g: 15, m: "1 bowl rajma + 1 bowl rice + 1 katori curd", v: "Add a side of cucumber salad.", n: ["iron", "b12", "zinc", "folate"] },
    { t: "Chole + roti + palak", d: "v", g: 18, m: "1 bowl chole + 2 roti + half bowl palak", v: "Squeeze lemon on palak.", n: ["iron", "zinc", "vitc", "folate", "calcium"] },
    { t: "Dal tadka + methi roti", d: "v", g: 14, m: "1 big bowl dal + 2 methi rotis", v: "Mix fresh methi in dough.", n: ["iron", "calcium", "folate"] },
    { t: "Chicken curry + rice", d: "n", g: 25, m: "3 pieces chicken + 1 bowl rice", v: "Home style, less oil.", n: ["b12", "iron", "zinc"] },
    { t: "Egg curry + roti", d: "e", g: 16, m: "2 eggs in gravy + 2 roti", v: "Add peas to the gravy.", n: ["b12", "vitd", "iron"] }
  ],
  d: [
      { t: "Moringa Soup + Moong Khichdi", d: "v", g: 12, m: "1 bowl soup + 1 bowl khichdi", v: "Light but packed with zinc and iron.", n: ["iron", "zinc", "vitc", "lympho", "rbc", "mch"] },
      { t: "Khichdi + curd", d: "v", g: 12, m: "1 big bowl moong dal khichdi + 1 katori curd", v: "Put extra dal, less rice.", n: ["iron", "b12", "mag"] },
    { t: "Paneer sabzi + roti", d: "v", g: 16, m: "1 bowl sabzi + 2 roti", v: "Palak paneer or matar paneer.", n: ["b12", "calcium", "iron", "folate"] },
    { t: "Soya chunks pulao", d: "v", g: 18, m: "1 big bowl", v: "Add beans and carrots.", n: ["iron", "zinc", "mag"] },
    { t: "Mixed dal + daliya", d: "v", g: 14, m: "1 bowl dal + 1 bowl cooked daliya", v: "Very light, high fibre.", n: ["iron", "mag", "folate"] },
    { t: "Fish curry + rice", d: "n", g: 22, m: "2 pieces fish + 1 bowl rice", v: "Fish is great for Vit D and B12.", n: ["b12", "vitd"] }
  ],
  s: [
      { t: "Amla Shot + Roasted Chana", d: "v", g: 6, m: "30ml amla juice + handful chana", v: "Immense Vitamin C boost for immunity.", n: ["vitc", "iron", "folate", "tlc", "neutro"] },
      { t: "Roasted makhana & peanuts", d: "v", g: 6, m: "1 handful mixed", v: "Dry roast with a little salt.", n: ["mag", "calcium"] },
    { t: "Fruit + mixed seeds", d: "v", g: 4, m: "1 apple/banana + 1 tbsp pumpkin/chia seeds", v: "Seeds are magnesium powerhouses.", n: ["mag", "zinc"] },
    { t: "Sattu drink", d: "v", g: 6, m: "1 tall glass", v: "Mix roasted chana powder in water with jeera.", n: ["iron", "mag"] },
    { t: "Sprouted moong chaat", d: "v", g: 7, m: "1 small bowl", v: "Raw sprouts, onion, tomato, lemon.", n: ["iron", "vitc", "folate"] }
  ]
};

const DAYN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export default function ClinixBridgeApp() {
  const [activeTab, setActiveTab] = useState("report");
  const [currentUser, setCurrentUser] = useState("Neelrathi87");
  const [sex, setSex] = useState("M");
  const [diet, setDiet] = useState("v");
  const [weight, setWeight] = useState("58");
  const [pgoal, setPgoal] = useState(0.83);
  const [vals, setVals] = useState<any>({});
  const [pm, setPm] = useState("vitd"); 
  const [day, setDay] = useState(2);
  const [done, setDone] = useState<Record<string, number | null>>({"0-0":1,"0-1":1,"0-2":0.5,"0-3":1,"1-0":1,"1-1":0,"1-2":1,"1-3":1.5,"2-0":1});
  const [swaps, setSwaps] = useState<Record<string, number>>({});
  const [addon, setAddon] = useState<Record<string, string[]>>({"0":["curd"],"1":["egg","milk"]});
  const [reports, setReports] = useState<any[]>([]);
  const [energy, setEnergy] = useState<Record<string, number>>({"0": 3, "1": 4, "2": 2});
  const [files, setFiles] = useState<File[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [pastedText, setPastedText] = useState("");

  useEffect(() => {
    async function initAuth() {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Auth error:', error);
        return;
      }
      if (data?.user) {
        const { data: userReports, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', data.user.id)
          .order('created_at', { ascending: true });
        
        if (!reportsError && userReports) {
          setReports(userReports.map((r: any) => ({ date: r.created_at.split('T')[0], vals: r.vals })));
          if (userReports.length > 0) {
            const lastReport = userReports[userReports.length - 1];
            if (lastReport.weight) setWeight(lastReport.weight);
            if (lastReport.diet) setDiet(lastReport.diet);
          }
        }
      }
    }
    initAuth();
  }, []);

  const handleSaveReport = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    
    const { data, error } = await supabase.from("reports").insert({
      user_id: authData.user.id,
      vals: vals,
      diet: diet,
      weight: weight
    }).select();
    
    if (!error && data) {
      setReports((prev: any) => [...prev, { date: data[0].created_at.split("T")[0], vals: data[0].vals }]);
      setActiveTab("scan");
    } else {
      console.error("Save error:", error);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(t);
  }, [activeTab]);

  const fmtD = (s: string) => { const d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", "'"); };
  const fmtLong = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const pick = (v: any, s: string) => typeof v === "object" ? v[s] : v;
  const distOut = (m: any, v: number, s: string) => { const lo = pick(m.low, s), hi = pick(m.hi, s); return v < lo ? lo - v : v > hi ? v - hi : 0; };
  const nice = (v: number) => Math.abs(v) >= 100 ? Math.round(v) : Math.abs(v) >= 10 ? +v.toFixed(1) : +v.toFixed(2);
  const fmtShort = (d: string) => new Date(d).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", "'");
  
  const getStatus = (m: any) => {
    const v = vals[m.id];
    if (v === "" || v == null) return null;
    const lo = pick(m.low, sex);
    const span = pick(m.hi, sex) - lo;
    if (v < lo) return { k: "low", label: "LOW", crit: v <= pick(m.crit, sex) };
    if (v < lo + span * 0.2) return { k: "mid", label: "BORDERLINE", crit: false };
    return { k: "ok", label: "NORMAL", crit: false };
  };

  const needs = () => {
      const w: any = {};
      MARKERS.forEach(m => {
        const s = getStatus(m);
        if (s && s.k !== "ok") {
          const add = s.k === "low" ? 3 : 1;
          w[m.nut] = (w[m.nut] || 0) + add;
          w[m.id] = (w[m.id] || 0) + add; // Dynamically add exact marker IDs
        }
      });
      // Fallback state: if nothing is needed (all ok), prioritize a maintenance diet
      if (Object.keys(w).length === 0) {
        w.iron = 1; w.zinc = 1; w.b12 = 1; w.vitc = 1;
      }
      return w;
    };

  const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0; return h; };
  const planFor = (dIndex: number) => {
    const w = needs();
    const scores = (item: any) => item.n.reduce((a: number, nut: string) => a + (w[nut] || 0), 0) * 10 + (item.d === diet ? 5 : 0) + (diet === "v" && item.d === "v" ? 5 : 0);
    const getBest = (cat: string) => {
      let opts = MEALS[cat].filter((m: any) => m.d === diet || (diet !== "v" && m.d === "v"));
      if (!opts.length) opts = MEALS[cat];
      opts = opts.sort((a: any, b: any) => scores(b) - scores(a));
      const chosen = opts[Math.abs(hash(dIndex + cat + (swaps[dIndex + "-" + cat] || 0))) % opts.length];
        return { ...chosen, s: cat };
    };
    return [getBest("b"), getBest("l"), getBest("s"), getBest("d")];
  };

  const target = () => Math.round(+weight * +pgoal);
  const amt = (k: string) => done[k];
  const dayTotal = (dIndex: number) => [0, 1, 2, 3].reduce((a, i) => a + Math.min(1.5, amt(dIndex + "-" + i) || 0), 0);
  const addonG = (dIndex: number) => (addon[dIndex] || []).reduce((a, id) => a + (ADDONS.find(x => x.id === id)?.g || 0), 0);
  const dayProtein = (dIndex: number) => {
    const p = planFor(dIndex);
    return Math.round(p.reduce((a, m, i) => a + (amt(dIndex + "-" + i) || 0) * m.g, 0) + addonG(dIndex));
  };
    const SLOT: any = {b:"Breakfast",l:"Lunch",s:"Snack",d:"Dinner"};
  const AMTS=[[0,"Skipped"],[.5,"Half"],[1,"Full"],[1.5,"Extra"]];
  const TILE: any = {b:"B", l:"L", s:"S", d:"D"};
  const mealLevel = (g: number) => g>=20?{n:3,t:"High protein"}:g>=12?{n:2,t:"Good protein"}:g>=6?{n:1,t:"Some protein"}:{n:0,t:"Light on protein"};
  const dayLevel = (r: number) => r >= 0.9 ? { k: "ok", t: "On track" } : r >= 0.5 ? { k: "mid", t: "Getting there" } : { k: "low", t: "Low so far" };

  const toast = (msg: string) => {
    // Basic toast, you could use a state or a library for this in React
    console.log(msg);
  };
  // --- TAB 3: TODAY ---
  const renderToday = () => {
    const w = needs();
    const focus = Object.keys(w).filter(k => w[k as keyof typeof w] >= 3 && k !== "vitc").map(k => NUT_LABEL[k as keyof typeof NUT_LABEL]);
    const plan = planFor(day);
    const key = (i: number) => day + "-" + i;
    const total = dayTotal(day);
    const logged = [0, 1, 2, 3].filter(i => amt(key(i)) != null).length;
    let streak = 0;
    for (let d = 0; d < 7; d++) { if (dayTotal(d) >= 3) streak++; }
    const pct = Math.round(total / 4 * 100);
    const tg = target();
    const pe = dayProtein(day);
    const planned = Math.round(plan.reduce((a: number, m: any) => a + m.g, 0));
    const lv = dayLevel(pe / tg);
    const myAdd = addon[day] || [];
    const addons = ADDONS.filter(a => a.d === "v" || diet !== "v");

    const dots = (n: number) => (
      <span className="dots" aria-hidden="true">
        {[1, 2, 3].map(i => <i key={i} className={i <= n ? "on" : ""} />)}
      </span>
    );

    return (
      <>
        <div className="bot">
          <div className="avatar">cb</div>
          <div className="bubble">
            Morning {currentUser}! Day {day + 1} of your plan. Today we&apos;re pushing <b>{focus.length ? focus.join(", ") : "balance"}</b>. Everything below is from your kitchen or the kirana store.
          </div>
        </div>

        <div className="days" role="group" aria-label="Day">
          {DAYN.map((d, i) => (
            <button key={i} data-day={i} aria-pressed={day === i} onClick={() => setDay(i)}>
              <small>{d}</small><span>{i + 1}</span>
            </button>
          ))}
        </div>

        <div className="prog">
          <span>{pct}% of plan</span>
          <span className="track"><i style={{ width: `${mounted ? Math.min(100, pct) : 0}%` }}></i></span>
          <span className="streak">{streak} day streak</span>
        </div>

        <div className="pcard">
          <div className="row">
            <span className="label">Protein today</span>
            {dots(lv.k === "ok" ? 3 : lv.k === "mid" ? 2 : 1)}
          </div>
          <div className="pbig">
            <b className={lv.k}>{lv.t}</b>
          </div>
          <div className="ptrack">
            <i style={{ width: `${mounted ? Math.min(100, pe / tg * 100) : 0}%` }}></i>
            <s style={{ left: `${Math.min(100, planned / tg * 100)}%` }} title="Full plan"></s>
          </div>
          <div className="pscale">
            <span>Low</span><span>Getting there</span><span>On track</span>
          </div>
          <p className="note">
            {lv.k === "ok" ? "Your protein looks good for today." : planned / tg >= .9 ? "Eat the rest of today's plan and you'll be on track." : "Today's plan is a little light. Add one of these to any meal:"}
          </p>
          <div className="adds">
            {addons.map(a => (
              <button 
                key={a.id} 
                onClick={() => setAddon(prev => ({ ...prev, [day]: [...(prev[day] || []), a.id] }))}
              >
                + {a.t}
              </button>
            ))}
          </div>
          {myAdd.length > 0 && (
            <p className="note">
              Added: {myAdd.map((id: string) => ADDONS.find(a => a.id === id)?.t).filter(Boolean).join(", ")} · 
              <button 
                className="swap" 
                onClick={() => setAddon((prev: any) => { const n = { ...prev }; delete n[day]; return n; })}
              >
                Clear
              </button>
            </p>
          )}
        </div>

        {w.vitd && (
          <div className="habit">
            <span className="hi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </span>
            <div>
              <b>Sun break · 10:30 am</b>
              20 minutes of sun on your arms and face. The cheapest Vitamin D there is.
            </div>
          </div>
        )}

        {plan.map((m: any, i: number) => {
          const k = key(i);
          const a = amt(k);
          const st = a == null ? "" : a === 0 ? "skipped" : "logged";
          const ml = mealLevel(m.g);

          return (
            <div key={i} className={`meal ${m.s} ${st}`}>
              <span className="tile">
                {a != null && a > 0 ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                ) : (
                  TILE[m.s as keyof typeof TILE]
                )}
              </span>
              <div>
                <div className="when">{SLOT[m.s as keyof typeof SLOT]}</div>
                <div className="mt">{m.t}</div>
                <div className="portion">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11h18a9 9 0 0 1-18 0z" />
                    <path d="M8 7c0-1 1-1 1-2M12 7c0-1 1-1 1-2M16 7c0-1 1-1 1-2" />
                  </svg>
                  {m.p}
                </div> 
                <span className="pg">
                  {dots(ml.n)}{ml.t}
                </span>
                <p className="md">{m.x}</p>
                <div className="tags">
                  {m.n.filter((n: string) => w[n]).map((n: string) => (
                    <span key={n} className="tag">+ {NUT_LABEL[n as keyof typeof NUT_LABEL]}</span>
                  ))}
                  <button 
                    className="swap" 
                    onClick={() => setSwaps(prev => ({ ...prev, [day + "-" + m.s]: (prev[day + "-" + m.s] || 0) + 1 }))}
                  >
                    Swap ↻
                  </button>
                </div>
                <div className="amt" role="group" aria-label={`How much of ${m.t} did you eat?`}>
                  {AMTS.map(([v, l]) => (
                    <button 
                      key={l as string} 
                      aria-pressed={a === v} 
                      data-a={v}
                      onClick={() => {
                        setDone(prev => {
                          const n = { ...prev };
                          if (n[k] === v) delete n[k]; else n[k] = v as number;
                          return n;
                        });
                      }}
                    >
                      {l as string}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <p className="note" style={{ textAlign: "center" }}>
          {logged}/4 meals logged today · Tap how much you ate. Half and Extra count toward your score.
        </p>

        {w.iron && (
          <div className="habit tea">
            <span className="hi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
                <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3" />
              </svg>
            </span>
            <div>
              <b>Chai timing</b>
              Keep tea and coffee an hour away from iron-rich meals. They block absorption.
            </div>
          </div>
        )}
      </>
    );
  };
  // --- CHART HELPERS ---
  const lineChart = (m: any) => {
    const pts = reports.map(r => ({ d: r.date, v: (r.vals as any)[m.id] })).filter(p => p.v !== "" && p.v != null && !isNaN(p.v));
    const W = 320, H = 180, L = 14, R = 14, T = 26, B = 28, lo = pick(m.low, sex), hi = pick(m.hi, sex);
    const vs = pts.map(p => p.v);
    let mn = Math.min(...vs, lo as number), mx = Math.max(...vs, lo as number);
    const pad = (mx - mn || (lo as number) * .2) * .35;
    mn = Math.max(0, mn - pad);
    mx = mx + pad;
    const y = (v: number) => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
    const x = (i: number) => pts.length < 2 ? W / 2 : L + 18 + i * ((W - L - R - 36) / (pts.length - 1));
    const bandTop = y(Math.min(hi as number, mx));
    const bandBot = y(lo as number);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const area = pts.length > 1 ? `${path} L${x(pts.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z` : "";
    
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${m.name} across ${pts.length} reports`}>
        <defs>
          <linearGradient id="lg" x1="0" x2="1">
            <stop offset="0" stopColor="#FF7A45" />
            <stop offset=".5" stopColor="#FF4D8D" />
            <stop offset="1" stopColor="#8D6CFF" />
          </linearGradient>
          <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FF4D8D" stopOpacity=".28" />
            <stop offset="1" stopColor="#FF4D8D" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={L} y={bandTop} width={W - L - R} height={Math.max(0, bandBot - bandTop)} fill="rgba(51,214,159,.16)" />
        <line x1={L} x2={W - R} y1={bandBot} y2={bandBot} stroke="#33D69F" strokeOpacity=".7" strokeDasharray="4 4" />
        <text x={W - R} y={bandBot - 6} textAnchor="end" fill="#0E9F6E" fontFamily="Space Mono, monospace" fontSize="9.5" fontWeight="700">
          NORMAL &ge; {lo as number}
        </text>
        {area && <path d={area} fill="url(#ag)" />}
        <path d={path} fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => {
          const last = i === pts.length - 1;
          return (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.v)} r={last ? 6.5 : 4.5} fill={last ? "#FFD23F" : "#FFFFFF"} stroke={last ? "#FF4D8D" : "#444444"} strokeWidth={last ? 3.5 : 2} />
              <text x={x(i)} y={y(p.v) - 12} textAnchor="middle" fill={last ? "#111111" : "#444444"} fontFamily="Space Mono, monospace" fontSize="11" fontWeight="700">
                {p.v}
              </text>
              <text x={x(i)} y={H - 8} textAnchor="middle" fill="#6A6A7A" fontFamily="Outfit, sans-serif" fontSize="10.5" fontWeight="700">
                {fmtD(p.d)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const weekChart = () => {
    const W = 320, H = 120, L = 8, R = 8, T = 18, B = 22, bw = 26, gap = (W - L - R - bw * 7) / 6;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Meals followed per day this week">
        <defs>
          <linearGradient id="lg2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FF4D8D" />
            <stop offset="1" stopColor="#8D6CFF" />
          </linearGradient>
        </defs>
        {DAYN.map((d, i) => {
          const t = dayTotal(i);
          const c = Math.round(t / 4 * 100);
          const x = L + i * (bw + gap);
          const full = H - T - B;
          const h = Math.max(3, full * Math.min(1, t / 4));
          return (
            <g key={i}>
              <rect x={x} y={T} width={bw} height={full} rx="8" fill="rgba(17,17,17,.06)" />
              <rect x={x} y={T + full - h} width={bw} height={h} rx="8" fill={t ? "url(#lg2)" : "rgba(17,17,17,.1)"} />
              <text x={x + bw / 2} y={T - 6} textAnchor="middle" fill={t ? "#111111" : "#6A6A7A"} fontFamily="Space Mono, monospace" fontSize="10" fontWeight="700">
                {c}%
              </text>
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" fill={i === day ? "#111111" : "#6A6A7A"} fontFamily="Outfit, sans-serif" fontSize="10.5" fontWeight="800">
                {d}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const proteinChart = () => {
    const W = 320, H = 140, L = 8, R = 8, T = 20, B = 22, bw = 26, gap = (W - L - R - bw * 7) / 6, tg = target();
    const vals = DAYN.map((_, i) => dayProtein(i));
    const mx = Math.max(tg * 1.3, ...vals);
    const full = H - T - B;
    const y = (v: number) => T + full - full * v / mx;
    const ty = y(tg);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Protein level per day this week compared with your goal">
        <defs>
          <linearGradient id="pg2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FF4D8D" />
            <stop offset="1" stopColor="#8D6CFF" />
          </linearGradient>
        </defs>
        {vals.map((v, i) => {
          const x = L + i * (bw + gap);
          const h = Math.max(3, full * v / mx);
          const hit = v >= tg * .9;
          return (
            <g key={i}>
              <rect x={x} y={T} width={bw} height={full} rx="8" fill="rgba(17,17,17,.06)" />
              <rect x={x} y={T + full - h} width={bw} height={h} rx="8" fill={v ? (hit ? "#33D69F" : "url(#pg2)") : "rgba(17,17,17,.1)"} />
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" fill={i === day ? "#111111" : "#6A6A7A"} fontFamily="Outfit, sans-serif" fontSize="10.5" fontWeight="800">
                {DAYN[i]}
              </text>
            </g>
          );
        })}
        <line x1={L} x2={W - R} y1={ty} y2={ty} stroke="#111111" strokeOpacity=".55" strokeDasharray="4 4" />
        <text x={W - R} y={ty - 5} textAnchor="end" fill="#111111" fillOpacity=".75" fontFamily="Space Mono, monospace" fontSize="9.5" fontWeight="700">
          YOUR GOAL
        </text>
      </svg>
    );
  };

  // --- TAB 4: PROGRESS ---
  const renderProgress = () => {
    const reps = reports;
    if (!reps.length) {
      return <div className="glass">Save your first report on the Report tab to start tracking.</div>;
    }
    const first = reps[0];
    const last = reps[reps.length - 1];
    const rows = MARKERS.map(m => {
      const a = (first.vals as any)[m.id];
      const b = (last.vals as any)[m.id];
      if (a == null || b == null || a === "" || b === "") return null;
      const better = distOut(m, b as number, sex) < distOut(m, a as number, sex);
      const worse = distOut(m, b as number, sex) > distOut(m, a as number, sex);
      return { m, a, b, pct: a ? ((b as number - (a as number)) / (a as number) * 100) : 0, dir: better ? "up" : worse ? "down" : "flat" };
    }).filter(Boolean) as any[];
    
    const improved = rows.filter(r => r.dir === "up").length;
    const best = rows.filter(r => r.dir === "up").sort((p, q) => Math.abs(q.pct) - Math.abs(p.pct))[0];
    
    const lastD = new Date(last.date + "T00:00:00");
    const next = new Date(lastD.getTime() + 90 * 864e5);
    const now = new Date();
    const passed = Math.min(90, Math.max(0, Math.round((now.getTime() - lastD.getTime()) / 864e5)));
    const left = 90 - passed;
    
    const activeMarker = MARKERS.find(m => m.id === pm) || MARKERS[0];
    const weekTot = DAYN.reduce((a, _, i) => a + dayTotal(i), 0);
    const weekDays = DAYN.filter((_, i) => [0, 1, 2, 3].some(k => amt(i + "-" + k) != null)).length;
    const weekPct = weekDays ? Math.round(weekTot / (weekDays * 4) * 100) : 0;
    
    const pVals = DAYN.map((_, i) => dayProtein(i)).filter(v => v > 0);
    const pDays = pVals.length;
    const pAvg = pDays ? Math.round(pVals.reduce((a, b) => a + b, 0) / pDays) : 0;

    return (
      <>
        <div className="win">
          <span className="label">Since {fmtLong(new Date(first.date + "T00:00:00"))} · {reps.length} reports</span>
          <div className="big"><em>{improved} of {rows.length}</em> markers moving the right way</div>
          <p>{best ? `Biggest win: ${best.m.name} up ${Math.round(best.pct)}%, from ${best.a} to ${best.b} ${best.m.unit}.` : "Upload your next report to see what moved."}</p>
        </div>

        <div className="glass chart">
          <div className="cap"><b>{activeMarker.name}</b><span className="label">{activeMarker.unit}</span></div>
          <div className="chips" role="group" aria-label="Marker">
            {MARKERS.map(m => (
              <button 
                key={m.id} 
                data-pm={m.id} 
                aria-pressed={m.id === pm}
                onClick={() => setPm(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
          {lineChart(activeMarker)}
        </div>

        <div className="glass">
          <span className="label">First report → latest</span>
          {rows.sort((p, q) => ({ up: 0, flat: 1, down: 2 }[p.dir as string]! - { up: 0, flat: 1, down: 2 }[q.dir as string]!)).map(r => (
            <div key={r.m.id} className="delta">
              <span className="nm">{r.m.name}</span>
              <span className="fr">{r.a} → {r.b}</span>
              <span className={`ch ${r.dir}`}>{r.dir === "flat" ? "steady" : (r.pct > 0 ? "+" : "") + Math.round(r.pct) + "%"}</span>
            </div>
          ))}
        </div>

        <div className="glass retest">
          <span className="label">Next blood test</span>
          <span className="when">{fmtLong(next)}{left > 0 ? ` · in ${left} days` : " · due now"}</span>
          <span className="track"><i style={{ width: `${mounted ? passed / 90 * 100 : 0}%` }}></i></span>
          <small>Iron, B12 and Vitamin D take 8 to 12 weeks to move, so Kami asks for a re-test every 3 months. We&apos;ll remind you on WhatsApp.</small>
        </div>

        <div className="glass">
          <div className="row">
            <span className="label">Between tests · this week</span>
            <span className="mini">{weekDays ? `${weekPct}% of plan eaten` : "Nothing logged yet"}</span>
          </div>
          {weekChart()}
          <p className="note">Share of each day&apos;s planned portions you ate, from the Today tab. Half a meal counts as half, extra as one and a half. This tracks food, not blood levels.</p>
        </div>

        <div className="glass">
          <div className="row">
            <span className="label">Protein · this week</span>
            <span className="mini">{pDays ? `${DAYN.filter((_, i) => dayProtein(i) >= target() * .9).length} of 7 days on track` : "Nothing logged yet"}</span>
          </div>
          {proteinChart()}
          <p className="note">Mint bars are days you were on track. Levels are a rough guide from what you logged, since portion sizes differ in every home.</p>
        </div>

        <div className="glass" style={{ display: "grid", gap: "10px" }}>
          <span className="label">How&apos;s your energy today? · {DAYN[day]}</span>
          <div className="energy" role="group" aria-label="Energy level">
            {[1, 2, 3, 4, 5].map(n => (
              <button 
                key={n} 
                data-en={n} 
                aria-pressed={(energy[day] || 3) === n}
                onClick={() => setEnergy(prev => ({ ...prev, [day]: n }))}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="note">1 is drained, 5 is great. How you feel week to week often changes before the next blood test does.</p>
        </div>
      </>
    );
  };
  // --- TAB 1: REPORT ---
  
  const handleParseText = () => {
    const lower = pastedText.toLowerCase();
    let found = 0;
    const newVals = { ...vals };
    MARKERS.forEach(m => {
      if (m.keys) {
        for (const k of m.keys) {
          const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^0-9\\n]{0,40}?(\\d+(?:\\.\\d+)?)", "i");
          const r = lower.match(re);
          if (r) { newVals[m.id] = parseFloat(r[1]); found++; break; }
        }
      }
    });
    setVals(newVals);
    if(found > 0) alert(`Found ${found} values!`);
    else alert(`No values found. Try one per line.`);
  };

  const renderReport = () => {
    const recTests = Array.from(new Set(symptoms.flatMap(s => SYMPTOMS_LIST.find(x => x.id === s)?.tests || [])));
    return (
    <>
      
        <div className="glass" style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
          <span className="label">What are you feeling? (Symptom Triage)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SYMPTOMS_LIST.map(s => {
              const active = symptoms.includes(s.id);
              return (
                <button 
                  key={s.id} 
                  className={active ? "btn" : "btn ghost"} 
                  style={{ borderRadius: "99px", padding: "6px 12px", fontSize: "14px", border: active ? "2px solid #111" : "2px solid transparent" }}
                  onClick={() => setSymptoms(prev => active ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {recTests.length > 0 && (
            <div style={{ background: "#FFDE59", border: "2px solid var(--ink)", borderBottomWidth: "4px", borderRadius: "12px", padding: "12px", marginTop: "4px", fontSize: "14px", fontWeight: 600 }}>
              Based on your symptoms, please upload:<br/> {recTests.join(", ")}
            </div>
          )}
        </div>
        <label className="drop" htmlFor="file">
        <span className="ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>
          </svg>
        </span>
        <b>Drop your blood report</b>
        <span>PDF or photo · CBC, Vit D, B12, iron profile</span>
      </label>
      <input type="file" id="file" accept=".pdf,image/*" multiple hidden onChange={async (e) => {
          const selectedFiles = Array.from(e.target.files || []);
          if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
            for (const f of selectedFiles) {
              const { data, error } = await supabase.storage.from('lab_reports').upload(`${Date.now()}_${f.name}`, f);
              if (error) console.error("Upload error:", error);
              else console.log("Uploaded successfully:", data);
            }
          }
        }} />
      {files.length > 0 && (
          <div className="glass" style={{ textAlign: "left", padding: "12px", marginTop: "12px", display: "grid", gap: "6px" }}>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>Attached files:</div>
            {files.map((f, i) => (
              <div key={i} style={{ fontSize: "13px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                📄 {f.name}
              </div>
            ))}
            <span style={{ fontSize: "12px", color: "var(--dim)", marginTop: "4px" }}>Ready for scan.</span>
          </div>
        )}
      <details className="glass">
        <summary>Or paste the report text</summary>
        <textarea id="paste" placeholder="Haemoglobin 11.2 g/dL&#10;Vitamin D (25-OH) 16 ng/mL&#10;Vitamin B12 182 pg/mL" value={pastedText} onChange={(e) => setPastedText(e.target.value)}></textarea>
        <button className="btn ghost" id="parse" onClick={handleParseText}>Read values</button>
      </details>
      
      <div className="glass" style={{ display: "grid", gap: "10px" }}>
        <span className="label">About you</span>
        <div className="seg" role="group" aria-label="Sex">
          {[["F", "Female"], ["M", "Male"]].map(([k, l]) => (
            <button key={k} data-sex={k} aria-pressed={sex === k} onClick={() => setSex(k)}>{l}</button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Diet">
          {[["v", "Veg"], ["e", "Egg ok"], ["n", "Non-veg"]].map(([k, l]) => (
            <button key={k} data-diet={k} aria-pressed={diet === k} onClick={() => setDiet(k)}>{l}</button>
          ))}
        </div>
        <div className="mk" style={{ border: 0, padding: "2px 0" }}>
          <div>
            <div className="nm">Body weight</div>
            <div className="rg">helps set your protein goal</div>
          </div>
          <input 
            id="weight" 
            inputMode="decimal" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            aria-label="Body weight in kg" 
          />
          <span className="u">kg</span>
        </div>
        <div className="seg" role="group" aria-label="Protein goal">
          {[[0.83, "Everyday"], [1.2, "Active / gym"]].map(([k, l]) => (
            <button key={k as number} data-pg={k} aria-pressed={pgoal === k} onClick={() => setPgoal(k as number)}>{l}</button>
          ))}
        </div>
        <p className="note">Every home&apos;s katori and glass is a different size, so ClinixBridge shows protein as levels, not grams.</p>
      </div>

      <div className="glass" style={{ display: "grid", gap: "8px" }}>
        <span className="label">Your recent values</span>
        {MARKERS.map(m => (
          <div key={m.id} className="mk">
            <div>
              <div className="nm">{m.name}</div>
              <div className="rg">normal {pick(m.low, sex)}–{pick(m.hi, sex)}</div>
            </div>
            <input 
              type="number" 
              inputMode="decimal" 
              value={vals[m.id] === "" ? "" : vals[m.id]} 
              onChange={(e) => setVals((prev: any) => ({ ...prev, [m.id]: e.target.value === "" ? "" : +e.target.value }))} 
            />
            <span className="u">{m.unit}</span>
          </div>
        ))}
        <button className="btn" style={{ marginTop: "6px" }} onClick={handleSaveReport}>Save and scan</button>
      </div>

      <div className="glass" style={{ display: "grid", gap: "10px" }}>
        <span className="label">Don&apos;t have a report?</span>
        <button className="btn ghost" onClick={() => setVals({ ...SAMPLE })}>Load example</button>
      </div>
    </>
  );
  };

  // --- TAB 2: SCAN ---
  const renderScan = () => {
    const rows = MARKERS.map(m => ({ m, s: getStatus(m) })).filter(r => r.s) as { m: any, s: { k: string, label: string, crit: boolean } }[];
    const order: Record<string, number> = { low: 0, mid: 1, ok: 2 };
    rows.sort((a, b) => order[a.s.k] - order[b.s.k]);
    const ok = rows.filter(r => r.s.k === "ok").length;
    const pct = rows.length ? Math.round(ok / rows.length * 100) : 0;
    const lows = rows.filter(r => r.s.k !== "ok");
    const crit = rows.filter(r => r.s.crit);
    
    return (
      <>
        <div className="hero-score">
          <div className="ring" style={{ "--p": pct } as React.CSSProperties}>
            <span>{ok}/{rows.length}</span>
          </div>
          <div>
            <h3>{lows.length ? `${lows.length} things to fix with food` : "All clear. Nice."}</h3>
            <p>{lows.length ? "Your plan targets these first, starting today." : "We'll keep you balanced."}</p>
          </div>
        </div>
        
        {crit.length > 0 && (
          <div className="docflag">
            <b>Please see a doctor about {crit.map(r => r.m.name).join(", ")}.</b> These are very low, and food alone may be too slow. ClinixBridge&apos;s meals can support whatever they prescribe.
          </div>
        )}
        
        {rows.map(({ m, s }) => {
          const v = vals[m.id];
          const lo = pick(m.low, sex);
          const hi = pick(m.hi, sex);
          const span = hi - lo;
          const pos = Math.max(3, Math.min(97, ((v - (lo - span * .5)) / (span * 2)) * 100));
          
          return (
            <div key={m.id} className={`r ${s.k}`}>
              <div className="top">
                <span className="nm">{m.name}</span>
                <span className={`pill ${s.k}`}>{s.label}</span>
              </div>
              <div className="val">{v}<small>{m.unit}</small></div>
              <div className="bar">
                <i style={{ left: `${pos}%`, background: `var(--${s.k})` }}></i>
              </div>
              <div className="meta">
                <span>low</span>
                <span>normal {lo}–{hi}</span>
                <span>high</span>
              </div>
              {s.k !== "ok" && (
                <div className="eat">
                  {m.why}<br />
                  <b>Eat more:</b> {FOODS[m.nut]}
                </div>
              )}
            </div>
          );
        })}
        <button className="btn" id="go" onClick={() => setActiveTab("today")}>
          See today&apos;s meals <span aria-hidden="true">→</span>
        </button>
      </>
    );
  };

  const TITLES: any = { report: "Your report", scan: "My levels", today: "Today's plate", progress: "Progress", };

  return (
    <div className="wrap">
      <div className="pitch">
        <div className="nav">
          <div className="logo"><span className="mark">cb</span>ClinixBridge</div>
          <span className="badge"><span className="live"></span>Your daily nutrition caretaker</span>
        </div>
        <h1>
          Your blood report, turned into <span className="g">tomorrow&apos;s breakfast.</span> Not <span className="strike">pills</span>.
        </h1>
        <p className="lede">
          Upload a nutrition blood test. ClinixBridge spots what&apos;s running low, like <b>iron, B12 or Vitamin D</b>, and plans every meal from food you already have at home or can grab at the kirana store.
        </p>
        <div className="bento">
          <div><span className="n">01 · UPLOAD</span><p>Drop your blood report, PDF or photo</p></div>
          <div><span className="n">02 · SCAN</span><p>See what&apos;s low, in plain words</p></div>
          <div><span className="n">03 · EAT</span><p>Get daily meals that fix it</p></div>
        </div>
        <div className="stats">
          <div><b>9</b><span>markers tracked</span></div>
          <div><b>0</b><span>medicines suggested</span></div>
          <div><b>₹149</b><span>per month</span></div>
        </div>
        <p className="fine">
          Prototype. Values shown are an example report. ClinixBridge suggests food only, never medicines, and flags very low results for a doctor&apos;s visit. Not a substitute for medical advice.
        </p>
      </div>

      <div className="phone">
        <div className="inner">
          <div className="status"><span>9:41</span><span>5G ▮▮▮</span></div>
          
          <div className="mbrand" id="mbrand" hidden={activeTab !== "report"}>
            <div className="logo"><span className="mark">cb</span>ClinixBridge</div>
            <h1>Your blood report, turned into <span className="g">tomorrow&apos;s breakfast.</span> Not <span className="strike">pills</span>.</h1>
            <p>Upload your report. ClinixBridge plans every meal from food at home or the kirana store.</p>
          </div>
          
          <div className="apphead">
            <div>
              <div className="sub" id="userChip">Hey {currentUser} · {diet==="v"?"Veg":diet==="e"?"Egg ok":"Non-veg"}</div>
              <h2 id="screenTitle">{TITLES[activeTab]}</h2>
            </div>
            <div className="avatar">{currentUser[0]}</div>
          </div>
          
          <main className="screen" id="screen" key={activeTab}>
            { activeTab === "report" && renderReport() }
            { activeTab === "scan" && renderScan() }
            { activeTab === "today" && renderToday() }
            { activeTab === "progress" && renderProgress() }
            
          </main>
          
          <nav className="tabs" role="tablist">
            <button role="tab" data-tab="report" aria-selected={activeTab === "report"} onClick={() => setActiveTab("report")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>Report
            </button>
            <button role="tab" data-tab="scan" aria-selected={activeTab === "scan"} onClick={() => setActiveTab("scan")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>Levels
            </button>
            <button role="tab" data-tab="today" aria-selected={activeTab === "today"} onClick={() => setActiveTab("today")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M4 13h16M8 5l1 3M16 5l-1 3"/></svg>Today
            </button>
            <button role="tab" data-tab="progress" aria-selected={activeTab === "progress"} onClick={() => setActiveTab("progress")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M4 16l5-5 4 3 7-8"/><path d="M15 6h5v5"/></svg>Progress
            </button>
            
          </nav>
        </div>
      </div>
    </div>
  );
}
