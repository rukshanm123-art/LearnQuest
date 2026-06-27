"use client";

import { useMemo, useRef, useState } from "react";
import {
  Plus, Sparkles, Upload, Download, Pencil, Copy, Trash2, Send, Check, Archive, RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useRequireRole, AuthLoading, useCurrentAccount } from "@/lib/auth/guard";
import { useContentStore, useContentHydrated, useContentBootstrap } from "@/lib/content/store";
import type { ContentItem, ContentStatus } from "@/lib/content/types";
import { STATUS_LABELS } from "@/lib/content/types";
import { qaItem, qaReport } from "@/lib/content/qa";
import { parseItemsJson, parseItemsCsv, toJson, toCsv, CSV_TEMPLATE } from "@/lib/content/schema";
import { SUBJECTS, SUBJECT_MAP } from "@/lib/curriculum/nz-curriculum";
import { YEARS } from "@/lib/curriculum/objectives";
import { ItemEditor } from "@/components/author/ItemEditor";
import type { Question } from "@/types";
import { cn } from "@/lib/utils/cn";

const STATUS_STYLE: Record<ContentStatus, string> = {
  draft: "bg-black/5 text-ink/50",
  in_review: "bg-coin/20 text-yellow-700",
  published: "bg-xp/15 text-xp",
  retired: "bg-streak/15 text-streak",
};
const TABS = ["Library", "Coverage", "Import / Export"] as const;
type Tab = (typeof TABS)[number];

