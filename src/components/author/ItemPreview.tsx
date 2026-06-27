"use client";

import type { Question } from "@/types";
import { SUBJECT_MAP } from "@/lib/curriculum/nz-curriculum";
import { cn } from "@/lib/utils/cn";

const MCQ = new Set(["multiple-choice", "reading-comprehension", "science-sim", "timed-challenge", "matching"]);

/** Read-only preview of how an authored item will appear to learners. */
export function ItemPreview({ item }: { item: Partial<Question> }) {
  const subj = item.subject ? SUBJECT_MAP[item.subject] : null;

  return (
    <div className="rounded-2xl border-2 border-black/10 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: subj?.color }}>
        {subj && <span>{subj.icon} {subj.name}</span>}
        {item.year && <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink/50">Year {item.year}</span>}
        {item.difficulty && <span className="ml-auto text-xs text-ink/40">{"★".repeat(item.difficulty)}</span>}
      </div>

      {item.passage && (
        <p className="mb-3 rounded-xl bg-brand-50 p-3 text-sm font-semibold leading-relaxed text-ink/80">{item.passage}</p>
      )}

      <h3 className="font-display text-lg font-extrabold leading-snug">{item.prompt || <span className="text-ink/30">No prompt yet…</span>}</h3>

      {item.type && MCQ.has(item.type) && item.options && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {item.options.map((opt, idx) => (
            <div key={idx} className={cn("flex items-center gap-2 rounded-xl border-2 p-2.5 text-sm font-bold",
              idx === item.answer ? "border-xp bg-xp/10 text-xp" : "border-black/10")}>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-black/5 text-xs">{String.fromCharCode(65 + idx)}</span>
              {opt || <span className="text-ink/30">empty</span>}
            </div>
          ))}
        </div>
      )}

      {item.type === "math-puzzle" && (
        <div className="mt-3 rounded-xl border-2 border-xp bg-xp/10 p-3 font-display font-extrabold text-xp">
          Answer: {String(item.answer ?? "—")}
        </div>
      )}

      {(item.type === "sentence-building" || item.type === "drag-and-drop") && item.tokens && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tokens.map((t, i) => (
            <span key={i} className="rounded-lg border-2 border-black/10 bg-white px-2.5 py-1 text-sm font-bold">{t}</span>
          ))}
        </div>
      )}

      {item.explanation && (
        <p className="mt-3 border-t border-black/5 pt-2 text-sm font-semibold text-ink/50">💡 {item.explanation}</p>
      )}
    </div>
  );
}
