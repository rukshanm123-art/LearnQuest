"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, BookOpen, Trophy, Map, BarChart3, GraduationCap, Building2, Shield, PenTool,
  Volume2, VolumeX, ChevronDown, LogOut, Settings, UserPlus, Library, Sofa, Mic,
} from "lucide-react";
import { HeaderStats } from "@/components/game/HeaderStats";
import { Avatar } from "@/components/game/Avatar";
import { useGameStore } from "@/lib/store/useGameStore";
import { useAuth } from "@/lib/auth/store";
import { useCurrentAccount, roleHome, ROLE_META, useAuthHydrated } from "@/lib/auth/guard";
import { isMuted, setMuted, play } from "@/lib/sound/sfx";
import { cn } from "@/lib/utils/cn";
import type { Role } from "@/lib/auth/types";

type NavItem = { href: string; label: string; icon: typeof Home };

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/adventure", label: "Journey", icon: Map },
    { href: "/library", label: "Library", icon: Library },
    { href: "/coach", label: "Coach", icon: Mic },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/houses", label: "Houses", icon: Shield },
    { href: "/collection", label: "Collection", icon: Trophy },
    { href: "/room", label: "My Room", icon: Sofa },
  ],
  parent: [{ href: "/parent", label: "Overview", icon: BarChart3 }],
  teacher: [{ href: "/teacher", label: "Classroom", icon: GraduationCap }],
  school_admin: [{ href: "/school", label: "School", icon: Building2 }],
  author: [{ href: "/author", label: "Content", icon: PenTool }],
  reviewer: [{ href: "/author", label: "Review", icon: PenTool }],
  admin: [
    { href: "/admin", label: "Admin", icon: Shield },
    { href: "/author", label: "Content", icon: PenTool },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useCurrentAccount();
  const logout = useAuth((s) => s.logout);

  const role: Role = account?.role ?? "student";
  const isStudent = role === "student";
  const nav = NAV_BY_ROLE[role];

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-dvh grid-bg">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link href={account ? roleHome(role) : "/"} className="flex shrink-0 items-center gap-2 font-display text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-500 text-white shadow-pop-sm">🚀</span>
            <span className="hidden bg-gradient-to-r from-brand-600 to-gem bg-clip-text text-transparent lg:inline">LearnQuest</span>
          </Link>

          <nav className="no-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex" aria-label="Primary">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                  active(href) ? "bg-brand-100 text-brand-700" : "text-ink/60 hover:bg-black/5")}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0">
            {isStudent && (
              <>
                <HeaderStats />
                <MuteButton />
              </>
            )}
            <AccountMenu onLogout={() => { logout(); router.replace("/"); }} />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 backdrop-blur-md md:hidden" aria-label="Primary mobile">
        <div className="no-scrollbar mx-auto flex max-w-2xl items-stretch gap-1 overflow-x-auto px-2 py-1.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn("flex min-w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-bold",
                active(href) ? "text-brand-600" : "text-ink/50")}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          ))}
          <Link href="/account"
            className={cn("flex min-w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-bold",
              active("/account") ? "text-brand-600" : "text-ink/50")}>
            <Settings className="h-5 w-5" /> Account
          </Link>
        </div>
      </nav>
    </div>
  );
}

function MuteButton() {
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  const toggle = () => { const n = !muted; setMuted(n); setMutedState(n); if (!n) play("click"); };
  return (
    <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-xl text-ink/60 hover:bg-black/5"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}>
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}

function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const hydrated = useAuthHydrated();
  const account = useCurrentAccount();
  const avatar = useGameStore((s) => s.equippedAvatar);
  const [open, setOpen] = useState(false);

  if (!hydrated || !account) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-ink/60 hover:bg-black/5">Sign in</Link>
      </div>
    );
  }

  const meta = ROLE_META[account.role];

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-black/5" aria-haspopup="menu" aria-expanded={open}>
        {account.avatarUrl ? (
          <Avatar parts={avatar} size="sm" photoUrl={account.avatarUrl} />
        ) : account.role === "student" ? (
          <Avatar parts={avatar} size="sm" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-xl">{meta.emoji}</span>
        )}
        <span className="hidden text-left sm:block">
          <span className="block max-w-[8rem] truncate text-sm font-bold leading-tight">{account.displayName}</span>
          <span className="block text-[11px] font-bold text-ink/40">{account.isGuest ? "Guest" : meta.label}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink/40" />
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-black/5 bg-white p-1 shadow-card">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-bold">{account.displayName}</p>
              <p className="truncate text-xs font-semibold text-ink/40">{account.email}</p>
            </div>
            <div className="h-px bg-black/5" />
            <Link href="/account" onClick={() => setOpen(false)} role="menuitem"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink/70 hover:bg-black/5">
              <Settings className="h-4 w-4" /> Account settings
            </Link>
            {account.isGuest && (
              <Link href="/register" onClick={() => setOpen(false)} role="menuitem"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-brand-600 hover:bg-brand-50">
                <UserPlus className="h-4 w-4" /> Save progress — sign up
              </Link>
            )}
            <button onClick={onLogout} role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-streak hover:bg-streak/10">
              <LogOut className="h-4 w-4" /> {account.isGuest ? "Exit guest" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
