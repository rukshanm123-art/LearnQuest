"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Star, Clock, TrendingUp, FileText, Sparkles, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { getLevelInfo } from "@/lib/gamification/engine";
import { readingMetrics } from "@/lib/gamification/readingAge";
import type { PlayerState } from "@/types";
import { SUBJECTS } from "@/lib/curriculum/nz-curriculum";
import { useRequireRole, AuthLoading, useCurrentAccount } from "@/lib/auth/guard";
import { useAuth } from "@/lib/auth/store";
import { cn } from "@/lib/utils/cn";

export default function ParentPage() {
  const { ready } = useRequireRole(["parent"]);
  return <AppShell>{ready ? <ParentInner /> : <AuthLoading />}</AppShell>;
}

function ParentInner() {
  const hydrated = useHydrated();
  const store = useGameStore();
  const account = useCurrentAccount();
  const accounts = useAuth((s) => s.accounts);
  const firstChildId = account?.childIds?.[0];
  const childName = (firstChildId && accounts[firstChildId]?.displayName) || store.displayName;
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  // Snapshot a reading-age baseline once, so we can show improvement over time.
  useEffect(() => {
    if (!hydrated) return;
    const m = readingMetrics(useGameStore.getState() as unknown as PlayerState);
    useGameStore.getState().ensureReadingBaseline(m.readingAge);
  }, [hydrated]);

  if (!hydrated) {
    return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Loading analytics…</div>;
  }

  const lvl = getLevelInfo(store.totalXp);
  const totalAttempts = Object.values(store.mastery).reduce((n, m) => n + m.attempts, 0);
  const estMinutes = Math.round(totalAttempts * 0.6);

  // Reading-age metrics (what parents actually want to know).
  const metrics = readingMetrics(store as unknown as PlayerState);
  const baseline = store.readingBaseline;
  const improvement = baseline ? Math.round((metrics.readingAge - baseline.age) * 12) : 0;

  // Last 7 days of activity.
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return { iso, label: d.toLocaleDateString("en-NZ", { weekday: "short" }), xp: store.dailyXp[iso] ?? 0 };
  });
  const maxXp = Math.max(20, ...days.map((d) => d.xp));
  const weekXp = days.reduce((n, d) => n + d.xp, 0);

  const subjectPerf = SUBJECTS.filter((s) => (store.mastery[s.id]?.attempts ?? 0) > 0).map((s) => ({
    subject: s,
    m: store.mastery[s.id],
  }));
  const strengths = subjectPerf.filter((p) => p.m.accuracy >= 0.8);
  const focus = subjectPerf.filter((p) => p.m.accuracy < 0.6);

  const genReport = async () => {
    setLoadingReport(true);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName, ageBand: store.ageBand, level: lvl.level, streak: store.streakDays, weekXp,
          subjects: subjectPerf.map((p) => ({ name: p.subject.name, accuracy: p.m.accuracy, attempts: p.m.attempts })),
          weakAreas: focus.map((f) => f.subject.name),
        }),
      });
      const d = await res.json();
      setAiReport(d.report || "");
    } catch {
      /* keep deterministic report */
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">👪 Whānau dashboard</h1>
        <p className="font-bold text-ink/50">A clear window into {childName}&apos;s learning journey.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Star className="h-5 w-5" />} color="bg-brand-500" label="Level" value={`${lvl.level}`} sub={lvl.title} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} color="bg-xp" label="XP this week" value={`${weekXp}`} sub={`${store.totalXp} all-time`} />
        <Kpi icon={<Flame className="h-5 w-5" />} color="bg-streak" label="Streak" value={`${store.streakDays} days`} sub={store.streakDays >= 3 ? "Bonus active" : "Building habit"} />
        <Kpi icon={<Clock className="h-5 w-5" />} color="bg-gem" label="Est. time" value={`${estMinutes} min`} sub={`${totalAttempts} questions`} />
      </div>

      {/* Reading age — the headline metric for parents */}
      <Card className="overflow-hidden bg-gradient-to-br from-brand-600 to-gem p-0 text-white">
        <div className="grid gap-px sm:grid-cols-[1.2fr_1fr] bg-white/15">
          <div className="bg-gradient-to-br from-brand-600 to-gem p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <CardLabel className="text-white/80">Estimated reading age</CardLabel>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-5xl font-extrabold leading-none">{metrics.readingAge.toFixed(1)}</span>
              <span className="pb-1 font-bold text-white/80">years</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white/90">
              Actual age {metrics.actualAge.toFixed(1)} ·{" "}
              <span className="font-extrabold">
                {metrics.monthsVsAge === 0
                  ? "right on age level"
                  : `${Math.abs(metrics.monthsVsAge)} months ${metrics.monthsVsAge > 0 ? "above" : "below"} age level`}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/15 sm:grid-cols-1">
            <Metric label="Improvement" value={improvement >= 0 ? `+${improvement} mo` : `${improvement} mo`} sub={baseline ? `since ${new Date(baseline.since).toLocaleDateString("en-NZ", { month: "short" })}` : "tracking started"} />
            <Metric label="Reading level" value={metrics.readingAge >= metrics.actualAge ? "On track ✓" : "Building"} sub={`NZ curriculum`} />
          </div>
        </div>
        <div className="grid gap-4 bg-white p-5 text-ink sm:grid-cols-3">
          <ScoreBar label="Fluency" value={metrics.fluency} />
          <ScoreBar label="Comprehension" value={metrics.comprehension} />
          <ScoreBar label="Vocabulary" value={metrics.vocabulary} />
        </div>
        <p className="bg-white px-5 pb-4 text-xs font-semibold text-ink/40">
          An estimate from accuracy, lessons mastered and stories read — not a formal assessment.
        </p>
      </Card>

      {/* Weekly activity chart */}
      <Card>
        <CardTitle>This week&apos;s activity</CardTitle>
        <div className="mt-5 flex items-end justify-between gap-2" style={{ height: 160 }}>
          {days.map((d) => (
            <div key={d.iso} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <motion.div
                  className="w-full rounded-t-xl bg-gradient-to-t from-brand-400 to-brand-300"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.xp / maxXp) * 100}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 18 }}
                  title={`${d.xp} XP`}
                  style={{ minHeight: d.xp > 0 ? 6 : 2 }}
                />
              </div>
              <span className="text-xs font-bold text-ink/40">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Subject performance */}
      <Card>
        <CardTitle>Subject performance</CardTitle>
        {subjectPerf.length === 0 ? (
          <p className="mt-3 font-semibold text-ink/40">No activity yet — encourage a first quest!</p>
        ) : (
          <div className="mt-4 space-y-4">
            {subjectPerf.map(({ subject, m }) => (
              <div key={subject.id}>
                <div className="mb-1 flex items-center justify-between text-sm font-bold">
                  <span>{subject.icon} {subject.name}</span>
                  <span className="text-ink/50">{Math.round(m.accuracy * 100)}% · {m.attempts} qs</span>
                </div>
                <ProgressBar
                  value={m.accuracy}
                  barClassName={m.accuracy >= 0.8 ? "bg-xp" : m.accuracy < 0.6 ? "bg-streak" : "bg-coin"}
                  className="h-2.5"
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weekly report */}
      <Card className="bg-gradient-to-br from-brand-50 to-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <CardTitle>Weekly report</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={genReport} disabled={loadingReport}>
            <Sparkles className="h-4 w-4" /> {loadingReport ? "Generating…" : "Generate AI report"}
          </Button>
        </div>
        {aiReport && (
          <p className="mt-3 rounded-2xl bg-gem/10 p-3 text-sm font-semibold leading-relaxed text-ink/80">
            <span className="font-bold text-gem">✨ AI summary · </span>{aiReport}
          </p>
        )}
        <div className="mt-3 space-y-2 text-sm font-semibold text-ink/70">
          <p>
            📈 {childName} earned <b>{weekXp} XP</b> this week and is now Level {lvl.level} ({lvl.title}),
            with a <b>{store.streakDays}-day</b> streak.
          </p>
          {strengths.length > 0 && (
            <p>💪 Strengths: {strengths.map((s) => s.subject.name).join(", ")} — consistently above 80% accuracy.</p>
          )}
          {focus.length > 0 ? (
            <p>🎯 Suggested focus: {focus.map((s) => s.subject.name).join(", ")}. Short, daily practice works best.</p>
          ) : (
            <p>🎯 Suggested focus: keep the streak alive with a daily challenge each day.</p>
          )}
          <p className="text-ink/40">
            In production this summary is generated by the AI tutor from the full attempt history and emailed every Sunday.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gradient-to-br from-brand-600 to-gem p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-white/70">{label}</p>
      <div className="font-display text-2xl font-extrabold">{value}</div>
      <p className="text-xs font-semibold text-white/70">{sub}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-xp" : value >= 50 ? "bg-coin" : "bg-streak";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="text-ink/50">{value}</span>
      </div>
      <ProgressBar value={value / 100} barClassName={color} className="h-2.5" />
    </div>
  );
}

function Kpi({
  icon, color, label, value, sub,
}: { icon: React.ReactNode; color: string; label: string; value: string; sub: string }) {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-xl text-white", color)}>{icon}</span>
        <CardLabel>{label}</CardLabel>
      </div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
      <p className="text-xs font-bold text-ink/40">{sub}</p>
    </Card>
  );
}
