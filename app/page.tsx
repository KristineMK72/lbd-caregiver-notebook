"use client";

import { useEffect, useState } from "react";

type CheckIn = {
  id: string;
  time: string;
  alertness: string;
  mood: string;
  shakiness: string;
  sweaty: boolean;
  confused: boolean;
  recentAlcohol: boolean;
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
  {
    name: "Carbidopa/Levodopa",
    dose: "as prescribed on bottle",
    times: ["08:00", "12:00", "16:00", "20:00"],
    notes: "Watch for wearing-off near the end of each interval. Do not hold just because she is not eating unless clinician ordered.",
  },
];

const DANGEROUS_DRUGS = [
  "Haloperidol (Haldol)",
  "Metoclopramide (Reglan)",
  "Prochlorperazine (Compazine)",
  "Promethazine (Phenergan)",
  "Diphenhydramine (Benadryl)",
  "Other typical antipsychotics",
];

function medNames(meds: Med[]): string {
  return meds.map((m) => m.name.toLowerCase()).join(" | ");
}

function hasLevodopa(meds: Med[]): boolean {
  const n = medNames(meds);
  return n.includes("levodopa") || n.includes("carbidopa") || n.includes("sinemet");
}

function hasCholinesterase(meds: Med[]): boolean {
  const n = medNames(meds);
  return (
    n.includes("donepezil") ||
    n.includes("aricept") ||
    n.includes("rivastigmine") ||
    n.includes("exelon") ||
    n.includes("galantamine") ||
    n.includes("razadyne")
  );
}

function hasAntidepressant(meds: Med[]): boolean {
  const n = medNames(meds);
  return (
    n.includes("sertraline") ||
    n.includes("zoloft") ||
    n.includes("escitalopram") ||
    n.includes("lexapro") ||
    n.includes("citalopram") ||
    n.includes("fluoxetine") ||
    n.includes("prozac") ||
    n.includes("paroxetine") ||
    n.includes("paxil") ||
    n.includes("venlafaxine") ||
    n.includes("effexor") ||
    n.includes("duloxetine") ||
    n.includes("cymbalta") ||
    n.includes("bupropion") ||
    n.includes("wellbutrin") ||
    n.includes("mirtazapine") ||
    n.includes("remeron") ||
    n.includes("trazodone") ||
    n.includes("antidepressant")
  );
}

