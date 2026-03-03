import { useState, useRef, useEffect } from "react";

// ─── Formulas ──────────────────────────────────────────────────────────────────
const mifflinStJeor  = (w, h, a, s) => s === "male" ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
const harrisBenedict = (w, h, a, s) => s === "male"
  ? 88.362  + 13.397*w + 4.799*h - 5.677*a
  : 447.593 +  9.247*w + 3.098*h -  4.33*a;
const katchMcArdle   = (w, bf) => 370 + 21.6 * w * (1 - bf / 100);
const schofield = (w, a, s) => {
  const t = s === "male"
    ? [[3,60.9*w-54],[10,22.7*w+495],[18,17.686*w+658.2],[30,15.057*w+692.2],[60,11.472*w+873.1],[Infinity,11.711*w+587.7]]
    : [[3,61.0*w-51],[10,22.5*w+499],[18,13.384*w+692.6],[30,14.818*w+486.6],[60,8.126*w+845.6],[Infinity,9.082*w+658.5]];
  return t.find(([lim]) => a < lim)[1];
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { label: "Sedentary",         desc: "Little or no exercise",                        mult: 1.2   },
  { label: "Lightly Active",    desc: "Exercise 1–3 times/week",                      mult: 1.375 },
  { label: "Moderately Active", desc: "Exercise 4–5 times/week",                      mult: 1.465 },
  { label: "Active",            desc: "Daily exercise or intense exercise 3–4×/week", mult: 1.55  },
  { label: "Very Active",       desc: "Intense exercise 6–7 times/week",              mult: 1.725 },
  { label: "Extra Active",      desc: "Very intense exercise daily, or physical job",  mult: 1.9   },
];

const FORMULA_OPTIONS = [
  { id: "mifflin",   label: "Mifflin-St Jeor",        desc: "Most accurate for general population (recommended)" },
  { id: "harris",    label: "Revised Harris-Benedict", desc: "Classic clinical formula, widely used" },
  { id: "katch",     label: "Katch-McArdle",           desc: "Most accurate when body fat % is known" },
  { id: "schofield", label: "Schofield (WHO)",         desc: "WHO standard, excellent for all age groups" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const BGS    = ["#eff6ff", "#f0fdf4", "#fffbeb", "#fef2f2", "#f5f3ff", "#fdf2f8"];

// ─── Conversions ──────────────────────────────────────────────────────────────
const lbsToKg  = (v)      => v * 0.453592;
const stToKg   = (st, lb) => (st * 14 + lb) * 0.453592;
const inToCm   = (v)      => v * 2.54;
const ftInToCm = (ft, i)  => ft * 30.48 + i * 2.54;

// ─── UnitChip ─────────────────────────────────────────────────────────────────
function UnitChip({ active, onClick, children }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "3px 9px", borderRadius: 6, border: "none", cursor: "pointer",
        fontFamily: "inherit", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        outline: "none", whiteSpace: "nowrap",
        background: active ? "#2563eb" : isHovered ? "#e2e8f0" : "#f1f5f9",
        color:      active ? "#fff"    : "#64748b",
      }}
    >
      {children}
    </button>
  );
}

