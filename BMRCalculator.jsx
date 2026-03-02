import { useState } from "react";

// ─── Formulas ──────────────────────────────────────────────────────────────────
const mifflinStJeor  = (w, h, a, s) => s === "male" ? 10*w + 6.25*h - 5*a + 5   : 10*w + 6.25*h - 5*a - 161;
const harrisBenedict = (w, h, a, s) => s === "male"
  ? 88.362  + 13.397*w + 4.799*h - 5.677*a
  : 447.593 +  9.247*w + 3.098*h -  4.33*a;
const katchMcArdle   = (w, bf)      => 370 + 21.6 * w * (1 - bf / 100);
const schofield = (w, a, s) => {
  const t = s === "male"
    ? [[3,60.9*w-54],[10,22.7*w+495],[18,17.686*w+658.2],[30,15.057*w+692.2],[60,11.472*w+873.1],[Infinity,11.711*w+587.7]]
    : [[3,61.0*w-51],[10,22.5*w+499],[18,13.384*w+692.6],[30,14.818*w+486.6],[60, 8.126*w+845.6],[Infinity, 9.082*w+658.5]];
  return t.find(([lim]) => a < lim)[1];
};

// ─── Activity levels (multipliers verified against reference calculator) ───────
const ACTIVITY_LEVELS = [
  { label: "Sedentary",         desc: "Little or no exercise",                       mult: 1.2   },
  { label: "Lightly Active",    desc: "Exercise 1–3 times/week",                     mult: 1.375 },
  { label: "Moderately Active", desc: "Exercise 4–5 times/week",                     mult: 1.465 },
  { label: "Active",            desc: "Daily exercise or intense exercise 3–4×/week",mult: 1.55  },
  { label: "Very Active",       desc: "Intense exercise 6–7 times/week",             mult: 1.725 },
  { label: "Extra Active",      desc: "Very intense exercise daily, or physical job", mult: 1.9   },
];

const FORMULA_OPTIONS = [
  { id: "mifflin",   label: "Mifflin-St Jeor",        desc: "Most accurate for general population (recommended)" },
  { id: "harris",    label: "Revised Harris-Benedict", desc: "Classic clinical formula, widely used" },
  { id: "katch",     label: "Katch-McArdle",           desc: "Most accurate when body fat % is known" },
  { id: "schofield", label: "Schofield (WHO)",         desc: "WHO standard, excellent for all age groups" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const BGS    = ["#eff6ff", "#f0fdf4", "#fffbeb", "#fef2f2", "#f5f3ff", "#fdf2f8"];

// ─── Unit conversions ──────────────────────────────────────────────────────────
const lbsToKg  = (v)      => v * 0.453592;
const stToKg   = (st, lb) => (st * 14 + lb) * 0.453592;
const inToCm   = (v)      => v * 2.54;
const ftInToCm = (ft, i)  => ft * 30.48 + i * 2.54;

// ─── Primitive components — each manages its own hover state cleanly ───────────

function UnitChip({ active, onClick, children }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer",
        fontFamily: "inherit", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
        outline: "none",
        background: active      ? "#2563eb"  :
                    isHovered   ? "#e2e8f0"  : "#f1f5f9",
        color:      active      ? "#fff"     : "#64748b",
      }}
    >
      {children}
    </button>
  );
}

function RadioBtn({ checked, onClick, label, desc }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
        background: checked   ? "rgba(37,99,235,0.05)" :
                    isHovered ? "rgba(0,0,0,0.02)"     : "transparent",
        border: checked ? "1.5px solid rgba(37,99,235,0.3)" : "1.5px solid transparent",
        borderRadius: 8, padding: "8px 12px", cursor: "pointer",
        textAlign: "left", outline: "none", fontFamily: "inherit",
      }}
    >
      <span style={{
        width: 17, height: 17, borderRadius: "50%", flexShrink: 0, marginTop: 1,
        border: checked ? "5px solid #2563eb" : "2px solid #9ca3af",
        background: "#fff", boxSizing: "border-box",
      }} />
      <span>
        <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "#1e40af" : "#374151", display: "block" }}>
          {label}
        </span>
        {desc && <span style={{ fontSize: 11, color: "#9ca3af" }}>{desc}</span>}
      </span>
    </button>
  );
}