function download(name: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function AuthorPage() {
  const { ready } = useRequireRole(["admin", "author", "reviewer"]);
  return <AppShell>{ready ? <AuthorInner /> : <AuthLoading />}</AppShell>;
}

function AuthorInner() {
  useContentBootstrap();
  const hydrated = useContentHydrated();
  const account = useCurrentAccount();
  const itemsMap = useContentStore((s) => s.items);
  const save = useContentStore((s) => s.save);
  const setStatus = useContentStore((s) => s.setStatus);
  const duplicate = useContentStore((s) => s.duplicate);
  const remove = useContentStore((s) => s.remove);

  const role = account?.role ?? "admin";
  const canReview = role === "reviewer" || role === "admin";
  const canDelete = role === "admin";

  const [tab, setTab] = useState<Tab>("Library");
  const [editing, setEditing] = useState<ContentItem | "new" | null>(null);

  const all = useMemo(() => Object.values(itemsMap), [itemsMap]);
  const asQuestions = all as Question[];

  if (!hydrated) return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Loading content…</div>;

  if (editing) {
    return (
      <ItemEditor
        initial={editing === "new" ? null : editing}
        allItems={asQuestions}
        onSave={(item) => {
          save({ ...item, authorName: item.authorName ?? account?.displayName });
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">✍️ Content studio</h1>
          <p className="font-bold text-ink/50">
            {canReview ? "Author, review & publish curriculum-aligned activities." : "Author & submit drafts — a reviewer publishes them."}
          </p>
        </div>
        <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New item</Button>
      </div>

      <QaBanner items={asQuestions} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-2xl px-5 py-2.5 font-display font-bold transition-colors",
              tab === t ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Library" && (
        <Library items={all} onEdit={setEditing} setStatus={setStatus} duplicate={duplicate} remove={remove} canReview={canReview} canDelete={canDelete} />
      )}
      {tab === "Coverage" && <Coverage items={all} />}
      {tab === "Import / Export" && <ImportExport items={asQuestions} />}
    </div>
  );
}

function QaBanner({ items }: { items: Question[] }) {
  const r = qaReport(items);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {[
        { label: "Total items", value: r.total, cls: "bg-brand-50 text-brand-700" },
        { label: "Clean", value: r.clean, cls: "bg-xp/10 text-xp" },
        { label: "With errors", value: r.itemsWithErrors, cls: "bg-streak/10 text-streak" },
        { label: "Errors", value: r.errors, cls: "bg-streak/10 text-streak" },
        { label: "Warnings", value: r.warnings, cls: "bg-coin/15 text-yellow-700" },
      ].map((s) => (
        <div key={s.label} className={cn("rounded-2xl p-3 text-center", s.cls)}>
          <div className="font-display text-2xl font-extrabold">{s.value}</div>
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function Library({
  items, onEdit, setStatus, duplicate, remove, canReview, canDelete,
}: {
  items: ContentItem[];
  onEdit: (i: ContentItem) => void;
  setStatus: (id: string, s: ContentStatus) => void;
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
  canReview: boolean;
  canDelete: boolean;
}) {
  const [subject, setSubject] = useState("all");
  const [status, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);

  const rows = useMemo(() => {
    return items
      .filter((i) => (subject === "all" ? true : i.subject === subject))
      .filter((i) => (status === "all" ? true : i.status === status))
      .filter((i) => (q ? (i.prompt + i.id).toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, subject, status, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts…"
          className="min-w-0 flex-1 rounded-xl border-2 border-black/10 px-3 py-2 text-sm font-bold outline-none focus:border-brand-400" />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold">
          <option value="all">All subjects</option>
          {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button variant="outline" size="md" onClick={() => setDraftOpen((o) => !o)}><Sparkles className="h-4 w-4" /> AI draft</Button>
      </div>

      {draftOpen && <AiDraftPanel onClose={() => setDraftOpen(false)} />}

      <div className="space-y-2">
        {rows.length === 0 && <Card className="text-center font-bold text-ink/40">No items match.</Card>}
        {rows.map((item) => {
          const errs = qaItem(item, items).filter((x) => x.level === "error").length;
          const subj = SUBJECT_MAP[item.subject];
          return (
            <Card key={item.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="text-xl">{subj?.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.prompt || <span className="text-ink/30">(no prompt)</span>}</p>
                <p className="truncate text-xs font-semibold text-ink/40">
                  {subj?.name} · {item.type} · Y{item.year ?? "—"} · {item.objectiveIds.length} objective(s)
                  {errs > 0 && <span className="text-streak"> · {errs} error(s)</span>}
                </p>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_STYLE[item.status])}>{STATUS_LABELS[item.status]}</span>
              <div className="flex items-center gap-1">
                <IconBtn label="Edit" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></IconBtn>
                {item.status === "draft" && <IconBtn label="Submit for review" onClick={() => setStatus(item.id, "in_review")}><Send className="h-4 w-4" /></IconBtn>}
                {item.status === "in_review" && canReview && (
                  <IconBtn label="Approve & publish" disabled={errs > 0} onClick={() => setStatus(item.id, "published")}><Check className="h-4 w-4 text-xp" /></IconBtn>
                )}
                {item.status === "in_review" && !canReview && <span className="px-1 text-xs font-bold text-yellow-700">awaiting review</span>}
                {item.status === "published" && canReview && <IconBtn label="Retire" onClick={() => setStatus(item.id, "retired")}><Archive className="h-4 w-4" /></IconBtn>}
                {item.status === "retired" && canReview && <IconBtn label="Restore to draft" onClick={() => setStatus(item.id, "draft")}><RotateCcw className="h-4 w-4" /></IconBtn>}
                <IconBtn label="Duplicate" onClick={() => duplicate(item.id)}><Copy className="h-4 w-4" /></IconBtn>
                {canDelete && <IconBtn label="Delete" onClick={() => { if (confirm("Delete this item?")) remove(item.id); }}><Trash2 className="h-4 w-4 text-streak" /></IconBtn>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className="rounded-lg p-1.5 text-ink/50 hover:bg-black/5 disabled:opacity-30">{children}</button>
  );
}

function AiDraftPanel({ onClose }: { onClose: () => void }) {
  const importItems = useContentStore((s) => s.importItems);
  const [subject, setSubject] = useState("maths");
  const [year, setYear] = useState(3);
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/author/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, year, count }),
      });
      const data = await res.json();
      const { added } = importItems(data.items ?? [], data.ai ? "AI draft" : "Generator");
      setMsg(`Added ${added} draft${added === 1 ? "" : "s"} ${data.ai ? "(AI)" : "(generator fallback)"} — review them in the library.`);
    } catch {
      setMsg("Draft generation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="bg-gem/5">
      <div className="flex items-center justify-between">
        <CardLabel>AI-assisted drafting</CardLabel>
        <button onClick={onClose} className="text-xs font-bold text-ink/40">close</button>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold">
          {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold">
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <input type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-20 rounded-xl border-2 border-black/10 px-3 py-2 text-sm font-bold" />
        <Button onClick={run} disabled={busy}><Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate drafts"}</Button>
      </div>
      <p className="mt-2 text-xs font-semibold text-ink/50">Drafts always require human review before publishing. {msg && <span className="text-gem">{msg}</span>}</p>
    </Card>
  );
}

function Coverage({ items }: { items: ContentItem[] }) {
  const published = items.filter((i) => i.status === "published");
  const count = (subjectId: string, year: number) => published.filter((i) => i.subject === subjectId && i.year === year).length;

  return (
    <Card className="overflow-x-auto">
      <CardLabel>Published coverage — items per subject × year (gaps in red)</CardLabel>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold uppercase tracking-wide text-ink/40">
            <th className="py-2 pr-3">Subject</th>
            {YEARS.map((y) => <th key={y} className="px-2 text-center">Y{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {SUBJECTS.filter((s) => !s.comingSoon).map((s) => (
            <tr key={s.id} className="border-t border-black/5">
              <td className="py-2 pr-3 font-bold">{s.icon} {s.name}</td>
              {YEARS.map((y) => {
                const c = count(s.id, y);
                return (
                  <td key={y} className="px-2 text-center">
                    <span className={cn("inline-grid h-7 w-7 place-items-center rounded-lg font-bold",
                      c === 0 ? "bg-streak/10 text-streak/70" : c < 3 ? "bg-coin/15 text-yellow-700" : "bg-xp/15 text-xp")}>{c}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs font-semibold text-ink/40">Target: ≥ a few hundred published items per cell for a commercial bank. This view drives the content backlog (#03).</p>
    </Card>
  );
}

function ImportExport({ items }: { items: Question[] }) {
  const importItems = useContentStore((s) => s.importItems);
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<{ added: number; errors: string[] } | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const res = file.name.endsWith(".csv") ? parseItemsCsv(text) : parseItemsJson(text);
    const { added } = res.items.length ? importItems(res.items, "Import") : { added: 0 };
    setReport({ added, errors: res.errors });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardLabel>Import (JSON or CSV)</CardLabel>
        <p className="mt-1 text-sm font-semibold text-ink/50">Validated against the schema; valid rows are added as drafts.</p>
        <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Choose file</Button>
          <Button variant="outline" onClick={() => download("learnquest-template.csv", CSV_TEMPLATE, "text/csv")}><Download className="h-4 w-4" /> CSV template</Button>
        </div>
        {report && (
          <div className="mt-3 rounded-2xl bg-black/[0.03] p-3 text-sm font-semibold">
            <p className="text-xp">✓ Imported {report.added} item(s).</p>
            {report.errors.length > 0 && (
              <>
                <p className="mt-1 text-streak">{report.errors.length} row(s) rejected:</p>
                <ul className="mt-1 max-h-40 overflow-auto text-xs text-ink/60">
                  {report.errors.slice(0, 20).map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardLabel>Export</CardLabel>
        <p className="mt-1 text-sm font-semibold text-ink/50">Export the full bank for backup or to generate a DB seed (see <code>scripts/content/generate-seed.mjs</code>).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => download("learnquest-content.json", toJson(items), "application/json")}><Download className="h-4 w-4" /> Export JSON</Button>
          <Button variant="outline" onClick={() => download("learnquest-content.csv", toCsv(items), "text/csv")}><Download className="h-4 w-4" /> Export CSV</Button>
        </div>
        <p className="mt-3 text-xs font-semibold text-ink/40">Pipeline: author → export JSON → <code>node scripts/content/generate-seed.mjs</code> → <code>supabase/seed.sql</code>.</p>
      </Card>
    </div>
  );
}
