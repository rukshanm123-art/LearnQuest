"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./store";
import type { Account, Role } from "./types";

/** True only after the auth store has rehydrated (prevents SSR mismatch). */
export function useAuthHydrated(): boolean {
  const hydrated = useAuth((s) => s._hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && hydrated;
}

export function useCurrentAccount(): Account | null {
  return useAuth((s) => (s.currentId ? s.accounts[s.currentId] ?? null : null));
}

export const ROLE_META: Record<Role, { label: string; emoji: string; home: string }> = {
  student: { label: "Student", emoji: "🎒", home: "/dashboard" },
  parent: { label: "Parent", emoji: "👪", home: "/parent" },
  teacher: { label: "Teacher", emoji: "🍎", home: "/teacher" },
  school_admin: { label: "School admin", emoji: "🏫", home: "/school" },
  author: { label: "Author", emoji: "✍️", home: "/author" },
  reviewer: { label: "Reviewer", emoji: "🔎", home: "/author" },
  admin: { label: "Platform admin", emoji: "🛡️", home: "/admin" },
};

export function roleHome(role: Role): string {
  return ROLE_META[role].home;
}

/**
 * Client-side route guard. Redirects unauthenticated users to /login and
 * users without the required role to their own home. Returns `ready` so the
 * page can show a loading state until access is confirmed.
 */
export function useRequireRole(roles?: Role[]) {
  const hydrated = useAuthHydrated();
  const account = useCurrentAccount();
  const router = useRouter();
  const pathname = usePathname();
  const roleKey = roles?.join(",") ?? "";

  useEffect(() => {
    if (!hydrated) return;
    if (!account) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(account.role)) {
      router.replace(roleHome(account.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, account?.id, account?.role, roleKey]);

  const ready = hydrated && !!account && (!roles || roles.includes(account.role));
  return { account, ready, hydrated };
}

/** Seeds the demo school + accounts once after hydration. */
export function useEnsureSeeded() {
  const hydrated = useAuthHydrated();
  const seeded = useAuth((s) => s.seeded);
  const seedDemo = useAuth((s) => s.seedDemo);
  useEffect(() => {
    if (hydrated && !seeded) seedDemo();
  }, [hydrated, seeded, seedDemo]);
}

export function AuthLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center font-bold text-ink/40">Loading…</div>
  );
}