function getPossibleReasons(
  form: {
    alertness: string;
    mood: string;
    shakiness: string;
    sweaty: boolean;
    confused: boolean;
    recentAlcohol: boolean;
  },
  meds: Med[]
): string[] {
  const reasons: string[] = [];
  const hasNonUsual =
    form.alertness !== "usual" ||
    (form.mood !== "usual" && form.mood !== "up") ||
    form.shakiness !== "none" ||
    form.sweaty ||
    form.confused ||
    form.recentAlcohol;

  if (!hasNonUsual) return [];

  const levodopa = hasLevodopa(meds);
  const cholin = hasCholinesterase(meds);
  const antidepressant = hasAntidepressant(meds);

  // Core LBD / levodopa patterns — only if she is on levodopa
  if (
    levodopa &&
    (form.alertness === "drowsy" ||
      form.alertness === "hard to rouse" ||
      form.shakiness !== "none" ||
      form.sweaty ||
      form.confused)
  ) {
    reasons.push(
      "Wearing-off of carbidopa/levodopa (especially near the end of a dose interval). Can look like more sleepiness, shakiness, sweating, confusion, or low energy. Note timing relative to last dose."
    );
  }

  if (form.alertness !== "usual" || form.confused || (form.mood !== "usual" && form.mood !== "up")) {
    reasons.push(
      "Lewy body dementia fluctuation — alertness, thinking, and mood can shift over hours even when meds are on time."
    );
  }

  // Cholinesterase inhibitors
  if (cholin && (form.alertness !== "usual" || form.confused || form.mood !== "usual")) {
    reasons.push(
      "Cholinesterase inhibitor (e.g. donepezil / rivastigmine) is on her list. These can affect cognition and fluctuations. Do not hold just because she is not eating unless ordered."
    );
  }

  // Depression history
  if (form.mood === "down" || form.mood === "withdrawn" || form.alertness === "drowsy") {
    reasons.push(
      "Long history of depression. Can show up as low mood, withdrawal, low energy, or seeming more confused. Hard to separate from LBD or med effects — note both."
    );
  }

  if (antidepressant && (form.mood === "down" || form.mood === "withdrawn" || form.alertness === "drowsy" || form.confused)) {
    reasons.push(
      "Antidepressant is on her medication list. Mood or energy changes can interact with LBD fluctuations and other meds. Track both."
    );
  }

  // Alcohol
  if (form.recentAlcohol || form.confused || form.alertness !== "usual" || form.sweaty) {
    const medNote = levodopa
      ? "especially levodopa"
      : antidepressant
      ? "antidepressants and other LBD meds"
      : "her current medications";
    reasons.push(
      `Alcohol mixed with LBD meds (${medNote}) can worsen confusion, autonomic swings (sweating, BP), sleepiness, and fall risk even in small amounts.`
    );
  }

  // Meningioma / left-sided
  if (form.alertness === "hard to rouse" || form.confused) {
    reasons.push(
      "Right-hemisphere meningioma contribution. New left-sided weakness, sudden one-sided neglect, or seizure-like activity needs urgent evaluation."
    );
  }

  // Autonomic
  if (form.sweaty || form.shakiness !== "none") {
    reasons.push(
      "Autonomic fluctuation common in LBD (sweating, blood-pressure swings, dizziness). Often overlaps with wearing-off" +
        (levodopa ? " of levodopa" : "") +
        "."
    );
  }

  // Infection / illness
  if (form.sweaty || form.confused || form.alertness !== "usual") {
    reasons.push(
      "Early infection or other illness. Sweating + more confusion or sleepiness can look like wearing-off or an autonomic swing. Worth checking if it doesn’t fit her usual pattern."
    );
  }

  // Specific high-priority
  if (form.alertness === "hard to rouse") {
    reasons.push(
      "Hard to rouse is higher priority. Could be severe wearing-off" +
        (levodopa ? " of levodopa" : "") +
        ", infection, alcohol interaction, tumor-related change, or something else needing medical attention."
    );
  }

  if (form.sweaty && form.confused && levodopa) {
    reasons.push(
      "Sweaty + confused cluster was previously linked to a possible levodopa wearing-off episode that led to hospital evaluation. Note timing relative to last dose."
    );
  }

  if (form.alertness === "agitated") {
    reasons.push(
      "Agitation / restlessness can come from LBD hallucinations or fluctuations, pain, infection, wearing-off, or alcohol effects."
    );
  }

  // Positive note if up mood with other things
  if (form.mood === "up" && hasNonUsual) {
    reasons.push(
      "Mood is good / up — worth noting even if other things are off. Positive mood shifts can also be part of LBD fluctuations."
    );
  }

  return [...new Set(reasons)];
}

