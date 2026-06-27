"use client";

import { useMemo, useState } from "react";
import { Users, GraduationCap, ClipboardList, Plus, Copy, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getLevelInfo } from "@/lib/gamification/engine";
import { SUBJECTS } from "@/lib/curriculum/nz-curriculum";
import { QUESTS } from "@/data/quests";
import { useRequireRole, AuthLoading, useCurrentAccount } from "@/lib/auth/guard";
import { useAuth } from "@/lib/auth/store";
import type { GeneratedAssignment } from "@/app/api/ai/assignment/route";
import { cn } from "@/lib/utils/cn";

const MOCK_STUDENTS = [
  { name: "Aroha", xp: 1240, accuracy: 0.91, streak: 12 },
  { name: "Liam", xp: 980, accuracy: 0.84, streak: 5 },
  { name: "Mereana", xp: 870, accuracy: 0.78, streak: 8 },
  { name: "Tama", xp: 640, accuracy: 0.72, streak: 3 },
];

const MOCK_ASSIGNMENTS = [
  { title: "Numberforge: Warm-Up", subject: "maths", due: "Fri", completion: 0.82 },
  { title: "Storyhaven reading task", subject: "english", due: "Mon", completion: 0.46 },
  { title: "Living World quiz", subject: "science", due: "Wed", completion: 0.61 },
];

const CLASS_MASTERY = [
  { id: "maths", value: 0.79 }, { id: "english", value: 0.84 }, { id: "science", value: 0.71 },
  { id: "social", value: 0.66 }, { id: "tech", value: 0.58 },
];