function GenderOption({ value, currentSex, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = currentSex === value;
  return (
    <button
      onClick={() => onSelect(value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: isHovered && !isActive ? "rgba(0,0,0,0.03)" : "none",
        border: "none", cursor: "pointer", outline: "none",
        fontFamily: "inherit", padding: "4px 8px", borderRadius: 6,
      }}
    >
      <span style={{
        width: 19, height: 19, borderRadius: "50%", flexShrink: 0,
        border: isActive ? "6px solid #2563eb" : "2px solid #9ca3af",
        background: "#fff", boxSizing: "border-box",
      }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#1e40af" : "#374151" }}>
        {value === "male" ? "Male" : "Female"}
      </span>
    </button>
  );
}

function NumInput({ placeholder, value, onChange, unit, style = {} }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "stretch", minWidth: 0, ...style }}>
      <input
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flex: 1, padding: "10px 13px", fontSize: 14, color: "#111827",
          border: isFocused ? "2px solid #2563eb" : "1.5px solid #d1d5db",
          borderRadius: unit ? "8px 0 0 8px" : "8px",
          borderRight: unit ? "none" : undefined,
          outline: "none", fontFamily: "inherit", background: "#fff",
          minWidth: 0, width: 0,
        }}
      />
      {unit && (
        <span style={{
          padding: "0 11px", display: "flex", alignItems: "center",
          background: "#f8fafc",
          borderTop:    isFocused ? "2px solid #2563eb" : "1.5px solid #d1d5db",
          borderRight:  isFocused ? "2px solid #2563eb" : "1.5px solid #d1d5db",
          borderBottom: isFocused ? "2px solid #2563eb" : "1.5px solid #d1d5db",
          borderLeft: "none", borderRadius: "0 8px 8px 0",
          fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap",
        }}>
          {unit}
        </span>
      )}
    </div>
  );
}

function CalcBtn({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        flex: 3, padding: "14px 0", border: "none", borderRadius: 10,
        background: isPressed  ? "#1d4ed8" :
                    isHovered  ? "#1e4fdb" : "#2563eb",
        color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em",
        cursor: "pointer", fontFamily: "inherit", outline: "none",
        boxShadow: isHovered
          ? "0 4px 18px rgba(37,99,235,0.35)"
          : "0 2px 8px rgba(37,99,235,0.18)",
        transform: isPressed ? "scale(0.98)" : "none",
      }}
    >
      ▶  CALCULATE BMR
    </button>
  );
}