// ─── RadioBtn ─────────────────────────────────────────────────────────────────
function RadioBtn({ checked, onClick, label, desc }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
        background: checked ? "rgba(37,99,235,0.05)" : isHovered ? "rgba(0,0,0,0.02)" : "transparent",
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

// ─── GenderDropdown ───────────────────────────────────────────────────────────
// Shows Male / Female / Other. If Other is picked, shows a sub-prompt with
// radio buttons to choose Male or Female for calculation purposes.
function GenderDropdown({ genderDisplay, biologicalSex, onGenderChange, onBiologicalChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = ["Male", "Female", "Other"];
  const displayLabel = genderDisplay || "Select gender";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 8, cursor: "pointer",
          border: open ? "2px solid #2563eb" : "1.5px solid #d1d5db",
          background: "#fff", fontFamily: "inherit", fontSize: 14,
          color: genderDisplay ? "#111827" : "#9ca3af",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          outline: "none", fontWeight: genderDisplay ? 600 : 400,
        }}
      >
        <span>{displayLabel}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
          background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: "1.5px solid #e5e7eb", overflow: "hidden",
        }}>
          {options.map((opt) => (
            <DropdownOption
              key={opt}
              label={opt}
              active={genderDisplay === opt}
              onClick={() => {
                onGenderChange(opt);
                if (opt !== "Other") onBiologicalChange(opt.toLowerCase());
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}

      {/* "Other" sub-prompt */}
      {genderDisplay === "Other" && (
        <div style={{
          marginTop: 10, padding: "14px 16px", background: "#f8fafc",
          border: "1.5px solid #e2e8f0", borderRadius: 10,
        }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 10, lineHeight: 1.5 }}>
            🌈 To calculate your BMR accurately, please choose the option closest to your biological characteristics:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <RadioBtn
              checked={biologicalSex === "male"}
              onClick={() => onBiologicalChange("male")}
              label="Closest to Male"
              desc="Higher muscle mass, testosterone-based metabolism"
            />
            <RadioBtn
              checked={biologicalSex === "female"}
              onClick={() => onBiologicalChange("female")}
              label="Closest to Female"
              desc="Typically higher body fat percentage, estrogen-based metabolism"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownOption({ label, active, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%", padding: "11px 16px", border: "none", cursor: "pointer",
        background: active ? "rgba(37,99,235,0.07)" : isHovered ? "#f8fafc" : "#fff",
        color: active ? "#2563eb" : "#374151",
        fontFamily: "inherit", fontSize: 14, fontWeight: active ? 700 : 500,
        textAlign: "left", outline: "none",
        borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", gap: 8,
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: active ? "#2563eb" : "transparent",
        border: active ? "none" : "2px solid #d1d5db",
      }} />
      {label}
    </button>
  );
}

// ─── NumInput ─────────────────────────────────────────────────────────────────
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
          padding: "0 10px", display: "flex", alignItems: "center", flexShrink: 0,
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

// ─── Action Buttons ───────────────────────────────────────────────────────────
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
        background: isPressed ? "#1d4ed8" : isHovered ? "#1e4fdb" : "#2563eb",
        color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em",
        cursor: "pointer", fontFamily: "inherit", outline: "none",
        boxShadow: isHovered ? "0 4px 18px rgba(37,99,235,0.35)" : "0 2px 8px rgba(37,99,235,0.18)",
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
        color: isHovered ? "#374151" : "#6b7280",
        fontSize: 14, fontWeight: 700, letterSpacing: "0.08em",
        cursor: "pointer", fontFamily: "inherit", outline: "none",
      }}
    >
      CLEAR
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BMRCalculator() {
  // gender: display value (Male/Female/Other) + biological sex used for formula
  const [genderDisplay,  setGenderDisplay]  = useState("");
  const [biologicalSex,  setBiologicalSex]  = useState("male");
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
  // body fat
  const [bf,     setBf]     = useState("");
  // settings
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [formula,  setFormula]  = useState("mifflin");
  const [rUnit,    setRUnit]    = useState("kcal");
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
    if (!genderDisplay)              { setError("Please select a gender."); return; }
    if (genderDisplay === "Other" && !biologicalSex) { setError("Please choose the closest biological option."); return; }

    const a   = parseFloat(age);
    const w   = resolveWeight();
    const h   = resolveHeight();
    const bfv = parseFloat(bf);
    const sex = biologicalSex;

    if (!a || a < 15 || a > 80)               { setError("Please enter a valid age (15–80)."); return; }
    if (!w || w <= 0)                          { setError("Please enter a valid weight."); return; }
    if (formula !== "katch" && (!h || h <= 0)) { setError("Please enter a valid height."); return; }

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
    setGenderDisplay(""); setBiologicalSex("male"); setAge("");
    setWKg(""); setWLbs(""); setWSt(""); setWSlb("");
    setHCm(""); setHFt(""); setHIn(""); setHInch(""); setBf("");
    setResult(null); setError("");
  };

  const disp    = (v) => rUnit === "kcal" ? Math.round(v).toLocaleString() : Math.round(v * 4.184).toLocaleString();
  const du      = rUnit === "kcal" ? "kcal/day" : "kJ/day";
  const duShort = rUnit === "kcal" ? "kcal" : "kJ";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", background: "#f1f5f9", minHeight: "100vh", padding: "24px 12px 72px" }}>
      <style>{globalCss}</style>
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            BMR Calculator
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 5 }}>
            Basal Metabolic Rate · Daily Calorie Needs
          </p>
        </div>

        {/* ── Details Card ── */}
        <div style={S.card}>
          <h2 style={{ ...S.cardTitle, marginBottom: 20 }}>Enter Your Details</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>

            {/* Age */}
            <div>
              <label style={S.label}>
                Age <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 11 }}>(15–80)</span>
              </label>
              <NumInput placeholder="e.g. 25" value={age} onChange={setAge} unit="yrs" />
            </div>

            {/* Gender dropdown */}
            <div>
              <label style={S.label}>Gender</label>
              <GenderDropdown
                genderDisplay={genderDisplay}
                biologicalSex={biologicalSex}
                onGenderChange={setGenderDisplay}
                onBiologicalChange={setBiologicalSex}
              />
            </div>

            {/* Weight */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Weight</label>
                <div style={{ display: "flex", gap: 3 }}>
                  <UnitChip active={wUnit === "kg"}  onClick={() => setWUnit("kg")} >kg</UnitChip>
                  <UnitChip active={wUnit === "lbs"} onClick={() => setWUnit("lbs")}>lbs</UnitChip>
                  <UnitChip active={wUnit === "st"}  onClick={() => setWUnit("st")} >st</UnitChip>
                </div>
              </div>
              {wUnit === "kg"  && <NumInput placeholder="e.g. 75"  value={wKg}  onChange={setWKg}  unit="kg"  />}
              {wUnit === "lbs" && <NumInput placeholder="e.g. 165" value={wLbs} onChange={setWLbs} unit="lbs" />}
              {wUnit === "st"  && (
                <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
                  <NumInput placeholder="st"  value={wSt}  onChange={setWSt}  unit="st"  style={{ flex: 1, minWidth: 0 }} />
                  <NumInput placeholder="lbs" value={wSlb} onChange={setWSlb} unit="lbs" style={{ flex: 1, minWidth: 0 }} />
                </div>
              )}
            </div>

            {/* Height */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Height</label>
                <div style={{ display: "flex", gap: 3 }}>
                  <UnitChip active={hUnit === "cm"} onClick={() => setHUnit("cm")}>cm</UnitChip>
                  <UnitChip active={hUnit === "ft"} onClick={() => setHUnit("ft")}>ft+in</UnitChip>
                  <UnitChip active={hUnit === "in"} onClick={() => setHUnit("in")}>in</UnitChip>
                </div>
              </div>
              {hUnit === "cm" && <NumInput placeholder="e.g. 175" value={hCm}    onChange={setHCm}    unit="cm" />}
              {hUnit === "ft" && (
                <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
                  <NumInput placeholder="ft" value={hFt} onChange={setHFt} unit="ft" style={{ flex: 1, minWidth: 0 }} />
                  <NumInput placeholder="in" value={hIn} onChange={setHIn} unit="in" style={{ flex: 1, minWidth: 0 }} />
                </div>
              )}
              {hUnit === "in" && <NumInput placeholder="e.g. 69" value={hInch} onChange={setHInch} unit="in" />}
            </div>

            {/* Body fat % — katch only, full width */}
            {formula === "katch" && (
              <div style={{ gridColumn: "1 / -1" }}>
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
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              <div>
                <div style={S.settingHead}>Results Unit</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <RadioBtn checked={rUnit === "kcal"} onClick={() => setRUnit("kcal")} label="Calories (kcal)" />
                  <RadioBtn checked={rUnit === "kj"}   onClick={() => setRUnit("kj")}   label="Kilojoules (kJ)" />
                </div>
              </div>
              <div>
                <div style={S.settingHead}>BMR Formula</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {FORMULA_OPTIONS.map((f) => (
                    <RadioBtn key={f.id} checked={formula === f.id}
                      onClick={() => { setFormula(f.id); setResult(null); }}
                      label={f.label} desc={f.desc}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "11px 16px", marginTop: 14, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
            ⚠ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <CalcBtn onClick={calculate} />
          <ClearBtn onClick={clear} />
        </div>

        {/* ── Results ── */}
        {result && (
          <div style={{ ...S.card, marginTop: 18 }}>
            <h2 style={{ ...S.cardTitle, marginBottom: 18 }}>Your Results</h2>

            {/* BMR banner */}
            <div style={{
              background: "linear-gradient(135deg,#eff6ff,#e0f2fe)", borderRadius: 12,
              padding: "18px 20px", marginBottom: 22,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.1em", marginBottom: 4 }}>
                  BASAL METABOLIC RATE (BMR)
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  At rest · {FORMULA_OPTIONS.find((f) => f.id === formula)?.label}
                  {genderDisplay === "Other" && (
                    <span style={{ color: "#8b5cf6", marginLeft: 6, fontSize: 11 }}>
                      (using {biologicalSex} parameters)
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: "clamp(32px,8vw,48px)", fontWeight: 800, color: "#1e40af", lineHeight: 1 }}>
                  {disp(result.bmr)}
                </span>
                <span style={{ fontSize: 14, color: "#3b82f6" }}>{du}</span>
              </div>
            </div>

            {/* Activity table */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 10 }}>
              Daily calorie needs based on activity level
            </div>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", background: "#1e3a5f", borderRadius: "8px 8px 0 0", padding: "10px 16px", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>Activity Level</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>Calories</span>
            </div>

            {/* Table rows */}
            <div style={{ border: "1.5px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", marginBottom: 22 }}>
              {result.levels.map((al, i) => {
                const pct  = Math.round(((al.tdee - result.bmr) / result.bmr) * 100);
                const barW = 35 + (i / (result.levels.length - 1)) * 55;
                return (
                  <div key={al.mult} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: i % 2 === 0 ? "#fff" : "#f9fafb",
                    borderBottom: i < result.levels.length - 1 ? "1px solid #e5e7eb" : "none",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#1f2937", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {al.desc.charAt(0).toUpperCase() + al.desc.slice(1)}
                      </div>
                      <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: COLORS[i], borderRadius: 99 }} />
                      </div>
                    </div>
                    {/* Fixed-width right cell so kcal never overflows */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS[i], whiteSpace: "nowrap" }}>
                        {disp(al.tdee)}
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" }}>+{pct}% BMR</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exercise legend */}
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", marginBottom: 22, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
              <strong>Exercise:</strong> 15–30 min elevated heart rate.{" "}
              <strong>Intense:</strong> 45–120 min elevated heart rate.{" "}
              <strong>Very intense:</strong> 2+ hours elevated heart rate.
            </div>

            {/* TDEE visual cards — responsive flex column on mobile */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>
              TDEE breakdown by activity level
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {result.levels.map((al, i) => {
                const pct  = Math.round(((al.tdee - result.bmr) / result.bmr) * 100);
                const barW = 35 + (i / (result.levels.length - 1)) * 57;
                return (
                  <div key={al.mult} style={{
                    background: BGS[i], borderRadius: 10, padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "nowrap",
                  }}>
                    {/* Label — fixed width, shrinks on mobile */}
                    <div style={{ flex: "0 0 auto", minWidth: 0, width: "clamp(100px, 25%, 160px)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {al.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {al.desc}
                      </div>
                    </div>
                    {/* Bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: COLORS[i], borderRadius: 99 }} />
                      </div>
                    </div>
                    {/* Value — fixed width, never wraps */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 90 }}>
                      <span style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 800, color: COLORS[i], whiteSpace: "nowrap" }}>
                        {disp(al.tdee)}
                      </span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 3, whiteSpace: "nowrap" }}>
                        {duShort}
                      </span>
                      <div style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" }}>
                        +{pct}% above BMR
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Goal targets */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 10 }}>
              Calorie Targets{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
                (based on Active TDEE)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "WEIGHT LOSS", val: result.levels[3].tdee - 500, color: "#dc2626", bg: "#fef2f2", note: "−500 kcal deficit"  },
                { label: "MAINTENANCE", val: result.levels[3].tdee,       color: "#059669", bg: "#f0fdf4", note: "Stay the same"       },
                { label: "WEIGHT GAIN", val: result.levels[3].tdee + 500, color: "#2563eb", bg: "#eff6ff", note: "+500 kcal surplus"   },
              ].map((g) => (
                <div key={g.label} style={{ background: g.bg, borderRadius: 10, padding: "14px 8px", textAlign: "center", minWidth: 0 }}>
                  <div style={{ fontSize: "clamp(7px,2vw,9px)", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 5 }}>
                    {g.label}
                  </div>
                  <div style={{ fontSize: "clamp(16px,4vw,22px)", fontWeight: 800, color: g.color, whiteSpace: "nowrap" }}>
                    {disp(g.val)}
                  </div>
                  <div style={{ fontSize: "clamp(9px,2vw,11px)", color: "#9ca3af", marginTop: 2 }}>{du}</div>
                  <div style={{ fontSize: "clamp(8px,1.8vw,10px)", color: "#9ca3af", marginTop: 2 }}>{g.note}</div>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  card:        { background: "#fff", borderRadius: 14, padding: "clamp(16px,4vw,24px) clamp(14px,4vw,26px)", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
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
  @media (max-width: 480px) {
    .tdee-label { display: none; }
  }
`;
