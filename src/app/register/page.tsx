"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AuthShell, TextField, FormError } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth/store";
import { roleHome, useEnsureSeeded } from "@/lib/auth/guard";
import { cloudResendVerification } from "@/lib/supabase/cloud";
import type { AgeBand } from "@/types";
import { cn } from "@/lib/utils/cn";

type SignupRole = "student" | "parent" | "teacher";
const ROLE_TABS: { role: SignupRole; emoji: string; label: string }[] = [
  { role: "student", emoji: "🎒", label: "Student" },
  { role: "parent", emoji: "👪", label: "Parent" },
  { role: "teacher", emoji: "🍎", label: "Teacher" },
];
const AGE_BANDS: AgeBand[] = ["5-7", "8-10", "11-14"];

export default function RegisterPage() {
  useEnsureSeeded();
  const router = useRouter();
  const { registerStudent, registerParent, registerTeacher } = useAuth.getState();

  const [role, setRole] = useState<SignupRole>("student");
  const [form, setForm] = useState({
    displayName: "", email: "", password: "", ageBand: "8-10" as AgeBand, schoolCode: "", consent: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("role");
    if (r === "parent" || r === "teacher" || r === "student") setRole(r);
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if ((role === "student" || role === "parent") && !form.consent) {
      return setError(role === "student"
        ? "Please confirm you have a parent/guardian's permission."
        : "Please accept the privacy terms to continue.");
    }
    setBusy(true);
    let res;
    if (role === "student") {
      res = await registerStudent({ ...form });
    } else if (role === "parent") {
      res = await registerParent({ displayName: form.displayName, email: form.email, password: form.password, consent: form.consent });
    } else {
      res = await registerTeacher({ displayName: form.displayName, email: form.email, password: form.password, schoolCode: form.schoolCode || undefined });
    }
    setBusy(false);
    if (res.needsVerification) { setVerifySent(true); return; }
    if (!res.ok) return setError(res.error ?? "Could not create account.");
    router.replace(roleHome(role));
  };

  if (verifySent) {
    return (
      <AuthShell
        title="Check your email ✉️"
        subtitle={`We sent a verification link to ${form.email}`}
        footer={<Link href="/login" className="font-bold text-brand-600">Back to sign in</Link>}
      >
        <div className="space-y-3 text-center">
          <div className="text-5xl">📬</div>
          <p className="font-semibold text-ink/60">
            Click the link in that email to activate the account, then sign in. Can&apos;t find it? Check spam.
          </p>
          <Button variant="outline" className="w-full" onClick={() => cloudResendVerification(form.email)}>
            Resend email
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Pick what describes you best"
      wide
      footer={<>Already have an account? <Link href="/login" className="font-bold text-brand-600">Sign in</Link></>}
    >
      {/* Role chooser */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {ROLE_TABS.map((t) => (
          <button
            key={t.role}
            onClick={() => setRole(t.role)}
            className={cn(
              "rounded-2xl border-2 p-3 text-center transition-all",
              role === t.role ? "border-brand-500 bg-brand-50" : "border-black/10 hover:border-brand-300",
            )}
          >
            <div className="text-2xl">{t.emoji}</div>
            <div className="mt-1 text-sm font-bold">{t.label}</div>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <FormError>{error}</FormError>

        <TextField
          label={role === "parent" ? "Your name" : role === "teacher" ? "Your name" : "Your name / nickname"}
          value={form.displayName} onChange={(e) => set("displayName", e.target.value)}
          placeholder={role === "student" ? "e.g. Aroha" : "e.g. Sarah"} required
        />
        <TextField label="Email" type="email" autoComplete="email" value={form.email}
          onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required />
        <TextField label="Password" type="password" autoComplete="new-password" value={form.password}
          onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" required />

        {role === "student" && (
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink/70">Age group</span>
            <div className="flex overflow-hidden rounded-2xl border-2 border-black/10">
              {AGE_BANDS.map((b) => (
                <button type="button" key={b} onClick={() => set("ageBand", b)}
                  className={cn("flex-1 py-2.5 text-sm font-bold", form.ageBand === b ? "bg-brand-500 text-white" : "hover:bg-black/5")}>
                  {b}
                </button>
              ))}
            </div>
          </label>
        )}

        {(role === "student" || role === "teacher") && (
          <TextField
            label={`School code ${role === "student" ? "(optional)" : "(optional — join your school)"}`}
            value={form.schoolCode} onChange={(e) => set("schoolCode", e.target.value.toUpperCase())}
            placeholder="e.g. AOTEAROA"
          />
        )}

        {(role === "student" || role === "parent") && (
          <label className="flex items-start gap-2 rounded-2xl bg-black/[0.03] p-3 text-sm font-semibold text-ink/70">
            <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-5 w-5" />
            <span>
              {role === "student"
                ? "I have my parent or guardian's permission to use LearnQuest."
                : "I agree to the Privacy Policy and consent to managing my child's learning data."}
            </span>
          </label>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>

      {role === "teacher" && (
        <p className="mt-4 rounded-2xl bg-gem/10 p-3 text-center text-sm font-semibold text-gem">
          🏫 Rolling out to a whole school?{" "}
          <Link href="/for-schools" className="font-bold underline">Register your school</Link>
        </p>
      )}
    </AuthShell>
  );
}