function ClearBtn({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flex: 1, padding: "14px 0", borderRadius: 10,
        border: "1.5px solid #d1d5db",
        background: isHovered ? "#f9fafb" : "#fff",
        color:      isHovered ? "#374151" : "#6b7280",
        fontSize: 14, fontWeight: 700, letterSpacing: "0.1em",
        cursor: "pointer", fontFamily: "inherit", outline: "none",
      }}
    >
      CLEAR
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function BMRCalculator() {
  // inputs
  const [sex,    setSex]    = useState("male");
  const [age,    setAge]    = useState("");
  // weight
  const [wUnit,  setWUnit]  = useState("kg");
  const [wKg,    setWKg]    = useState("");
  const [wLbs,   setWLbs]   = useState("");
  const [wSt,    setWSt]    = useState("");
  const [wSlb,   setWSlb]   = useState("");
  // height
  const [hUnit,  setHUnit]  = useState("cm");
  const [hCm,    setHCm]    = useState("");
  const [hFt,    setHFt]    = useState("");
  const [hIn,    setHIn]    = useState("");
  const [hInch,  setHInch]  = useState("");
  // body fat (katch only)
  const [bf,     setBf]     = useState("");
  // settings
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [formula, setFormula] = useState("mifflin");
  const [rUnit,   setRUnit]   = useState("kcal");
  // result
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState("");

  const resolveWeight = () => {
    if (wUnit === "kg")  return parseFloat(wKg);
    if (wUnit === "lbs") return lbsToKg(parseFloat(wLbs));
    if (wUnit === "st")  return stToKg(parseFloat(wSt) || 0, parseFloat(wSlb) || 0);
    return NaN;
  };

  const resolveHeight = () => {
    if (hUnit === "cm") return parseFloat(hCm);
    if (hUnit === "ft") return ftInToCm(parseFloat(hFt) || 0, parseFloat(hIn) || 0);
    if (hUnit === "in") return inToCm(parseFloat(hInch));
    return NaN;
  };

  const calculate = () => {
    setError("");
    const a   = parseFloat(age);
    const w   = resolveWeight();
    const h   = resolveHeight();
    const bfv = parseFloat(bf);

    if (!a || a < 15 || a > 80)                    { setError("Please enter a valid age (15–80)."); return; }
    if (!w || w <= 0)                               { setError("Please enter a valid weight."); return; }
    if (formula !== "katch" && (!h || h <= 0))      { setError("Please enter a valid height."); return; }

    let bmr;
    if (formula === "mifflin")   bmr = mifflinStJeor(w, h, a, sex);
    if (formula === "harris")    bmr = harrisBenedict(w, h, a, sex);
    if (formula === "schofield") bmr = schofield(w, a, sex);
    if (formula === "katch") {
      if (!bfv || bfv <= 0 || bfv >= 100) { setError("Enter a valid body fat % for Katch-McArdle."); return; }
      bmr = katchMcArdle(w, bfv);
    }

    if (!bmr || bmr <= 0) { setError("Calculation failed. Please check your inputs."); return; }

    setResult({
      bmr: Math.round(bmr),
      levels: ACTIVITY_LEVELS.map((al) => ({ ...al, tdee: Math.round(bmr * al.mult) })),
    });
  };

  const clear = () => {
    setAge(""); setWKg(""); setWLbs(""); setWSt(""); setWSlb("");
    setHCm(""); setHFt(""); setHIn(""); setHInch(""); setBf("");
    setResult(null); setError("");
  };

  const disp    = (v) => rUnit === "kcal" ? Math.round(v).toLocaleString() : Math.round(v * 4.184).toLocaleString();
  const du      = rUnit === "kcal" ? "kcal/day" : "kJ/day";
  const duShort = rUnit === "kcal" ? "kcal" : "kJ";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", background: "#f1f5f9", minHeight: "100vh", padding: "32px 16px 72px" }}>
      <style>{globalCss}</style>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            BMR Calculator
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 5 }}>
            Basal Metabolic Rate · Daily Calorie Needs
          </p>
        </div>

        {/* ── Details Card ── */}
        <div style={S.card}>
          <h2 style={{ ...S.cardTitle, marginBottom: 20 }}>Enter Your Details</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minWidth: 0 }}>

            {/* Age */}
            <div>
              <label style={S.label}>
                Age <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 11 }}>(ages 15–80)</span>
              </label>
              <NumInput placeholder="e.g. 25" value={age} onChange={setAge} unit="yrs" />
            </div>

            {/* Gender — uses proper GenderOption component, no hooks in map */}
            <div>
              <label style={S.label}>Gender</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <GenderOption value="male"   currentSex={sex} onSelect={setSex} />
                <GenderOption value="female" currentSex={sex} onSelect={setSex} />
              </div>
            </div>

            {/* Weight with inline unit toggle chips */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={S.label}>Weight</label>
                <div style={{ display: "flex", gap: 3 }}>
                  <UnitChip active={wUnit === "kg"}  onClick={() => setWUnit("kg")} >kg</UnitChip>
                  <UnitChip active={wUnit === "lbs"} onClick={() => setWUnit("lbs")}>lbs</UnitChip>
                  <UnitChip active={wUnit === "st"}  onClick={() => setWUnit("st")} >st</UnitChip>
                </div>
              </div>
              {wUnit === "kg"  && <NumInput placeholder="e.g. 75"  value={wKg}  onChange={setWKg}  unit="kg"  />}
              {wUnit === "lbs" && <NumInput placeholder="e.g. 165" value={wLbs} onChange={setWLbs} unit="lbs" />}
              {wUnit === "st"  && (
                <div style={{ display: "flex", gap: 6, width: "100%", minWidth: 0 }}>
                  <NumInput placeholder="st"  value={wSt}  onChange={setWSt}  unit="st"  style={{ flex: 1, minWidth: 0 }} />
                  <NumInput placeholder="lbs" value={wSlb} onChange={setWSlb} unit="lbs" style={{ flex: 1, minWidth: 0 }} />
                </div>
              )}
            </div>

            {/* Height with inline unit toggle chips */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={S.label}>Height</label>
                <div style={{ display: "flex", gap: 3 }}>
                  <UnitChip active={hUnit === "cm"} onClick={() => setHUnit("cm")}>cm</UnitChip>
                  <UnitChip active={hUnit === "ft"} onClick={() => setHUnit("ft")}>ft+in</UnitChip>
                  <UnitChip active={hUnit === "in"} onClick={() => setHUnit("in")}>in</UnitChip>
                </div>
              </div>
              {hUnit === "cm" && <NumInput placeholder="e.g. 175" value={hCm}   onChange={setHCm}   unit="cm" />}
              {hUnit === "ft" && (
                <div style={{ display: "flex", gap: 6, width: "100%", minWidth: 0 }}>
                  <NumInput placeholder="ft" value={hFt} onChange={setHFt} unit="ft" style={{ flex: 1, minWidth: 0 }} />
                  <NumInput placeholder="in" value={hIn} onChange={setHIn} unit="in" style={{ flex: 1, minWidth: 0 }} />
                </div>
              )}
              {hUnit === "in" && <NumInput placeholder="e.g. 69" value={hInch} onChange={setHInch} unit="in" />}
            </div>

            {/* Body fat % — only when Katch-McArdle is selected */}
            {formula === "katch" && (
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Body Fat %</label>
                <NumInput placeholder="e.g. 20" value={bf} onChange={setBf} unit="%" style={{ maxWidth: 200 }} />
              </div>
            )}

          </div>
        </div>

        {/* ── Calculation Settings ── */}
        <div style={{ ...S.card, marginTop: 14 }}>
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", outline: "none" }}
          >
            <h2 style={{ ...S.cardTitle, marginBottom: 0 }}>Calculation Settings</h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: settingsOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {settingsOpen && (
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Results Unit */}
              <div>
                <div style={S.settingHead}>Results Unit</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <RadioBtn checked={rUnit === "kcal"} onClick={() => setRUnit("kcal")} label="Calories (kcal)" />
                  <RadioBtn checked={rUnit === "kj"}   onClick={() => setRUnit("kj")}   label="Kilojoules (kJ)" />
                </div>
              </div>

              {/* BMR Formula */}
              <div>
                <div style={S.settingHead}>BMR Formula</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {FORMULA_OPTIONS.map((f) => (
                    <RadioBtn
                      key={f.id}
                      checked={formula === f.id}
                      onClick={() => { setFormula(f.id); setResult(null); }}
                      label={f.label}
                      desc={f.desc}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "11px 16px", marginTop: 14, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <CalcBtn onClick={calculate} />
          <ClearBtn onClick={clear} />
        </div>

        {/* ── Results ── */}
        {result && (
          <div style={{ ...S.card, marginTop: 18 }}>
            <h2 style={{ ...S.cardTitle, marginBottom: 18 }}>Your Results</h2>

            {/* BMR banner */}
            <div style={{ background: "linear-gradient(135deg,#eff6ff,#e0f2fe)", borderRadius: 12, padding: "20px 24px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.1em", marginBottom: 4 }}>
                  BASAL METABOLIC RATE (BMR)
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Calories burned at complete rest · {FORMULA_OPTIONS.find((f) => f.id === formula)?.label}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#1e40af", lineHeight: 1 }}>{disp(result.bmr)}</span>
                <span style={{ fontSize: 14, color: "#3b82f6" }}>{du}</span>
              </div>
            </div>

            {/* Activity table */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 10 }}>
              Daily calorie needs based on activity level
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", background: "#1e3a5f", borderRadius: "8px 8px 0 0", padding: "10px 16px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>Activity Level</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>Calories</span>
            </div>

            <div style={{ border: "1.5px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", marginBottom: 22 }}>
              {result.levels.map((al, i) => {
                const pct  = Math.round(((al.tdee - result.bmr) / result.bmr) * 100);
                const barW = 35 + (i / (result.levels.length - 1)) * 55;
                return (
                  <div key={al.mult} style={{
                    display: "grid", gridTemplateColumns: "1fr auto",
                    alignItems: "center", gap: 16, padding: "12px 16px",
                    background: i % 2 === 0 ? "#fff" : "#f9fafb",
                    borderBottom: i < result.levels.length - 1 ? "1px solid #e5e7eb" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#1f2937", marginBottom: 4 }}>
                        {al.desc.charAt(0).toUpperCase() + al.desc.slice(1)}
                      </div>
                      <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden", maxWidth: 340 }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: COLORS[i], borderRadius: 99 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 70 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: COLORS[i] }}>{disp(al.tdee)}</span>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>+{pct}% BMR</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exercise legend */}
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", marginBottom: 22, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
              <strong>Exercise:</strong> 15–30 min elevated heart rate.{" "}
              <strong>Intense exercise:</strong> 45–120 min elevated heart rate.{" "}
              <strong>Very intense:</strong> 2+ hours elevated heart rate.
            </div>

            {/* TDEE visual cards */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>
              TDEE breakdown by activity level
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {result.levels.map((al, i) => {
                const pct  = Math.round(((al.tdee - result.bmr) / result.bmr) * 100);
                const barW = 35 + (i / (result.levels.length - 1)) * 57;
                return (
                  <div key={al.mult} style={{ background: BGS[i], borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: "0 0 165px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{al.label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{al.desc}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: COLORS[i], borderRadius: 99 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flex: "0 0 120px" }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: COLORS[i] }}>{disp(al.tdee)}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>{duShort}/day</span>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>+{pct}% above BMR</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Goal targets based on "Active" level (1.55×, index 3) */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 10 }}>
              Calorie Targets{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
                (based on Active TDEE — daily exercise)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "WEIGHT LOSS", val: result.levels[3].tdee - 500, color: "#dc2626", bg: "#fef2f2", note: "−500 kcal/day deficit"  },
                { label: "MAINTENANCE", val: result.levels[3].tdee,       color: "#059669", bg: "#f0fdf4", note: "Stay the same"           },
                { label: "WEIGHT GAIN", val: result.levels[3].tdee + 500, color: "#2563eb", bg: "#eff6ff", note: "+500 kcal/day surplus"   },
              ].map((g) => (
                <div key={g.label} style={{ background: g.bg, borderRadius: 10, padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", marginBottom: 6 }}>{g.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: g.color }}>{disp(g.val)}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{du}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{g.note}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: "#cbd5e1", textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
              Formula: {FORMULA_OPTIONS.find((f) => f.id === formula)?.label}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const S = {
  card:        { background: "#fff", borderRadius: 14, padding: "24px 26px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  cardTitle:   { fontSize: 17, fontWeight: 700, color: "#2563eb", margin: 0 },
  label:       { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 },
  settingHead: { fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 },
};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  button { -webkit-tap-highlight-color: transparent; user-select: none; }
  button:focus { outline: none !important; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { opacity: 0.3; }
  input::placeholder { color: #9ca3af; }
`;