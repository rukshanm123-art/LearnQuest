"use client";

import { useMemo, useState } from "react";
import { Building2, Users, GraduationCap, Activity, Trash2, Megaphone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/lib/auth/store";
import { useRequireRole, AuthLoading, useCurrentAccount, ROLE_META } from "@/lib/auth/guard";
import { ROLES } from "@/lib/auth/types";
import type { Announcement, Role, SchoolPlan } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";

const TABS = ["Overview", "Schools", "Users", "Audit"] as const;
type Tab = (typeof TABS)[number];
const PLANS: SchoolPlan[] = ["trial", "school", "district"];
const ROLE_FILTERS: ("all" | Role)[] = ["all", "student", "parent", "teacher", "school_admin", "admin"];

export default function AdminPage() {
  const { ready } = useRequireRole(["admin"]);
  return <AppShell>{ready ? <AdminInner /> : <AuthLoading />}</AppShell>;
}

function AdminInner() {
  const [tab, setTab] = useState<Tab>("Overview");
  const accounts = useAuth((s) => s.accounts);
  const schools = useAuth((s) => s.schools);

  const list = Object.values(accounts);
  const stats = {
    users: list.length,
    students: list.filter((a) => a.role === "student").length,
    teachers: list.filter((a) => a.role === "teacher").length,
    schools: Object.keys(schools).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">🛡️ Platform admin</h1>
        <p className="font-bold text-ink/50">Manage schools, users and platform-wide settings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-5 w-5" />} color="bg-brand-500" label="Total users" value={`${stats.users}`} />
        <Kpi icon={<GraduationCap className="h-5 w-5" />} color="bg-xp" label="Students" value={`${stats.students}`} />
        <Kpi icon={<Users className="h-5 w-5" />} color="bg-gem" label="Teachers" value={`${stats.teachers}`} />
        <Kpi icon={<Building2 className="h-5 w-5" />} color="bg-coin" label="Schools" value={`${stats.schools}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-2xl px-5 py-2.5 font-display font-bold transition-colors",
              tab === t ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab />}
      {tab === "Schools" && <SchoolsTab />}
      {tab === "Users" && <UsersTab />}
      {tab === "Audit" && <AuditTab />}
    </div>
  );
}

function OverviewTab() {
  const accounts = useAuth((s) => s.accounts);
  const announcements = useAuth((s) => s.announcements);
  const post = useAuth((s) => s.postAnnouncement);
  const audit = useAuth((s) => s.audit);
  const [a, setA] = useState({ title: "", body: "", audience: "all" as Announcement["audience"] });

  const list = Object.values(accounts);
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    return { iso, label: d.getDate(), count: list.filter((x) => (x.createdAt ?? "").slice(0, 10) === iso).length };
  });
  const maxC = Math.max(1, ...days.map((d) => d.count));
  const roleCounts = ROLES.map((r) => ({ role: r, n: list.filter((x) => x.role === r).length }));
  const maxR = Math.max(1, ...roleCounts.map((r) => r.n));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>New sign-ups (14 days)</CardTitle>
          <div className="mt-4 flex items-end justify-between gap-1" style={{ height: 130 }}>
            {days.map((d) => (
              <div key={d.iso} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-brand-400 to-brand-300"
                    style={{ height: `${(d.count / maxC) * 100}%`, minHeight: d.count ? 5 : 2 }} title={`${d.count} sign-ups`} />
                </div>
                <span className="text-[9px] font-bold text-ink/30">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Users by role</CardTitle>
          <div className="mt-4 space-y-2.5">
            {roleCounts.map((rc) => (
              <div key={rc.role}>
                <div className="mb-0.5 flex items-center justify-between text-xs font-bold">
                  <span>{ROLE_META[rc.role].emoji} {ROLE_META[rc.role].label}</span>
                  <span className="text-ink/40">{rc.n}</span>
                </div>
                <ProgressBar value={rc.n / maxR} className="h-2" barClassName="bg-gem" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-gem" /><CardTitle>Post announcement</CardTitle></div>
        <div className="mt-3 space-y-2">
          <input value={a.title} onChange={(e) => setA((x) => ({ ...x, title: e.target.value }))} placeholder="Title"
            className="w-full rounded-2xl border-2 border-black/10 px-4 py-2.5 font-bold outline-none focus:border-brand-400" />
          <textarea value={a.body} onChange={(e) => setA((x) => ({ ...x, body: e.target.value }))} placeholder="Message…" rows={3}
            className="w-full rounded-2xl border-2 border-black/10 px-4 py-2.5 font-semibold outline-none focus:border-brand-400" />
          <div className="flex items-center gap-2">
            <select value={a.audience} onChange={(e) => setA((x) => ({ ...x, audience: e.target.value as Announcement["audience"] }))}
              className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold" aria-label="Audience">
              <option value="all">Everyone</option>
              <option value="teachers">Teachers</option>
              <option value="parents">Parents</option>
              <option value="students">Students</option>
              <option value="school_admins">School admins</option>
            </select>
            <Button onClick={() => { if (a.title.trim()) { post(a); setA({ title: "", body: "", audience: "all" }); } }}>Publish</Button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {announcements.slice(0, 4).map((an) => (
            <div key={an.id} className="rounded-2xl bg-black/[0.03] p-3">
              <p className="text-sm font-bold">{an.title} <span className="text-xs font-semibold text-ink/40">· {an.audience}</span></p>
              <p className="text-sm font-semibold text-ink/60">{an.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-brand-600" /><CardTitle>Recent activity</CardTitle></div>
        <div className="mt-3 space-y-1.5">
          {audit.slice(0, 10).map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-ink/70">{e.action}</span>
              {e.detail && <span className="truncate text-ink/50">{e.detail}</span>}
              <span className="ml-auto shrink-0 text-xs font-semibold text-ink/30">{new Date(e.at).toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </Card>
      </div>
    </div>
  );
}

function SchoolsTab() {
  const schools = useAuth((s) => s.schools);
  const accounts = useAuth((s) => s.accounts);
  const setSchoolPlan = useAuth((s) => s.setSchoolPlan);
  const removeSchool = useAuth((s) => s.removeSchool);
  const all = Object.values(schools);

  return (
    <Card className="overflow-x-auto">
      <CardTitle>Schools ({all.length})</CardTitle>
      {all.length === 0 ? (
        <p className="mt-3 font-semibold text-ink/40">No schools registered yet.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-ink/40">
              <th className="py-2">School</th><th>Members</th><th>Plan</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {all.map((s) => {
              const members = Object.values(accounts).filter((a) => a.schoolId === s.id).length;
              return (
                <tr key={s.id} className="border-t border-black/5">
                  <td className="py-2 pr-2"><div className="font-bold">{s.name}</div><div className="text-xs text-ink/40">{s.region} · {s.joinCode}</div></td>
                  <td className="text-ink/60">{members}/{s.seats}</td>
                  <td>
                    <select value={s.plan} onChange={(e) => setSchoolPlan(s.id, e.target.value as SchoolPlan)}
                      className="rounded-lg border-2 border-black/10 bg-white px-2 py-1 text-xs font-bold capitalize" aria-label={`Plan for ${s.name}`}>
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", s.status === "active" ? "bg-xp/15 text-xp" : "bg-coin/20 text-yellow-700")}>{s.status}</span></td>
                  <td className="text-right">
                    <button onClick={() => { if (confirm(`Remove ${s.name}? This cannot be undone.`)) removeSchool(s.id); }}
                      className="rounded-lg p-1.5 text-streak hover:bg-streak/10" aria-label={`Remove ${s.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function UsersTab() {
  const accounts = useAuth((s) => s.accounts);
  const me = useCurrentAccount();
  const suspend = useAuth((s) => s.suspendAccount);
  const reactivate = useAuth((s) => s.reactivateAccount);
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return Object.values(accounts)
      .filter((a) => (filter === "all" ? true : a.role === filter))
      .filter((a) => (q ? (a.displayName + a.email).toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => a.role.localeCompare(b.role));
  }, [accounts, filter, q]);

  return (
    <Card className="overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Users ({rows.length})</CardTitle>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="rounded-xl border-2 border-black/10 px-3 py-1.5 text-sm font-bold outline-none focus:border-brand-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | Role)}
            className="rounded-xl border-2 border-black/10 bg-white px-3 py-1.5 text-sm font-bold capitalize" aria-label="Filter role">
            {ROLE_FILTERS.map((r) => <option key={r} value={r}>{r === "all" ? "All roles" : ROLE_META[r as Role].label}</option>)}
          </select>
        </div>
      </div>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold uppercase tracking-wide text-ink/40">
            <th className="py-2">Name</th><th>Role</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-black/5">
              <td className="py-2 pr-2"><div className="font-bold">{a.displayName}</div><div className="text-xs text-ink/40">{a.email}</div></td>
              <td className="text-ink/60">{ROLE_META[a.role].emoji} {ROLE_META[a.role].label}</td>
              <td><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", a.status === "active" ? "bg-xp/15 text-xp" : "bg-streak/15 text-streak")}>{a.status}</span></td>
              <td className="text-right">
                {a.id === me?.id ? (
                  <span className="text-xs font-semibold text-ink/30">You</span>
                ) : a.status === "suspended" ? (
                  <Button size="sm" variant="outline" onClick={() => reactivate(a.id)}>Reactivate</Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => suspend(a.id)}>Suspend</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function AuditTab() {
  const audit = useAuth((s) => s.audit);
  return (
    <Card>
      <CardTitle>Audit log</CardTitle>
      <div className="mt-3 space-y-1">
        {audit.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-2 border-b border-black/5 py-1.5 text-sm">
            <span className="font-mono text-xs text-ink/40">{new Date(e.at).toLocaleString("en-NZ")}</span>
            <span className="font-bold text-ink/70">{e.action}</span>
            {e.actorName && <span className="text-ink/50">by {e.actorName}</span>}
            {e.detail && <span className="truncate text-ink/40">— {e.detail}</span>}
          </div>
        ))}
      </div>
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
