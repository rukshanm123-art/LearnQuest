"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AuthShell, TextField, FormError } from "@/components/auth/AuthShell";
import { useAuth, DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth/store";
import { useCurrentAccount, useAuthHydrated, useEnsureSeeded, roleHome, ROLE_META } from "@/lib/auth/guard";

export default function LoginPage() {
  useEnsureSeeded();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const account = useCurrentAccount();
  const login = useAuth((s) => s.login);
  const loginAs = useAuth((s) => s.loginAs);
  const loginAsGuest = useAuth((s) => s.loginAsGuest);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (role: Parameters<typeof roleHome>[0]) => {
    const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
    router.replace(next || roleHome(role));
  };

  // Already signed in → bounce to the right home.
  useEffect(() => {
    if (hydrated && account) go(account.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, account?.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Sign in failed.");
    const role = useAuth.getState().accounts[res.accountId!].role;
    go(role);
  };

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle="Sign in to keep your quest going"
      footer={
        <>
          New here? <Link href="/register" className="font-bold text-brand-600">Create an account</Link>
          {" · "}
          <Link href="/for-schools" className="font-bold text-brand-600">For schools</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <FormError>{error}</FormError>
        <TextField label="Email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <TextField label="Password" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-bold text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>

      <button onClick={() => { loginAsGuest(); router.replace("/dashboard"); }}
        className="mt-3 w-full rounded-2xl border-2 border-dashed border-black/15 py-2.5 text-sm font-bold text-ink/60 hover:border-brand-300">
        Continue as guest →
      </button>

      {/* One-click demo accounts */}
      <div className="mt-6 rounded-2xl bg-brand-50 p-3">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-brand-700">
          Explore a demo account
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.id}
              onClick={() => { const r = loginAs(d.id); if (r.ok) go(d.role); }}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold shadow-pop-sm hover:-translate-y-0.5 transition-transform"
            >
              <span>{ROLE_META[d.role].emoji}</span> {d.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold text-ink/40">
          Or sign in with any demo email · password <code className="font-bold">{DEMO_PASSWORD}</code>
        </p>
      </div>
    </AuthShell>
  );
}
