"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AuthShell, TextField, FormError } from "@/components/auth/AuthShell";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cloudUpdatePassword, cloudHasSession } from "@/lib/supabase/cloud";

type Phase = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(isSupabaseConfigured ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // The email link drops us here with a recovery session in the URL hash.
  // supabase-js processes it asynchronously, so poll briefly for the session.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    let tries = 0;
    const tick = async () => {
      if (cancelled) return;
      if (await cloudHasSession()) { setPhase("ready"); return; }
      if (++tries >= 12) { setPhase("invalid"); return; }
      setTimeout(tick, 300);
    };
    tick();
    return () => { cancelled = true; };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Those passwords don't match.");
    setBusy(true);
    const res = await cloudUpdatePassword(password);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Could not update your password.");
    setPhase("done");
    setTimeout(() => router.replace("/login"), 2200);
  };

  if (phase === "checking") {
    return (
      <AuthShell title="Checking your link…" subtitle="One moment">
        <div className="grid place-items-center py-6 text-4xl">⏳</div>
      </AuthShell>
    );
  }

  if (phase === "invalid") {
    return (
      <AuthShell
        title="This link won't work 😕"
        subtitle={isSupabaseConfigured ? "It may have expired or already been used" : "Password reset needs cloud accounts"}
        footer={<Link href="/login" className="font-bold text-brand-600">Back to sign in</Link>}
      >
        <Link href="/forgot-password" className="block">
          <Button size="lg" className="w-full">Request a new link</Button>
        </Link>
      </AuthShell>
    );
  }

  if (phase === "done") {
    return (
      <AuthShell title="Password updated! 🎉" subtitle="Taking you to sign in…">
        <div className="rounded-2xl bg-xp/10 p-4 text-center">
          <div className="text-4xl">✅</div>
          <p className="mt-2 font-semibold text-ink/70">You can now sign in with your new password.</p>
        </div>
        <Link href="/login" className="mt-4 block">
          <Button size="lg" className="w-full">Go to sign in</Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password 🔐" subtitle="Make it something you'll remember">
      <form onSubmit={onSubmit} className="space-y-3">
        <FormError>{error}</FormError>
        <TextField
          label="New password" type="password" autoComplete="new-password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required
        />
        <TextField
          label="Confirm password" type="password" autoComplete="new-password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" required
        />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
