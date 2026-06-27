"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Users, Trophy, ClipboardList, Sparkles, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { TextField, FormError } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth/store";
import { useRouter } from "next/navigation";

const BENEFITS = [
  { icon: BarChart3, title: "Standards-based analytics", text: "See mastery by NZC strand across every class and year level." },
  { icon: ShieldCheck, title: "Safe & private", text: "Ad-free, child-safe, and built for NZ Privacy Act compliance." },
  { icon: ClipboardList, title: "Assign & track", text: "Set quests as homework and watch completion in real time." },
  { icon: Trophy, title: "School leaderboards", text: "Friendly class and school-wide competition that lifts engagement." },
  { icon: Users, title: "Whole-school rollout", text: "Bulk-provision students, invite teachers, manage seats centrally." },
  { icon: Sparkles, title: "AI that helps teachers", text: "Auto weekly reports and weakness detection for every ākonga." },
];

const STEPS = [
  { n: 1, title: "Register your school", text: "Start a free 30-day trial in under two minutes." },
  { n: 2, title: "Invite your kaiako", text: "Teachers join with your unique school code and build classes." },
  { n: 3, title: "Students get learning", text: "Ākonga join their class and start their quests." },
];

export default function ForSchoolsPage() {
  const router = useRouter();
  const registerSchool = useAuth((s) => s.registerSchool);
  const [form, setForm] = useState({ schoolName: "", region: "", adminName: "", email: "", password: "", seats: 30 });
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = registerSchool({ ...form, seats: Number(form.seats) || 30 });
    if (!res.ok) return setError(res.error ?? "Could not register school.");
    router.replace("/school");
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-pop-sm">🚀</span>
          <span className="bg-gradient-to-r from-brand-600 to-gem bg-clip-text text-transparent">LearnQuest</span>
          <span className="ml-1 rounded-full bg-gem/15 px-2 py-0.5 text-xs font-bold text-gem">for Schools</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/pricing" className={buttonVariants({ variant: "ghost", size: "sm" })}>Pricing</Link>
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Sign in</Link>
        </div>
      </header>

      {/* Hero + signup */}
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-gem shadow-pop-sm">
            🏫 Want to implement LearnQuest in your school?
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            The learning platform your{" "}
            <span className="bg-gradient-to-r from-brand-500 to-gem bg-clip-text text-transparent">whole school</span> will love
          </h1>
          <p className="mt-4 max-w-md text-lg font-semibold text-ink/70">
            Give every kaiako live, curriculum-aligned insight and every ākonga a learning adventure.
            Centralised admin, school leaderboards, and a free 30-day trial.
          </p>
          <ul className="mt-6 space-y-2">
            {["Free 30-day trial — no card required", "Set up in minutes with a school code", "NZ Curriculum aligned, Privacy-Act ready"].map((t) => (
              <li key={t} className="flex items-center gap-2 font-semibold text-ink/80">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-xp/15 text-xp"><Check className="h-4 w-4" /></span> {t}
              </li>
            ))}
          </ul>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold">Register your school</h2>
          <p className="mt-1 font-semibold text-ink/50">Start your free trial today.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <FormError>{error}</FormError>
            <TextField label="School name" value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} placeholder="e.g. Aotearoa Primary School" required />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Region" value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Wellington" />
              <TextField label="Approx. students" type="number" min={1} value={form.seats} onChange={(e) => set("seats", Number(e.target.value))} />
            </div>
            <TextField label="Your name (admin)" value={form.adminName} onChange={(e) => set("adminName", e.target.value)} placeholder="Principal / lead teacher" required />
            <TextField label="Work email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@school.nz" required />
            <TextField label="Password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" required />
            <Button type="submit" size="lg" className="w-full">Start free trial 🚀</Button>
            <p className="text-center text-xs font-semibold text-ink/40">
              Prefer a guided demo? <Link href="/login" className="font-bold text-brand-600">Explore the school admin demo</Link>
            </p>
          </form>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center font-display text-3xl font-extrabold">Everything your school needs</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <motion.div key={b.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="card p-6">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-600"><b.icon className="h-6 w-6" /></div>
              <h3 className="font-display text-lg font-bold">{b.title}</h3>
              <p className="mt-1 text-sm font-semibold text-ink/60">{b.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center font-display text-3xl font-extrabold">Up and running in 3 steps</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 font-display text-xl font-extrabold text-white">{s.n}</div>
              <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm font-semibold text-ink/60">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>See school pricing</Link>
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm font-semibold text-ink/40">
        LearnQuest for Schools · Aligned to the New Zealand Curriculum
      </footer>
    </div>
  );
}
