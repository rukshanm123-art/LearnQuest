"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const PLANS = [
  {
    name: "Free", price: "$0", cadence: "forever", blurb: "For a single curious learner.",
    cta: { label: "Start playing", href: "/register?role=student" }, highlight: false,
    features: ["All six subject worlds", "XP, levels, streaks & pets", "Daily challenge", "1 learner profile"],
  },
  {
    name: "Family", price: "$9.99", cadence: "/ month", blurb: "For whānau with up to 4 tamariki.",
    cta: { label: "Start free trial", href: "/register?role=parent" }, highlight: true,
    features: ["Everything in Free", "Up to 4 child profiles", "Parent analytics dashboard", "AI weekly reports", "Adaptive learning paths"],
  },
  {
    name: "School", price: "from $5", cadence: "/ student / year", blurb: "For classrooms and whole schools.",
    cta: { label: "Register your school", href: "/for-schools" }, highlight: false,
    features: ["Everything in Family", "Teacher & admin dashboards", "Assignments & leaderboards", "Class & strand analytics", "Bulk provisioning & SSO", "Priority NZ-based support"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-pop-sm">🚀</span>
          <span className="bg-gradient-to-r from-brand-600 to-gem bg-clip-text text-transparent">LearnQuest</span>
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Sign in</Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 text-center">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">Simple, friendly pricing</h1>
        <p className="mt-3 font-semibold text-ink/60">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={cn(
                "card flex flex-col p-6 text-left",
                p.highlight && "relative ring-4 ring-brand-300 md:-translate-y-3",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-pop-sm">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-xl font-extrabold">{p.name}</h2>
              <p className="text-sm font-semibold text-ink/50">{p.blurb}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold">{p.price}</span>
                <span className="mb-1 text-sm font-bold text-ink/40">{p.cadence}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm font-semibold text-ink/70">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-xp/15 text-xp">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.cta.href}
                className={buttonVariants({ variant: p.highlight ? "brand" : "outline", size: "lg", className: "mt-6 w-full" })}
              >
                {p.cta.label}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 font-semibold text-ink/50">
          Running a kura or district?{" "}
          <Link href="/for-schools" className="font-bold text-brand-600">Talk to us about district pricing →</Link>
        </p>
      </section>
    </div>
  );
}
