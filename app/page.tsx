"use client";

import { useEffect, useState } from "react";

type CheckIn = {
  id: string;
  time: string;
  temp?: number;
  sweaty: boolean;
  confused: boolean;
  notes: string;
  flag?: string;
};

type Med = {
  name: string;
  dose: string;
  times: string[];
  notes?: string;
};

const DEFAULT_MEDS: Med[] = [
  { name: "Carbidopa/Levodopa", dose: "as prescribed", times: ["08:00", "12:00", "16:00", "20:00"], notes: "Watch for wearing-off near end of interval" },
];

const DANGEROUS_DRUGS = [
  "Haloperidol (Haldol)",
  "Metoclopramide (Reglan)",
  "Prochlorperazine (Compazine)",
  "Promethazine (Phenergan)",
  "Diphenhydramine (Benadryl)",
  "Other typical antipsychotics",
];

export default function Home() {
  const [tab, setTab] = useState<"checkin" | "meds" | "guide" | "er" | "details">("checkin");
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [meds, setMeds] = useState<Med[]>(DEFAULT_MEDS);
  const [details, setDetails] = useState({
    name: "Mom",
    wellTemp: 97.5,
    clinician: "",
    notes: "Lewy body dementia. Right-hemisphere meningioma.",
  });

  const [form, setForm] = useState({
    temp: "",
    sweaty: false,
    confused: false,
    notes: "",
  });

  useEffect(() => {
    const c = localStorage.getItem("lbd-checkins");
    const m = localStorage.getItem("lbd-meds");
    const d = localStorage.getItem("lbd-details");
    if (c) setCheckins(JSON.parse(c));
    if (m) setMeds(JSON.parse(m));
    if (d) setDetails(JSON.parse(d));
  }, []);

  const saveCheckins = (next: CheckIn[]) => {
    setCheckins(next);
    localStorage.setItem("lbd-checkins", JSON.stringify(next));
  };

  const saveMeds = (next: Med[]) => {
    setMeds(next);
    localStorage.setItem("lbd-meds", JSON.stringify(next));
  };

  const saveDetails = (next: typeof details) => {
    setDetails(next);
    localStorage.setItem("lbd-details", JSON.stringify(next));
  };

  const addCheckIn = () => {
    const temp = form.temp ? parseFloat(form.temp) : undefined;
    let flag: string | undefined;
    if (temp && temp < 96.5) flag = "Low temp";
    if (form.sweaty && form.confused) flag = flag ? flag + " + sweaty/confused" : "Sweaty + confused cluster";
    const entry: CheckIn = {
      id: Date.now().toString(),
      time: new Date().toLocaleString(),
      temp,
      sweaty: form.sweaty,
      confused: form.confused,
      notes: form.notes,
      flag,
    };
    saveCheckins([entry, ...checkins]);
    setForm({ temp: "", sweaty: false, confused: false, notes: "" });
  };

  const exportData = () => {
    const data = { details, meds, checkins, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lbd-notebook-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <header>
        <h1>LBD Caregiver Notebook</h1>
        <p className="subtitle">For {details.name} · Local only · Not medical advice</p>
      </header>

      <nav>
        {(["checkin", "meds", "guide", "er", "details"] as const).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "checkin" ? "Check-in" : t === "meds" ? "Meds" : t === "guide" ? "Guide" : t === "er" ? "ER Card" : "Details"}
          </button>
        ))}
      </nav>

      {tab === "checkin" && (
        <section>
          <h2>Today’s check-in</h2>
          <label>Temperature (°F)</label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 97.2"
            value={form.temp}
            onChange={(e) => setForm({ ...form, temp: e.target.value })}
          />
          <label>
            <input type="checkbox" checked={form.sweaty} onChange={(e) => setForm({ ...form, sweaty: e.target.checked })} /> Sweaty / clammy
          </label>
          <label>
            <input type="checkbox" checked={form.confused} onChange={(e) => setForm({ ...form, confused: e.target.checked })} /> More confused than usual
          </label>
          <label>Notes</label>
          <textarea
            placeholder="What else? Timing relative to last dose, other symptoms..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button className="primary" onClick={addCheckIn}>Save check-in</button>

          <h3 style={{ marginTop: 24 }}>Recent</h3>
          <div className="card-list">
            {checkins.slice(0, 8).map((c) => (
              <div key={c.id} className="entry">
                <strong>{c.time}</strong>
                {c.temp != null && <span className={c.temp < 97 ? " temp-low" : ""}> · {c.temp}°F</span>}
                {c.sweaty && " · Sweaty"}
                {c.confused && " · Confused"}
                {c.flag && <span className="flag"> {c.flag}</span>}
                {c.notes && <div style={{ marginTop: 4, color: "var(--muted)" }}>{c.notes}</div>}
              </div>
            ))}
            {checkins.length === 0 && <p style={{ color: "var(--muted)" }}>No check-ins yet.</p>}
          </div>
        </section>
      )}

      {tab === "meds" && (
        <section>
          <h2>Medications</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Only list what is actually prescribed. Times help you notice wearing-off windows. This app will not suggest extra doses.
          </p>
          {meds.map((m, i) => (
            <div key={i} className="entry" style={{ marginBottom: 12 }}>
              <strong>{m.name}</strong> — {m.dose}
              <div>Times: {m.times.join(", ")}</div>
              {m.notes && <div style={{ color: "var(--muted)" }}>{m.notes}</div>}
            </div>
          ))}
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Edit the list in the Details tab or by updating local storage. Default includes a common levodopa schedule as a starting point.
          </p>
        </section>
      )}

      {tab === "guide" && (
        <section>
          <h2>Quick guide</h2>
          <h3>Lewy Body Dementia</h3>
          <p>Fluctuations are common. Cognition, alertness, and movement can change over hours. Autonomic symptoms (temperature, sweating, blood pressure) can appear, especially around medication timing.</p>

          <h3>Right-hemisphere meningioma</h3>
          <p>May contribute to cognitive or sensory changes on the left side of the body. New weakness on one side, sudden confusion, or seizure-like activity needs urgent evaluation.</p>

          <h3>Temperature</h3>
          <p>Many older adults run near 97°F. A drop plus sweating and confusion is a pattern worth noting — it can be wearing-off, infection, or autonomic. Escalate if hard to wake, new one-sided weakness, or temperature truly low or high with other signs of illness.</p>

          <h3>Drugs that can harm people with Lewy body</h3>
          <ul>
            {DANGEROUS_DRUGS.map((d) => <li key={d}>{d}</li>)}
          </ul>
          <p>Do not hold carbidopa/levodopa or a cholinesterase inhibitor simply because the person is not eating, unless the clinician has ordered it.</p>
        </section>
      )}

      {tab === "er" && (
        <section>
          <h2>ER / handoff card</h2>
          <p>Show this screen or print it. Staff can photograph it.</p>
          <div className="er-card">
            <h3>LEWY BODY DEMENTIA — IMPORTANT</h3>
            <p><strong>Patient:</strong> {details.name}</p>
            <p><strong>Conditions:</strong> Lewy body dementia. Right-hemisphere meningioma.</p>
            <p><strong>Do NOT give:</strong></p>
            <ul>
              {DANGEROUS_DRUGS.map((d) => <li key={d}>{d}</li>)}
            </ul>
            <p><strong>Do NOT hold</strong> carbidopa/levodopa or cholinesterase inhibitor just because the patient is not eating, unless ordered by the treating clinician.</p>
            <p><strong>Clinician:</strong> {details.clinician || "—"}</p>
            <p style={{ fontSize: "0.85rem", marginTop: 16 }}>
              This card is for communication only. It is not a medical order. Contact the regular clinician for guidance when possible.
            </p>
          </div>
          <button className="primary" onClick={() => window.print()}>Print / Save as PDF</button>
        </section>
      )}

      {tab === "details" && (
        <section>
          <h2>Her details</h2>
          <label>Name / nickname</label>
          <input value={details.name} onChange={(e) => saveDetails({ ...details, name: e.target.value })} />
          <label>Usual well-day temperature (°F)</label>
          <input
            type="number"
            step="0.1"
            value={details.wellTemp}
            onChange={(e) => saveDetails({ ...details, wellTemp: parseFloat(e.target.value) || 97.5 })}
          />
          <label>Clinician name & phone</label>
          <input value={details.clinician} onChange={(e) => saveDetails({ ...details, clinician: e.target.value })} placeholder="Dr. Smith 555-1234" />
          <label>Key notes</label>
          <textarea value={details.notes} onChange={(e) => saveDetails({ ...details, notes: e.target.value })} />
          <button className="primary" onClick={exportData}>Export backup (JSON)</button>
        </section>
      )}

      <p className="disclaimer">
        This notebook stores data only in this browser. It does not diagnose, recommend doses, or replace clinical care.
        In an emergency call 911. Discuss patterns with her clinician.
      </p>
    </div>
  );
}