"use client";
import { useEffect, useState } from "react";
import { allocationCsv, importAllocation, permutedBlocks, pilotSequence } from "@/lib/allocation";
import type { Background, AllocationRow, StudyCondition } from "@/lib/allocation";
import {
  filmIds,
  participantIdSchema,
  studySessionSchema,
  STUDY_REGISTRY,
  validateRegistry,
} from "@/lib/study-session";
import { download } from "./captune/storage";
import { Icon } from "./icon";
const titles = [
  "Big Buck Bunny",
  "Sintel (dialogue only)",
  "Tears of Steel (dialogue only)",
  "Soar",
  "Hair Love",
];
export function SessionSetup({ durations }: { durations: Record<string, number> }) {
  const [checkpointText, setCheckpointText] = useState<Record<string, string>>({}),
    [comprehension, setComprehension] = useState(false),
    [custom, setCustom] = useState(true),
    [tlx, setTlx] = useState(true),
    [childItems, setChildItems] = useState<("readability" | "control" | "story")[]>([
      "readability",
      "control",
      "story",
    ]),
    [signText, setSignText] = useState("{}");
  const [id, setId] = useState(""),
    [group, setGroup] = useState<"child" | "adult">("adult"),
    [background, setBackground] = useState<Background>("frequent"),
    [design, setDesign] = useState<"between" | "within-pilot">("between"),
    [seed, setSeed] = useState("study-2026"),
    [allocation, setAllocation] = useState<AllocationRow[]>([]),
    [films, setFilms] = useState<string[]>(["soar"]),
    [three, setThree] = useState(false),
    [slot, setSlot] = useState(0),
    [readingSpeed, setReadingSpeed] = useState<15 | 17 | 20>(20),
    [ticks, setTicks] = useState(true),
    [message, setMessage] = useState(""),
    [link, setLink] = useState(""),
    [ack, setAck] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const r = validateRegistry(localStorage.getItem(STUDY_REGISTRY));
      setAllocation(r.allocations);
      setSeed(r.seed);
    } catch {
      setMessage("Saved configuration could not be read. Export/recover it before continuing.");
    }
    setReady(true);
  }, []);
  function saveRows(rows: AllocationRow[]) {
    const r = validateRegistry(localStorage.getItem(STUDY_REGISTRY));
    localStorage.setItem(STUDY_REGISTRY, JSON.stringify({ ...r, allocations: rows, seed }));
    setAllocation(rows);
  }
  function create() {
    try {
      const participantId = participantIdSchema.parse(id),
        r = validateRegistry(localStorage.getItem(STUDY_REGISTRY));
      if (Object.values(r.sessions).some((s) => s.participantId === participantId))
        throw Error("This participant already has a session. Resume it below.");
      if (!films.length) throw Error("Select at least one film.");
      const row = allocation.find((a) => a.stratum === background && !a.participantId);
      if (design === "between" && !row) throw Error("Import or generate an allocation list first.");
      const conditions: StudyCondition[] = three
        ? ["essential", "balanced", "rich"]
        : ["baseline", "personalized"];
      const sequence =
        design === "between"
          ? films.map((filmId) => ({ filmId, condition: row!.condition }))
          : pilotSequence(films, conditions, slot);
      const checkpoints = Object.fromEntries(
        films.map((film) => [
          film,
          (checkpointText[film] || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map(Number),
        ]),
      );
      for (const [film, times] of Object.entries(checkpoints))
        if (times.some((t) => t >= durations[film]))
          throw Error("Checkpoints must fall before the end of each film.");
      for (const saved of Object.values(r.sessions))
        for (const film of films)
          if (
            saved.sequence.some((e) => e.filmId === film) &&
            JSON.stringify(saved.checkpoints[film] || []) !== JSON.stringify(checkpoints[film])
          )
            throw Error(
              "Checkpoint times must match saved sessions for the same films. Freeze them across conditions before recruitment.",
            );
      const session = studySessionSchema.parse({
        id: crypto.randomUUID(),
        participantId,
        group,
        background,
        design,
        seed,
        allocationSlot: design === "between" ? row!.slot : `pilot-${slot}`,
        sequence,
        sequenceIndex: 0,
        readingSpeed,
        ticks,
        comprehension,
        instruments: { custom, tlx, childItems },
        signVideos: JSON.parse(signText),
        checkpoints,
        createdAt: new Date().toISOString(),
      });
      const rows = allocation.map((a) =>
        a.slot === row?.slot && design === "between" ? { ...a, participantId } : a,
      );
      localStorage.setItem(
        STUDY_REGISTRY,
        JSON.stringify({ ...r, seed, allocations: rows, sessions: { ...r.sessions, [session.id]: session } }),
      );
      setAllocation(rows);
      setLink(`/?session=${session.id}`);
      setMessage(`Saved fixed assignment: ${sequence.map((x) => `${x.filmId}: ${x.condition}`).join("; ")}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Session could not be saved.");
    }
  }
  const participantValid = /^P-[0-9]{3,6}$/.test(id);
  const unused = allocation.filter((r) => r.stratum === background && !r.participantId).length;
  const filmCountNeeded = design === "within-pilot" ? (three ? 3 : 2) : null;
  const checkpointProblems = films.filter((film) =>
    (checkpointText[film] || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .some((t) => !Number.isFinite(Number(t)) || Number(t) < 0 || Number(t) >= durations[film]),
  );
  let signValid = true;
  try {
    JSON.parse(signText);
  } catch {
    signValid = false;
  }
  const steps = [
    { id: "step-participant", title: "Participant", done: participantValid },
    { id: "step-design", title: "Design and allocation", done: design === "between" ? unused > 0 : true },
    { id: "step-films", title: "Films and order", done: films.length > 0 && (!filmCountNeeded || films.length === filmCountNeeded) },
    { id: "step-instruments", title: "Checkpoints and instruments", done: !checkpointProblems.length && signValid },
    { id: "step-review", title: "Review", done: !!link },
  ];
  const issues = [
    !participantValid && "Enter a participant code like P-001.",
    design === "between" && !unused && "Generate or import an allocation list with an unused assignment for this background.",
    !films.length && "Select at least one film.",
    filmCountNeeded && films.length && films.length !== filmCountNeeded && `This pilot design needs ${filmCountNeeded} distinct films.`,
    checkpointProblems.length && "Checkpoints must be numbers that fall before the end of each film.",
    !signValid && "Sign-language clips must be valid JSON.",
  ].filter(Boolean) as string[];
  const filmTitle = (film: string) => titles[filmIds.indexOf(film as (typeof filmIds)[number])];
  return (
    <main id="main" className="session-page research-page">
      <header className="page-hero">
        <h1>Research session setup</h1>
        <p className="page-hero__lede">
          Local technical preparation only. This is not formal research consent or an approved participant
          study. Session links work in this browser on this device; nothing is uploaded.
        </p>
      </header>
      <div className="stepper-layout">
        <nav className="stepper" aria-label="Setup steps">
          <ol>
            {steps.map((step, i) => (
              <li key={step.id} className={step.done ? "is-done" : ""}>
                <a href={`#${step.id}`}>
                  <span className="stepper__marker" aria-hidden="true">
                    {step.done ? <Icon name="check" size={16} /> : i + 1}
                  </span>
                  <span>
                    {step.title}
                    <span className="sr-only">{step.done ? " (complete)" : " (to do)"}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="stepper-content">
          <section id="step-participant" className="form-step" aria-labelledby="step-participant-title">
            <h2 id="step-participant-title"><span className="form-step__n">1</span>Participant</h2>
            <div className="form-field">
              <label htmlFor="participant-code">Participant code</label>
              <input
                id="participant-code"
                className="input"
                value={id}
                placeholder="P-001"
                onChange={(e) => setId(e.target.value)}
                pattern="P-[0-9]{3,6}"
                aria-invalid={id !== "" && !participantValid ? true : undefined}
                aria-describedby="participant-code-help"
              />
              <span id="participant-code-help" className={`field__helper ${id && !participantValid ? "is-error" : ""}`}>
                {id && !participantValid ? "Use P- followed by 3 to 6 digits, for example P-001." : "Pseudonymous code, for example P-001. No names."}
              </span>
            </div>
            <label className="form-field">
              Participant group
              <select
                className="select"
                aria-label="Participant group"
                value={group}
                onChange={(e) => {
                  const next = e.target.value as typeof group;
                  setGroup(next);
                  setReadingSpeed(next === "child" ? 17 : 20);
                }}
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
              </select>
            </label>
            <label className="form-field">
              Caption-use background
              <select
                className="select"
                aria-label="Caption-use background"
                value={background}
                onChange={(e) => setBackground(e.target.value as Background)}
              >
                {["frequent", "occasional", "rare"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </section>

          <section id="step-design" className="form-step" aria-labelledby="step-design-title">
            <h2 id="step-design-title"><span className="form-step__n">2</span>Design and allocation</h2>
            <label className="form-field">
              Design
              <select
                className="select"
                aria-label="Design"
                value={design}
                onChange={(e) => setDesign(e.target.value as typeof design)}
              >
                <option value="between">Between participants</option>
                <option value="within-pilot">Within-participant pilot</option>
              </select>
            </label>
            {design === "between" ? (
              <div className="form-subsection">
                <h3>Fixed allocation list</h3>
                <p className="field__helper">
                  Seeded permuted blocks of four, separately for each caption-use background. Generate and export
                  before recruitment. Existing assignments never change on reload.
                </p>
                <label className="form-field">
                  Allocation seed
                  <input
                    className="input"
                    value={seed}
                    disabled={allocation.some((r) => r.participantId)}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </label>
                <div className="button-row">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={!ready || allocation.some((r) => r.participantId)}
                    onClick={() => {
                      try {
                        saveRows(permutedBlocks(seed));
                        setMessage("Allocation list saved. Export it before recruitment.");
                      } catch {
                        setMessage("Allocation list could not be saved.");
                      }
                    }}
                  >
                    Generate allocation list
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={!allocation.length}
                    onClick={() => download("scenecaptions-allocation.csv", allocationCsv(allocation))}
                  >
                    <Icon name="download" size={18} />
                    Export allocation CSV
                  </button>
                </div>
                <label className="form-field">
                  Import allocation CSV
                  <input
                    className="file-input"
                    type="file"
                    accept=".csv"
                    disabled={allocation.some((r) => r.participantId)}
                    onChange={async (e) => {
                      try {
                        const file = e.target.files?.[0];
                        if (file) {
                          const rows = importAllocation(await file.text());
                          saveRows(rows);
                          setMessage("Imported fixed list.");
                        }
                      } catch (err) {
                        setMessage(err instanceof Error ? err.message : "Import failed.");
                      }
                    }}
                  />
                </label>
                <p className={`inline-status ${unused ? "" : "is-error"}`}>
                  {unused} unused assignments in this stratum.
                </p>
              </div>
            ) : (
              <div className="form-subsection">
                <h3>Pilot counterbalancing</h3>
                <label className="check-field">
                  <input type="checkbox" checked={three} onChange={(e) => setThree(e.target.checked)} />
                  Three fixed detail conditions (Essential, Balanced, Rich)
                </label>
                <p className="field__helper">
                  {three
                    ? "Six Williams sequences balance three conditions. Select three distinct films."
                    : "Four sequences cross condition order with film order. Select two distinct films."}
                </p>
                <label className="form-field">
                  Preassigned sequence slot (starting at 0)
                  <input className="input input--short" type="number" min="0" value={slot} onChange={(e) => setSlot(Number(e.target.value))} />
                </label>
              </div>
            )}
          </section>

          <section id="step-films" className="form-step" aria-labelledby="step-films-title">
            <h2 id="step-films-title"><span className="form-step__n">3</span>Films and order</h2>
            <fieldset className="check-list">
              <legend>Films in viewing order</legend>
              {/* Sintel and Tears of Steel are hidden: they have dialogue subtitles only, no sound captions. */}
              {filmIds.map((film, i) => [film, i] as const).filter(([film]) => film !== "sintel" && film !== "tears-of-steel").map(([film, i]) => (
                <label key={film} className="check-field">
                  <input
                    type="checkbox"
                    checked={films.includes(film)}
                    onChange={(e) => setFilms(e.target.checked ? [...films, film] : films.filter((x) => x !== film))}
                  />
                  {titles[i]}
                </label>
              ))}
            </fieldset>
            <p className={`inline-status ${steps[2].done ? "" : "is-error"}`}>
              {films.length
                ? `Order: ${films.map((f, i) => `${i + 1}. ${filmTitle(f)}`).join("  ")}`
                : "Select at least one film."}
              {filmCountNeeded && films.length !== filmCountNeeded ? ` This pilot design needs ${filmCountNeeded} distinct films.` : ""}
            </p>
          </section>

          <section id="step-instruments" className="form-step" aria-labelledby="step-instruments-title">
            <h2 id="step-instruments-title"><span className="form-step__n">4</span>Checkpoints and instruments</h2>
            <p className="field__helper">
              Freeze narrative-boundary timestamps across conditions. Checkpoints interrupt the film; leave blank
              for continuous viewing.
            </p>
            {films.map((film) => (
              <div key={film} className="form-field">
                <label htmlFor={`checkpoints-${film}`}>{filmTitle(film)} checkpoint seconds (comma separated)</label>
                <input
                  id={`checkpoints-${film}`}
                  className="input"
                  value={checkpointText[film] || ""}
                  aria-invalid={checkpointProblems.includes(film) || undefined}
                  aria-describedby={checkpointProblems.includes(film) ? `checkpoints-${film}-error` : undefined}
                  onChange={(e) => setCheckpointText({ ...checkpointText, [film]: e.target.value })}
                />
                {checkpointProblems.includes(film) && (
                  <span id={`checkpoints-${film}-error`} className="field__helper is-error">
                    Use numbers below {Math.floor(durations[film])} seconds, separated by commas.
                  </span>
                )}
              </div>
            ))}
            <label className="check-field">
              <input type="checkbox" checked={comprehension} onChange={(e) => setComprehension(e.target.checked)} />
              Include reviewed comprehension questions when available
            </label>
            <p className="field__helper">The supplied question file is an example only and is never shown to participants.</p>
            {group === "adult" ? (
              <>
                <label className="check-field">
                  <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} />
                  Include four exploratory 7-point items
                </label>
                <label className="check-field">
                  <input type="checkbox" checked={tlx} onChange={(e) => setTlx(e.target.checked)} />
                  Include Raw NASA-TLX (six subscales)
                </label>
              </>
            ) : (
              <fieldset className="check-list">
                <legend>Child pictorial items (up to three)</legend>
                {(["readability", "control", "story"] as const).map((key) => (
                  <label key={key} className="check-field">
                    <input
                      type="checkbox"
                      checked={childItems.includes(key)}
                      onChange={(e) =>
                        setChildItems(e.target.checked ? [...childItems, key] : childItems.filter((x) => x !== key))
                      }
                    />
                    {key}
                  </label>
                ))}
              </fieldset>
            )}
            <div className="form-field">
              <label htmlFor="sign-clips">Optional sign-language clips (JSON map of item IDs to local /study/...mp4 paths)</label>
              <textarea id="sign-clips" className="input" value={signText} aria-invalid={!signValid || undefined} aria-describedby={!signValid ? "sign-clips-error" : undefined} onChange={(e) => setSignText(e.target.value)} />
              {!signValid && <span id="sign-clips-error" className="field__helper is-error">This is not valid JSON yet.</span>}
            </div>
            <label className="form-field">
              Reading pace
              <select
                className="select"
                aria-label="Reading pace"
                value={readingSpeed}
                onChange={(e) => setReadingSpeed(Number(e.target.value) as 15 | 17 | 20)}
              >
                {[15, 17, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} characters per second
                  </option>
                ))}
              </select>
            </label>
            <p className="field__helper">
              Group defaults are configurable preparation choices, not a measure of an individual&apos;s reading ability.
            </p>
            <label className="check-field">
              <input type="checkbox" checked={ticks} onChange={(e) => setTicks(e.target.checked)} />
              Show sound positions on the scrub bar
            </label>
          </section>

          <section id="step-review" className="form-step form-step--review" aria-labelledby="step-review-title">
            <h2 id="step-review-title"><span className="form-step__n">5</span>Review</h2>
            <dl className="review-list">
              <div><dt>Participant</dt><dd>{id || "Not set"}, {group}, {background} caption use</dd></div>
              <div><dt>Design</dt><dd>{design === "between" ? "Between participants" : `Within-participant pilot, slot ${slot}${three ? ", three detail conditions" : ""}`}</dd></div>
              <div><dt>Films</dt><dd>{films.length ? films.map(filmTitle).join(", ") : "None selected"}</dd></div>
              <div><dt>Checkpoints</dt><dd>{films.map((f) => `${filmTitle(f)}: ${(checkpointText[f] || "").trim() || "none"}`).join("; ") || "None"}</dd></div>
              <div><dt>Instruments</dt><dd>{group === "adult" ? [custom && "four 7-point items", tlx && "Raw NASA-TLX"].filter(Boolean).join(", ") || "None" : childItems.join(", ") || "None"}{comprehension ? ", comprehension when reviewed" : ""}</dd></div>
              <div><dt>Viewing</dt><dd>{readingSpeed} characters per second, sound positions {ticks ? "shown" : "hidden"}</dd></div>
            </dl>
            {issues.length > 0 && (
              <div className="callout callout--danger" role="note">
                <Icon name="warning" size={20} />
                <div>
                  <strong>Check before creating</strong>
                  <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
                </div>
              </div>
            )}
            <label className="check-field">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />I am preparing a
              local technical rehearsal; study consent is handled separately.
            </label>
            <button type="button" className="btn btn--primary" disabled={!ready || !ack} onClick={create}>
              Create session
            </button>
            {link && (
              <p className="callout">
                <Icon name="check" size={20} />
                <a href={link}>Open saved session</a>
              </p>
            )}
            <p role="status" className="inline-status">{message}</p>
          </section>
          <SavedSessions key={link} />
        </div>
      </div>
    </main>
  );
}
function SavedSessions() {
  const [sessions, setSessions] = useState<{ id: string; participantId: string }[]>([]);
  useEffect(() => {
    try {
      setSessions(Object.values(validateRegistry(localStorage.getItem(STUDY_REGISTRY)).sessions));
    } catch {
      /* Setup displays the storage warning. */
    }
  }, []);
  return (
    <section className="form-step saved-sessions" aria-labelledby="saved-sessions-title">
      <h2 id="saved-sessions-title">Saved sessions</h2>
      {sessions.length ? (
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              <a href={`/?session=${s.id}`}>Resume session for {s.participantId}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="field__helper">No saved sessions in this browser yet.</p>
      )}
    </section>
  );
}
