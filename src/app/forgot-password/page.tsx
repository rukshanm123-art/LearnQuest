"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthShell, TextField, FormError } from "@/components/auth/AuthShell";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cloudResetPassword } from "@/lib/supabase/cloud";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured) {
      setError("Password reset needs cloud accounts. Demo accounts use a shared password — see the sign-in page.");
      return;
    }
    setBusy(true);
    const res = await cloudResetPassword(email.trim());
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Could not send the reset email.");
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email 📬"
        subtitle="We've sent you a reset link"
        footer={<Link href="/login" className="font-bold text-brand-600">Back to sign in</Link>}
      >
        <div className="rounded-2xl bg-brand-50 p-4 text-center">
          <div className="text-4xl">✉️</div>
          <p className="mt-2 font-semibold text-ink/70">
            If an account exists for <span className="font-bold">{email}</span>, a password-reset link is on its way.
            Tap the link in the email to choose a new password.
          </p>
          <p className="mt-3 text-xs font-semibold text-ink/40">
            Can&apos;t see it? Check your spam folder, or wait a minute and try again.
          </p>
        </div>
        <Button onClick={() => { setSent(false); setEmail(""); }} variant="outline" size="lg" className="mt-4 w-full">
          Use a different email
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password? 🔑"
      subtitle="We'll email you a link to reset it"
      footer={
        <>
          Remembered it? <Link href="/login" className="font-bold text-brand-600">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <FormError>{error}</FormError>
        <TextField
          label="Email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
        />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