export default function Home() {
  const [tab, setTab] = useState<"checkin" | "meds" | "guide" | "er" | "details">("checkin");
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [meds, setMeds] = useState<Med[]>(DEFAULT_MEDS);
  const [details, setDetails] = useState({
    name: "Mom",
    clinician: "",
    notes: "Lewy body dementia. Right-hemisphere meningioma. Long history of depression.",
    depressionHistory: "Dealt with depression a lot of her life.",
    alcoholNotes: "Mixing alcohol with LBD meds (especially levodopa) and other drugs can worsen confusion, autonomic swings, and falls.",
  });

  const [form, setForm] = useState({
    alertness: "usual",
    mood: "usual",
    shakiness: "none",
    sweaty: false,
    confused: false,
    recentAlcohol: false,
    notes: "",
  });

  const [newMed, setNewMed] = useState({ name: "", dose: "", times: "", notes: "" });

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
    let flag: string | undefined;
    if (form.alertness === "hard to rouse") flag = "Hard to rouse";
    if (form.sweaty && form.confused) flag = flag ? flag + " + sweaty/confused cluster" : "Sweaty + confused cluster";
    if (form.shakiness === "noticeable") flag = flag ? flag + " + more shaky" : "More shaky";
    if (form.mood === "down" || form.mood === "withdrawn") flag = flag ? flag + " + mood change" : "Mood change";
    if (form.recentAlcohol) flag = flag ? flag + " + recent alcohol" : "Recent alcohol";

    const entry: CheckIn = {
      id: Date.now().toString(),
      time: new Date().toLocaleString(),
      alertness: form.alertness,
      mood: form.mood,
      shakiness: form.shakiness,
      sweaty: form.sweaty,
      confused: form.confused,
      recentAlcohol: form.recentAlcohol,
      notes: form.notes,
      flag,
    };
    saveCheckins([entry, ...checkins]);
    setForm({
      alertness: "usual",
      mood: "usual",
      shakiness: "none",
      sweaty: false,
      confused: false,
      recentAlcohol: false,
      notes: "",
    });
  };

  const addMed = () => {
    if (!newMed.name.trim()) return;
    const times = newMed.times
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const m: Med = {
      name: newMed.name.trim(),
      dose: newMed.dose.trim() || "as prescribed",
      times: times.length ? times : ["see bottle"],
      notes: newMed.notes.trim() || undefined,
    };
    saveMeds([...meds, m]);
    setNewMed({ name: "", dose: "", times: "", notes: "" });
  };

  const removeMed = (i: number) => {
    saveMeds(meds.filter((_, idx) => idx !== i));
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

  const possibleReasons = getPossibleReasons(form, meds);
  const levodopa = hasLevodopa(meds);
  const cholin = hasCholinesterase(meds);
  const antidepressant = hasAntidepressant(meds);

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
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Note what family members can see — how awake she is, mood, shakiness, sweating, confusion.
            {levodopa && " The sweaty + confused cluster (especially late in a levodopa dose) is worth logging."} Escalate if hard to rouse, new left-sided weakness, or seizing.
          </p>

          <label>How awake / alert?</label>
          <select value={form.alertness} onChange={(e) => setForm({ ...form, alertness: e.target.value })}>
            <option value="usual">Usual for her</option>
            <option value="drowsy">Drowsy / nodding off</option>
            <option value="hard to rouse">Hard to rouse / very sleepy</option>
            <option value="agitated">Agitated / restless</option>
          </select>

          <label>Mood</label>
          <select value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
            <option value="usual">Usual</option>
            <option value="up">Good / up</option>
            <option value="down">Down / low</option>
            <option value="irritable">Irritable</option>
            <option value="withdrawn">Withdrawn / quiet</option>
            <option value="anxious">Anxious / worried</option>
          </select>

          <label>Shakiness / tremor</label>
          <select value={form.shakiness} onChange={(e) => setForm({ ...form, shakiness: e.target.value })}>
            <option value="none">None or usual</option>
            <option value="mild">Mildly more shaky</option>
            <option value="noticeable">Noticeably more shaky</option>
          </select>

          <label>
            <input type="checkbox" checked={form.sweaty} onChange={(e) => setForm({ ...form, sweaty: e.target.checked })} /> Sweaty / clammy
          </label>
          <label>
            <input type="checkbox" checked={form.confused} onChange={(e) => setForm({ ...form, confused: e.target.checked })} /> More confused than usual
          </label>
          <label>
            <input type="checkbox" checked={form.recentAlcohol} onChange={(e) => setForm({ ...form, recentAlcohol: e.target.checked })} /> Alcohol in last 24 hours
          </label>

          {possibleReasons.length > 0 && (
            <div className="reasons-box">
              <strong>Possible things this could be (not a diagnosis):</strong>
              <ul>
                {possibleReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                These update from her current medications and the observations you pick. Escalate if hard to rouse, new left-sided weakness, seizing, or something feels urgently wrong. Call 911 in an emergency.
              </p>
            </div>
          )}

          <label>Notes (timing relative to last dose, other observations…)</label>
          <textarea
            placeholder="What else? Sleep, falls, appetite, left-side weakness, hallucinations…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button className="primary" onClick={addCheckIn}>Save check-in</button>

          <h3 style={{ marginTop: 24 }}>Recent</h3>
          <div className="card-list">
            {checkins.slice(0, 10).map((c) => (
              <div key={c.id} className="entry">
                <strong>{c.time}</strong>
                <div style={{ marginTop: 4 }}>
                  Alert: {c.alertness} · Mood: {c.mood} · Shaky: {c.shakiness}
                  {c.sweaty && " · Sweaty"}
                  {c.confused && " · Confused"}
                  {c.recentAlcohol && " · Alcohol"}
                </div>
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
            Only list what is actually on her bottles. Times help you notice wearing-off windows. These meds shape the possible-reasons panel on Check-in, the Guide, and the ER card. This notebook will not tell you to give an extra dose.
          </p>
          {meds.map((m, i) => (
            <div key={i} className="entry" style={{ marginBottom: 12 }}>
              <strong>{m.name}</strong> — {m.dose}
              <div>Times: {m.times.join(", ")}</div>
              {m.notes && <div style={{ color: "var(--muted)", marginTop: 4 }}>{m.notes}</div>}
              <button
                style={{ marginTop: 8, background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: 6, padding: "4px 8px", fontSize: "0.8rem" }}
                onClick={() => removeMed(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <h3 style={{ marginTop: 24 }}>Add a medication</h3>
          <label>Name</label>
          <input value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Donepezil" />
          <label>Dose</label>
          <input value={newMed.dose} onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })} placeholder="as on bottle" />
          <label>Times (comma-separated, e.g. 08:00, 14:00)</label>
          <input value={newMed.times} onChange={(e) => setNewMed({ ...newMed, times: e.target.value })} />
          <label>Notes</label>
          <input value={newMed.notes} onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })} />
          <button className="primary" onClick={addMed}>Add medication</button>

          <h3 style={{ marginTop: 28 }}>Common LBD medications (reference only)</h3>
          <div className="entry">
            <strong>Carbidopa/Levodopa</strong> — motor symptoms. Wearing-off can look like confusion, sweating, stiffness, low energy, or more shakiness near the end of the interval.
          </div>
          <div className="entry" style={{ marginTop: 8 }}>
            <strong>Cholinesterase inhibitors</strong> (donepezil, rivastigmine, galantamine) — cognition/fluctuations. Do not hold just because she is not eating unless ordered.
          </div>
          <div className="entry" style={{ marginTop: 8 }}>
            <strong>Antidepressants</strong> — she has a long history of depression. Some can interact with LBD meds or worsen autonomic symptoms; discuss with clinician.
          </div>
        </section>
      )}

      {tab === "guide" && (
        <section>
          <h2>Guide</h2>

          {meds.length > 0 && (
            <>
              <h3>Her current medications</h3>
              <p>These are the meds entered in the Meds tab. They influence the check-in possible-reasons panel and appear on the ER card.</p>
              <ul>
                {meds.map((m, i) => (
                  <li key={i}>
                    <strong>{m.name}</strong> — {m.dose} {m.times.length ? `(${m.times.join(", ")})` : ""}
                    {m.notes && ` — ${m.notes}`}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>Lewy Body Dementia</h3>
          <p>
            Fluctuations are common. Alertness, cognition, and movement can change over hours. Autonomic symptoms (sweating, blood pressure, dizziness) often appear, especially around medication timing. Hallucinations and sleep changes are also frequent. The combination of LBD + a brain tumor + long-term depression makes patterns harder to read — document what you see.
          </p>

          <h3>Right-hemisphere meningioma</h3>
          <p>
            A meningioma in the right hemisphere can contribute to left-sided sensory or motor changes, spatial issues, or cognitive shifts. New weakness on the left, sudden one-sided neglect, or seizure-like activity needs urgent evaluation. It does not replace the LBD picture but can overlap with it.
          </p>

          <h3>Depression history</h3>
          <p>
            She has dealt with depression for a lot of her life. Depression can look like increased confusion, low energy, withdrawal, or a down mood, and it interacts with LBD fluctuations and medication effects. Note mood changes in check-ins. Do not assume a “down day” is only depression or only LBD — track both.
          </p>

          <h3>Alcohol and mixing</h3>
          <p>
            Mixing alcohol with LBD medications
            {levodopa ? " (especially carbidopa/levodopa)" : ""}
            {antidepressant ? ", antidepressants" : ""}
            , or other drugs can worsen confusion, increase fall risk, destabilize blood pressure, and amplify autonomic swings. Even small amounts can matter. Note any recent alcohol in the check-in. This is not about judgment — it is about seeing the pattern clearly.
          </p>

          {levodopa && (
            <h3>The hospital episode pattern</h3>
          )}
          {levodopa && (
            <p>
              A cluster of sweating and increased confusion (sometimes with low energy or seeming “off”) was associated with a possible levodopa wearing-off episode that led to hospital evaluation. What matters is the cluster against her own baseline, especially late in a dose interval. Wearing-off, an autonomic swing, and early infection can look similar. Escalate if she is hard to rouse, newly weak on the left, or seizing.
            </p>
          )}

          <h3>Drugs that can harm people with Lewy body</h3>
          <ul>
            {DANGEROUS_DRUGS.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p>
            Do not hold carbidopa/levodopa or a cholinesterase inhibitor simply because she is not eating, unless the treating clinician has ordered it.
          </p>
        </section>
      )}

      {tab === "er" && (
        <section>
          <h2>ER / handoff card</h2>
          <p>Show this screen or print it. Staff can photograph it.</p>
          <div className="er-card">
            <h3>LEWY BODY DEMENTIA — IMPORTANT</h3>
            <p><strong>Patient:</strong> {details.name}</p>
            <p><strong>Conditions:</strong> Lewy body dementia. Right-hemisphere meningioma. Long history of depression.</p>
            {meds.length > 0 && (
              <>
                <p><strong>Current medications:</strong></p>
                <ul>
                  {meds.map((m, i) => (
                    <li key={i}>{m.name} — {m.dose}</li>
                  ))}
                </ul>
              </>
            )}
            <p><strong>Do NOT give:</strong></p>
            <ul>
              {DANGEROUS_DRUGS.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p><strong>Do NOT hold</strong> carbidopa/levodopa or cholinesterase inhibitor just because the patient is not eating, unless ordered by the treating clinician.</p>
            <p><strong>Alcohol:</strong> Recent alcohol can worsen confusion and autonomic symptoms. Ask about last use.</p>
            <p><strong>Clinician:</strong> {details.clinician || "—"}</p>
            <p style={{ fontSize: "0.85rem", marginTop: 16 }}>
              This card is for communication only. It is not a medical order. Contact the regular clinician for guidance when possible. In emergency call 911.
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
          <label>Clinician name & phone</label>
          <input value={details.clinician} onChange={(e) => saveDetails({ ...details, clinician: e.target.value })} placeholder="Dr. Smith 555-1234" />
          <label>Key notes</label>
          <textarea value={details.notes} onChange={(e) => saveDetails({ ...details, notes: e.target.value })} />
          <label>Depression history</label>
          <textarea value={details.depressionHistory} onChange={(e) => saveDetails({ ...details, depressionHistory: e.target.value })} />
          <label>Alcohol / mixing notes</label>
          <textarea value={details.alcoholNotes} onChange={(e) => saveDetails({ ...details, alcoholNotes: e.target.value })} />
          <button className="primary" onClick={exportData}>Export backup (JSON)</button>
        </section>
      )}

      <p className="disclaimer">
        This notebook stores data only in this browser. It does not diagnose, recommend doses, or replace clinical care.
        In an emergency call 911. Discuss patterns with her clinician. Alcohol and medication interactions are noted for awareness only.
      </p>
    </div>
  );
}
