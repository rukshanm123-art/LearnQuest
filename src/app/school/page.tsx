"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, GraduationCap, Armchair, Copy, Mail, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/lib/auth/store";
import { useRequireRole, AuthLoading, useCurrentAccount } from "@/lib/auth/guard";
import type { SchoolPlan } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";

const PLANS: SchoolPlan[] = ["trial", "school", "district"];
function hashStr(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

export default function SchoolPage() {
  const { ready } = useRequireRole(["school_admin"]);
  return <AppShell>{ready ? <SchoolInner /> : <AuthLoading />}</AppShell>;
}

function SchoolInner() {
  const account = useCurrentAccount()!;
  const accounts = useAuth((s) => s.accounts);
  const schools = useAuth((s) => s.schools);
  const invitations = useAuth((s) => s.invitations);
  const invite = useAuth((s) => s.invite);
  const setSchoolPlan = useAuth((s) => s.setSchoolPlan);

  const school = account.schoolId ? schools[account.schoolId] : undefined;
  const [inviteEmail, setInviteEmail] = useState("");
  const [plan, setPlan] = useState<SchoolPlan>(school?.plan ?? "trial");
  const [seats, setSeats] = useState(school?.seats ?? 30);

  const members = useMemo(
    () => Object.values(accounts).filter((a) => a.schoolId === account.schoolId),
    [accounts, account.schoolId],
  );
  const teachers = members.filter((m) => m.role === "teacher");
  const students = members.filter((m) => m.role === "student");
  const seatsUsed = teachers.length + students.length;
  const schoolInvites = invitations.filter((i) => i.schoolId === account.schoolId && i.status === "pending");

  const leaderboard = useMemo(
    () => students.map((s) => ({ name: s.displayName, xp: 200 + (hashStr(s.id) % 1200) }))
      .sort((a, b) => b.xp - a.xp).slice(0, 6),
    [students],
  );

  if (!school) {
    return <Card className="text-center"><p className="font-bold text-ink/50">No school linked to this account.</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">🏫 {school.name}</h1>
          <p className="font-bold text-ink/50">
            {school.region} · <span className="capitalize">{school.plan}</span> plan ·{" "}
            <span className={cn("font-bold", school.status === "trial" ? "text-coin" : "text-xp")}>{school.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-display text-xl font-extrabold tracking-widest text-brand-700 shadow-pop-sm">
          {school.joinCode}
          <button onClick={() => navigator.clipboard?.writeText(school.joinCode)} aria-label="Copy join code" className="text-ink/30 hover:text-ink">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-5 w-5" />} color="bg-brand-500" label="Students" value={`${students.length}`} />
        <Kpi icon={<GraduationCap className="h-5 w-5" />} color="bg-gem" label="Teachers" value={`${teachers.length}`} />
        <Kpi icon={<Armchair className="h-5 w-5" />} color="bg-xp" label="Seats used" value={`${seatsUsed}/${school.seats}`} />
        <Kpi icon={<Mail className="h-5 w-5" />} color="bg-coin" label="Pending invites" value={`${schoolInvites.length}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Staff + invite */}
        <Card>
          <CardTitle>Staff</CardTitle>
          <div className="mt-3 space-y-1.5">
            {teachers.length === 0 && <p className="font-semibold text-ink/40">No teachers yet — invite some below.</p>}
            {teachers.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-black/[0.02] px-3 py-2">
                <span className="text-xl">🍎</span>
                <span className="flex-1 truncate font-bold">{t.displayName}</span>
                <span className="truncate text-xs font-semibold text-ink/40">{t.email}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", t.status === "active" ? "bg-xp/15 text-xp" : "bg-coin/20 text-yellow-700")}>{t.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-brand-50 p-3">
            <CardLabel>Invite a teacher</CardLabel>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="teacher@school.nz"
                className="min-w-0 flex-1 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-brand-400" />
              <Button onClick={() => { if (inviteEmail.includes("@")) { invite(inviteEmail, "teacher", school.id); setInviteEmail(""); } }}>
                <Mail className="h-4 w-4" /> Invite
              </Button>
            </div>
            {schoolInvites.length > 0 && (
              <div className="mt-3 space-y-1">
                {schoolInvites.map((i) => (
                  <p key={i.id} className="flex items-center justify-between text-xs font-semibold text-ink/50">
                    <span className="truncate">{i.email}</span>
                    <span>code: <b className="text-brand-700">{i.code}</b></span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Plan / billing */}
          <Card>
            <CardTitle>Plan &amp; seats</CardTitle>
            {school.status === "trial" && school.trialEndsAt && (
              <p className="mt-1 rounded-xl bg-coin/15 px-3 py-2 text-sm font-bold text-yellow-700">
                Free trial ends {new Date(school.trialEndsAt).toLocaleDateString("en-NZ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={plan} onChange={(e) => setPlan(e.target.value as SchoolPlan)}
                className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold capitalize" aria-label="Plan">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))}
                className="w-24 rounded-xl border-2 border-black/10 px-3 py-2 text-sm font-bold" aria-label="Seats" />
              <Button onClick={() => setSchoolPlan(school.id, plan, seats)}>Save</Button>
              <Link href="/pricing" className={buttonVariants({ variant: "ghost", size: "sm" })}>Compare plans</Link>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-bold text-ink/50">
                <span>Seats used</span><span>{seatsUsed}/{school.seats}</span>
              </div>
              <ProgressBar value={school.seats ? seatsUsed / school.seats : 0} className="h-2.5" />
            </div>
          </Card>

          {/* Leaderboard */}
          <Card>
            <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-coin" /><CardTitle>Top students</CardTitle></div>
            <div className="mt-3 space-y-1.5">
              {leaderboard.length === 0 && <p className="font-semibold text-ink/40">No students enrolled yet.</p>}
              {leaderboard.map((s, i) => (
                <div key={s.name + i} className="flex items-center gap-3 rounded-2xl px-3 py-1.5">
                  <span className="w-6 text-center font-display font-extrabold text-ink/40">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                  <span className="flex-1 truncate font-bold">{s.name}</span>
                  <span className="font-display font-extrabold text-brand-600">{s.xp} XP</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
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