function hashStr(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

export default function TeacherPage() {
  const { ready } = useRequireRole(["teacher"]);
  return <AppShell>{ready ? <TeacherInner /> : <AuthLoading />}</AppShell>;
}

function TeacherInner() {
  const account = useCurrentAccount();
  const accounts = useAuth((s) => s.accounts);
  const schools = useAuth((s) => s.schools);
  const [assignSubject, setAssignSubject] = useState("maths");
  const [assignQuest, setAssignQuest] = useState(QUESTS[0].id);

  const school = account?.schoolId ? schools[account.schoolId] : undefined;

  const roster = useMemo(() => {
    const students = Object.values(accounts).filter((a) => a.role === "student" && a.schoolId === account?.schoolId);
    const list = students.length
      ? students.map((s) => {
          const h = hashStr(s.id);
          return { name: s.displayName, xp: 200 + (h % 1200), accuracy: 0.55 + (h % 40) / 100, streak: h % 14 };
        })
      : MOCK_STUDENTS;
    return [...list].sort((a, b) => b.xp - a.xp);
  }, [accounts, account?.schoolId]);

  const activeToday = roster.filter((s) => s.streak > 0).length;
  const avgLevel = Math.round(roster.reduce((n, s) => n + getLevelInfo(s.xp).level, 0) / Math.max(1, roster.length));

  const submitAssignment = () => {
    const subj = SUBJECTS.find((s) => s.id === assignSubject)?.name;
    const quest = QUESTS.find((q) => q.id === assignQuest)?.title;
    alert(`✅ Assigned “${quest}” (${subj}) to your class.\n\n(Demo — in production this writes to Supabase and notifies students.)`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">🍎 Kaiako dashboard</h1>
        <p className="font-bold text-ink/50">
          Kia ora {account?.displayName} · {school ? school.name : "Room 6"} · {roster.length} ākonga
        </p>
      </div>

      {/* Invite */}
      {school && (
        <Card className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex-1">
            <CardLabel>Invite students</CardLabel>
            <p className="text-sm font-semibold text-ink/60">Students enter this code when they sign up to join your school.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-display text-xl font-extrabold tracking-widest text-brand-700 shadow-pop-sm">
            {school.joinCode}
            <button onClick={() => navigator.clipboard?.writeText(school.joinCode)} aria-label="Copy code" className="text-ink/30 hover:text-ink">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-5 w-5" />} color="bg-brand-500" label="Students" value={`${roster.length}`} />
        <Kpi icon={<GraduationCap className="h-5 w-5" />} color="bg-xp" label="Avg level" value={`${avgLevel}`} />
        <Kpi icon={<Users className="h-5 w-5" />} color="bg-streak" label="Active today" value={`${activeToday}`} />
        <Kpi icon={<ClipboardList className="h-5 w-5" />} color="bg-gem" label="Assignments" value={`${MOCK_ASSIGNMENTS.length}`} />
      </div>

      <AiAssignmentGenerator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>🏆 Class leaderboard</CardTitle>
          <div className="mt-3 space-y-1.5">
            {roster.map((s, i) => (
              <div key={s.name + i} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2", i % 2 ? "bg-black/[0.02]" : "")}>
                <span className="w-6 text-center font-display font-extrabold text-ink/40">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <span className="flex-1 truncate font-bold">{s.name}</span>
                <span className="hidden text-xs font-bold text-ink/40 sm:inline">{Math.round(s.accuracy * 100)}%</span>
                <span className="text-xs font-bold text-streak">🔥{s.streak}</span>
                <span className="w-16 text-right font-display font-extrabold text-brand-600">{s.xp} XP</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Assignments</CardTitle>
            <div className="mt-3 space-y-3">
              {MOCK_ASSIGNMENTS.map((a) => (
                <div key={a.title}>
                  <div className="mb-1 flex items-center justify-between text-sm font-bold">
                    <span className="truncate">{a.title}</span>
                    <span className="shrink-0 text-ink/40">Due {a.due} · {Math.round(a.completion * 100)}%</span>
                  </div>
                  <ProgressBar value={a.completion} className="h-2" barClassName="bg-gem" />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-black/[0.03] p-3">
              <CardLabel>Create assignment</CardLabel>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={assignSubject} onChange={(e) => setAssignSubject(e.target.value)}
                  className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold" aria-label="Subject">
                  {SUBJECTS.filter((s) => !s.comingSoon).map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                <select value={assignQuest} onChange={(e) => setAssignQuest(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold" aria-label="Quest">
                  {QUESTS.map((q) => (<option key={q.id} value={q.id}>{q.title}</option>))}
                </select>
                <Button size="md" onClick={submitAssignment}><Plus className="h-4 w-4" /> Assign</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Class mastery by subject</CardTitle>
            <div className="mt-3 space-y-3">
              {CLASS_MASTERY.map((c) => {
                const subj = SUBJECTS.find((s) => s.id === c.id)!;
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-sm font-bold">
                      <span>{subj.icon} {subj.name}</span>
                      <span className="text-ink/50">{Math.round(c.value * 100)}%</span>
                    </div>
                    <ProgressBar value={c.value} className="h-2.5"
                      barClassName={c.value >= 0.8 ? "bg-xp" : c.value < 0.6 ? "bg-streak" : "bg-coin"} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AiAssignmentGenerator() {
  const subjects = SUBJECTS.filter((s) => !s.comingSoon);
  const [form, setForm] = useState({ subject: "Mathematics", year: 5, topic: "Fractions", minutes: 30 });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratedAssignment | null>(null);
  const [isAi, setIsAi] = useState(false);

  const gen = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/assignment", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const d = await res.json();
      setResult(d.assignment ?? null);
      setIsAi(!!d.ai);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-gem" /><CardTitle>AI assignment generator</CardTitle></div>
      <p className="mt-1 text-sm font-semibold text-ink/50">Describe it and let Tui draft a lesson, quiz &amp; homework.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold" aria-label="Subject">
          {subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
          className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold" aria-label="Year">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          placeholder="Topic, e.g. Fractions" className="min-w-0 flex-1 rounded-xl border-2 border-black/10 px-3 py-2 text-sm font-bold outline-none focus:border-brand-400" />
        <input type="number" min={10} max={90} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: Number(e.target.value) }))}
          className="w-20 rounded-xl border-2 border-black/10 px-3 py-2 text-sm font-bold" aria-label="Minutes" />
        <Button onClick={gen} disabled={busy}><Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate"}</Button>
      </div>
      {result && (
        <div className="mt-4 space-y-1.5 rounded-2xl bg-black/[0.03] p-4 text-sm font-semibold text-ink/70">
          <p className="font-display text-base font-extrabold text-ink">{result.title} {isAi && <span className="text-[10px] font-bold uppercase text-gem">· AI</span>}</p>
          <p><span className="text-ink/40">Objective:</span> {result.objective}</p>
          <p><span className="text-ink/40">Warm-up:</span> {result.warmup}</p>
          <p><span className="text-ink/40">Activity:</span> {result.activity}</p>
          <div><span className="text-ink/40">Quiz:</span><ul className="ml-5 list-disc">{result.quiz.map((q, i) => <li key={i}>{q.q}</li>)}</ul></div>
          <p><span className="text-ink/40">Homework:</span> {result.homework}</p>
        </div>
      )}
    </Card>
  );
}

function Kpi({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-xl text-white", color)}>{icon}</span>
        <CardLabel>{label}</CardLabel>
      </div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
    </Card>
  );
}
