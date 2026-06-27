"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Brain, Trophy, Map, ShieldCheck, HeartHandshake } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { SUBJECTS } from "@/lib/curriculum/nz-curriculum";
import { PETS } from "@/data/pets";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, type: "spring", stiffness: 90 } }),
};

const FEATURES = [
  { icon: Trophy, color: "bg-coin", title: "Play to learn", text: "Earn XP, level up, keep streaks alive and collect pets — just like your favourite games." },
  { icon: Brain, color: "bg-gem", title: "AI tutor, Tui", text: "A friendly AI explains every answer in kid-speak and adapts the difficulty to each learner." },
  { icon: Map, color: "bg-xp", title: "NZ Curriculum", text: "Every quest maps to the New Zealand Curriculum — Levels 1–5, all key learning areas." },
  { icon: HeartHandshake, color: "bg-streak", title: "Whānau & kaiako", text: "Parent and teacher dashboards with real analytics, weekly reports and classroom tools." },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-pop-sm">🚀</span>
          <span className="bg-gradient-to-r from-brand-600 to-gem bg-clip-text text-transparent">LearnQuest</span>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/for-schools" className={buttonVariants({ variant: "ghost", size: "sm" })}>For schools</Link>
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log in</Link>
          <Link href="/register" className={buttonVariants({ variant: "brand", size: "md" })}>
            Play free <Sparkles className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
        <div>
          <motion.span
            variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand-700 shadow-pop-sm"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-xp" /> Made for Kiwi kids aged 5–14
          </motion.span>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="mt-4 font-display text-5xl font-extrabold leading-[1.05] text-ink md:text-6xl"
          >
            Learning that feels like{" "}
            <span className="bg-gradient-to-r from-brand-500 via-gem to-streak bg-clip-text text-transparent">
              your favourite game
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-4 max-w-md text-lg font-semibold text-ink/70"
          >
            Go on quests, beat bosses, collect pets and master English, Maths, Science and more —
            all aligned to the New Zealand Curriculum.
          </motion.p>
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link href="/register" className={buttonVariants({ variant: "brand", size: "xl" })}>
              Start your quest 🚀
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "xl" })}>
              I have an account
            </Link>
          </motion.div>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink/50">
            <ShieldCheck className="h-4 w-4 text-xp" /> No account needed to try · Safe & ad-free
          </p>
        </div>

        {/* Floating hero art — symmetric, animated */}
        <div className="relative mx-auto h-80 w-80 md:h-[24rem] md:w-[24rem]">
          {/* rotating glow ring */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-brand-300/40 via-gem/30 to-streak/30 blur-2xl md:h-72 md:w-72"
            animate={{ rotate: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          />
          {/* center mascot */}
          <motion.div
            className="absolute left-1/2 top-1/2 grid h-48 w-48 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[3rem] bg-gradient-to-br from-brand-400 to-gem text-8xl shadow-glow md:h-56 md:w-56 md:text-9xl"
            animate={{ y: [0, -12, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ rotate: [0, -6, 6, 0] }}
          >
            🦊
          </motion.div>
          {/* evenly-placed floating badges: 4 corners + top/bottom centre */}
          {[
            { e: "⭐", cls: "left-0 top-8 bg-coin text-ink" },
            { e: "🪙", cls: "right-0 top-8 bg-white" },
            { e: "🏆", cls: "left-0 bottom-8 bg-white" },
            { e: "🔥", cls: "right-0 bottom-8 bg-streak/15" },
            { e: "🎮", cls: "left-1/2 -translate-x-1/2 top-0 bg-white" },
            { e: PETS[0].emoji, cls: "left-1/2 -translate-x-1/2 bottom-0 bg-white" },
          ].map((f, i) => (
            <motion.div
              key={i}
              className={`absolute grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow-card md:h-16 md:w-16 md:text-3xl ${f.cls}`}
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 3 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            >
              {f.e}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center font-display text-3xl font-extrabold md:text-4xl">
          Why kids (and grown-ups) love it
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
              className="card p-6"
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl text-white ${f.color}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm font-semibold text-ink/60">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center font-display text-3xl font-extrabold md:text-4xl">Six worlds to explore</h2>
        <p className="mt-2 text-center font-semibold text-ink/60">Each subject is its own adventure world.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s, i) => (
            <motion.div
              key={s.id}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
            >
              <Link
                href="/learn"
                className="group flex items-center gap-4 rounded-4xl p-5 text-white shadow-card transition-transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}
              >
                <span className="text-4xl transition-transform group-hover:scale-110">{s.icon}</span>
                <span>
                  <span className="block font-display text-lg font-bold">
                    {s.name} {s.comingSoon && <em className="text-xs font-bold not-italic opacity-80">· soon</em>}
                  </span>
                  <span className="block text-sm font-semibold text-white/85">{s.blurb}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="card relative overflow-hidden bg-gradient-to-br from-brand-500 to-gem p-10 text-center text-white">
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">Ready to begin your quest?</h2>
          <p className="mx-auto mt-2 max-w-md font-semibold text-white/90">
            Jump in free — pick your age group and start earning XP in under a minute.
          </p>
          <Link href="/register" className={buttonVariants({ variant: "coin", size: "xl", className: "mt-6" })}>
            Let&apos;s go! 🎉
          </Link>
        </div>
      </section>

      {/* For schools band */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card flex flex-col items-center gap-6 p-8 md:flex-row md:p-10">
          <div className="text-6xl">🏫</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-2xl font-extrabold md:text-3xl">Want to implement LearnQuest in your school?</h2>
            <p className="mt-2 font-semibold text-ink/60">
              Teacher &amp; admin dashboards, class leaderboards, standards-based analytics and central management —
              with a free 30-day trial for your whole school.
            </p>
          </div>
          <Link href="/for-schools" className={buttonVariants({ variant: "brand", size: "lg" })}>
            Explore for schools →
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm font-semibold text-ink/40">
        LearnQuest · Built for Aotearoa New Zealand · Aligned to the New Zealand Curriculum
      </footer>
    </div>
  );
}
