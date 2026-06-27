"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { Question } from "@/types";
import type { ContentItem } from "@/lib/content/types";
import { ACTIVITY_TYPES } from "@/lib/content/schema";
import { qaItem } from "@/lib/content/qa";
import { SUBJECTS, STRANDS_BY_SUBJECT } from "@/lib/curriculum/nz-curriculum";
import { objectivesForSubject, yearToAgeBand, yearToLevel, YEARS } from "@/lib/curriculum/objectives";
import { Button } from "@/components/ui/Button";
import { ItemPreview } from "./ItemPreview";
import { cn } from "@/lib/utils/cn";

const MCQ = new Set(["multiple-choice", "reading-comprehension", "science-sim", "timed-challenge", "matching"]);
const SENTENCE = new Set(["sentence-building", "drag-and-drop"]);
const inputCls = "w-full rounded-xl border-2 border-black/10 px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink/50">{label}</span>
      {children}
    </label>
  );
}

export function ItemEditor({
  initial, allItems, onSave, onCancel,
}: {
  initial?: ContentItem | null;
  allItems: Question[];
  onSave: (item: ContentItem) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState(initial?.subject ?? "maths");
  const [strandId, setStrandId] = useState(initial?.strandId ?? STRANDS_BY_SUBJECT["maths"][0].id);
  const [type, setType] = useState(initial?.type ?? "multiple-choice");
  const [year, setYear] = useState<number>(initial?.year ?? 3);
  const [difficulty, setDifficulty] = useState<number>(initial?.difficulty ?? 2);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [passage, setPassage] = useState(initial?.passage ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState<number>(typeof initial?.answer === "number" ? initial.answer : 0);
  const [mathAnswer, setMathAnswer] = useState(typeof initial?.answer === "string" && initial.type === "math-puzzle" ? initial.answer : "");
  const [sentence, setSentence] = useState(
    initial && SENTENCE.has(initial.type) && typeof initial.answer === "string" ? initial.answer : "",
  );
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [objectiveIds, setObjectiveIds] = useState<string[]>(initial?.objectiveIds ?? []);
  const [xp, setXp] = useState<number>(initial?.xp ?? 14);
  const [coins, setCoins] = useState<number>(initial?.coins ?? 4);

  const isMcq = MCQ.has(type);
  const isSentence = SENTENCE.has(type);
  const isMath = type === "math-puzzle";

  const onSubjectChange = (s: Question["subject"]) => {
    setSubject(s);
    const strands = STRANDS_BY_SUBJECT[s] ?? [];
    if (strands.length && !strands.some((x) => x.id === strandId)) setStrandId(strands[0].id);
    setObjectiveIds([]);
  };

  const current: ContentItem = useMemo(
    () => ({
      id: initial?.id ?? "",
      subject, strandId, type, year, level: yearToLevel(year), ageBand: yearToAgeBand(year), difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
      prompt, explanation, xp, coins,
      options: isMcq ? options : undefined,
      answer: isMcq ? answerIndex : isMath ? mathAnswer : sentence,
      tokens: isSentence ? sentence.trim().split(/\s+/).filter(Boolean) : undefined,
      passage: type === "reading-comprehension" ? passage : undefined,
      objectiveIds,
      status: initial?.status ?? "draft",
      version: initial?.version ?? 1,
      updatedAt: new Date().toISOString(),
    }),
    [initial, subject, strandId, type, year, difficulty, prompt, explanation, xp, coins, isMcq, options, answerIndex, isMath, mathAnswer, isSentence, sentence, passage, objectiveIds],
  );

  const issues = qaItem(current, allItems);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">{initial ? "Edit item" : "New item"}</h2>
          <button onClick={onCancel} aria-label="Close" className="rounded-xl p-1.5 text-ink/40 hover:bg-black/5"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject">
            <select className={inputCls} value={subject} onChange={(e) => onSubjectChange(e.target.value as Question["subject"])}>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Strand">
            <select className={inputCls} value={strandId} onChange={(e) => setStrandId(e.target.value)}>
              {(STRANDS_BY_SUBJECT[subject] ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Activity type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as Question["type"])}>
              {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label={`Year (→ Level ${yearToLevel(year)}, ages ${yearToAgeBand(year)})`}>
            <select className={inputCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </Field>
          <Field label="Difficulty (1–5)">
            <input type="number" min={1} max={5} className={inputCls} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="XP"><input type="number" min={0} className={inputCls} value={xp} onChange={(e) => setXp(Number(e.target.value))} /></Field>
            <Field label="Coins"><input type="number" min={0} className={inputCls} value={coins} onChange={(e) => setCoins(Number(e.target.value))} /></Field>
          </div>
        </div>

        {type === "reading-comprehension" && (
          <Field label="Passage"><textarea rows={3} className={inputCls} value={passage} onChange={(e) => setPassage(e.target.value)} /></Field>
        )}

        <Field label="Prompt"><textarea rows={2} className={inputCls} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="The question…" /></Field>

        {isMcq && (
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink/50">Options (select the correct one)</span>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={answerIndex === i} onChange={() => setAnswerIndex(i)} className="h-5 w-5" aria-label={`Mark option ${i + 1} correct`} />
                  <input className={inputCls} value={opt} placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    onChange={(e) => setOptions((o) => o.map((v, j) => (j === i ? e.target.value : v)))} />
                  {options.length > 2 && (
                    <button onClick={() => { setOptions((o) => o.filter((_, j) => j !== i)); if (answerIndex >= i && answerIndex > 0) setAnswerIndex((a) => a - 1); }}
                      className="rounded-lg p-1.5 text-streak hover:bg-streak/10" aria-label="Remove option"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOptions((o) => [...o, ""])}><Plus className="h-4 w-4" /> Add option</Button>
            )}
          </div>
        )}

        {isMath && (
          <Field label="Correct answer"><input className={inputCls} value={mathAnswer} onChange={(e) => setMathAnswer(e.target.value)} placeholder="e.g. 42" /></Field>
        )}

        {isSentence && (
          <Field label="Correct sentence (tokens are split on spaces)">
            <input className={inputCls} value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="The dog ran fast" />
          </Field>
        )}

        <Field label="Explanation (shown by the AI tutor)"><textarea rows={2} className={inputCls} value={explanation} onChange={(e) => setExplanation(e.target.value)} /></Field>

        <div>
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink/50">Curriculum objectives</span>
          <div className="flex flex-wrap gap-2">
            {objectivesForSubject(subject).map((o) => {
              const on = objectiveIds.includes(o.id);
              return (
                <button key={o.id} title={o.description}
                  onClick={() => setObjectiveIds((ids) => on ? ids.filter((x) => x !== o.id) : [...ids, o.id])}
                  className={cn("rounded-full px-2.5 py-1 text-xs font-bold", on ? "bg-brand-500 text-white" : "bg-black/5 text-ink/60 hover:bg-black/10")}>
                  {o.code} · Y{o.year}
                </button>
              );
            })}
            {objectivesForSubject(subject).length === 0 && <span className="text-xs font-semibold text-ink/40">No objectives for this subject yet.</span>}
          </div>
        </div>
      </div>

      {/* Preview + QA */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/50">Live preview</p>
          <ItemPreview item={current} />
        </div>

        <div className="rounded-2xl border-2 border-black/10 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Quality checks</p>
          {issues.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-xp">✓ All checks passed</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm font-semibold">
              {errors.map((e, i) => <li key={`e${i}`} className="text-streak">● {e.message}{e.field ? ` (${e.field})` : ""}</li>)}
              {warnings.map((w, i) => <li key={`w${i}`} className="text-yellow-700">▲ {w.message}{w.field ? ` (${w.field})` : ""}</li>)}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => onSave(current)}>{initial ? "Save changes" : "Create draft"}</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
        {errors.length > 0 && <p className="text-xs font-bold text-streak">Fix {errors.length} error(s) before publishing.</p>}
      </div>
    </div>
  );
}
