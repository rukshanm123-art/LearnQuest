"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Avatar } from "@/components/game/Avatar";
import { useAuth } from "@/lib/auth/store";
import { useRequireRole, AuthLoading, useCurrentAccount, ROLE_META } from "@/lib/auth/guard";
import { useGameStore } from "@/lib/store/useGameStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { uploadAvatar, updateCloudProfile } from "@/lib/supabase/cloud";
import { SUBJECTS } from "@/lib/curriculum/nz-curriculum";
import type { AgeBand } from "@/types";
import { cn } from "@/lib/utils/cn";

const AGE_BANDS: AgeBand[] = ["5-7", "8-10", "11-14"];

export default function AccountPage() {
  const { ready } = useRequireRole();
  return <AppShell>{ready ? <AccountInner /> : <AuthLoading />}</AppShell>;
}

function AccountInner() {
  const router = useRouter();
  const account = useCurrentAccount()!;
  const accounts = useAuth((s) => s.accounts);
  const schools = useAuth((s) => s.schools);
  const updateProfile = useAuth((s) => s.updateProfile);
  const addChild = useAuth((s) => s.addChild);
  const logout = useAuth((s) => s.logout);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const equippedAvatar = useGameStore((s) => s.equippedAvatar);

  const [name, setName] = useState(account.displayName);
  const [child, setChild] = useState({ displayName: "", ageBand: "8-10" as AgeBand });
  const [bio, setBio] = useState(account.bio ?? "");
  const [favourite, setFavourite] = useState(account.favouriteSubject ?? "");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [savedAbout, setSavedAbout] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = ROLE_META[account.role];

  const onPhoto = async (file: File) => {
    setPhotoBusy(true);
    try {
      if (account.cloud && isSupabaseConfigured) {
        const url = await uploadAvatar(account.id, file);
        if (url) { await updateCloudProfile(account.id, { avatarUrl: url }); updateProfile({ avatarUrl: url }); }
      } else {
        const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
        updateProfile({ avatarUrl: dataUrl });
      }
    } finally {
      setPhotoBusy(false);
    }
  };

  const saveAbout = async () => {
    updateProfile({ bio, favouriteSubject: favourite });
    if (account.cloud && isSupabaseConfigured) await updateCloudProfile(account.id, { bio, favouriteSubject: favourite });
    setSavedAbout(true);
    setTimeout(() => setSavedAbout(false), 2000);
  };

  const school = account.schoolId ? schools[account.schoolId] : undefined;
  const children = (account.childIds ?? []).map((id) => accounts[id]).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-3xl">{meta.emoji}</span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">{account.displayName}</h1>
          <p className="font-bold text-ink/50">{meta.label}{account.isGuest && " · Guest"} · {account.email}</p>
        </div>
      </div>

      {account.isGuest && (
        <Card className="bg-gradient-to-r from-gem/10 to-brand-50">
          <CardTitle>Save your progress 🎉</CardTitle>
          <p className="mt-1 font-semibold text-ink/60">Create a free account to keep your XP, pets and streak forever.</p>
          <Link href="/register" className={buttonVariants({ className: "mt-3" })}>Create account</Link>
        </Card>
      )}

      {/* Profile */}
      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink/70">Display name</span>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-2xl border-2 border-black/10 px-4 py-2.5 font-semibold outline-none focus:border-brand-400" />
              <Button onClick={() => updateProfile({ displayName: name })} disabled={name === account.displayName}>Save</Button>
            </div>
          </label>

          {account.role === "student" && (
            <div>
              <span className="mb-1 block text-sm font-bold text-ink/70">Age group</span>
              <div className="flex overflow-hidden rounded-2xl border-2 border-black/10">
                {AGE_BANDS.map((b) => (
                  <button key={b} onClick={() => updateProfile({ ageBand: b })}
                    className={cn("flex-1 py-2.5 text-sm font-bold", account.ageBand === b ? "bg-brand-500 text-white" : "hover:bg-black/5")}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* About you — photo, bio, favourite subject */}
      <Card>
        <CardTitle>About you</CardTitle>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-2">
            <Avatar parts={account.role === "student" ? equippedAvatar : { base: "base-explorer" }} size="lg" photoUrl={account.avatarUrl} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
              <Camera className="h-4 w-4" /> {photoBusy ? "Uploading…" : "Photo"}
            </Button>
          </div>
          <div className="flex-1 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-ink/70">Bio</span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} maxLength={160}
                placeholder="Tell us about yourself!"
                className="w-full rounded-2xl border-2 border-black/10 px-4 py-2.5 font-semibold outline-none focus:border-brand-400" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-ink/70">Favourite subject</span>
              <select value={favourite} onChange={(e) => setFavourite(e.target.value)}
                className="w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-2.5 font-semibold outline-none focus:border-brand-400">
                <option value="">—</option>
                {SUBJECTS.map((s) => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </label>
            <Button onClick={saveAbout} size="md">{savedAbout ? "Saved ✓" : "Save details"}</Button>
          </div>
        </div>
      </Card>

      {/* Parent: children */}
      {account.role === "parent" && (
        <Card>
          <CardTitle>Your tamariki</CardTitle>
          <div className="mt-3 space-y-2">
            {children.length === 0 && <p className="font-semibold text-ink/40">No children added yet.</p>}
            {children.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-black/[0.03] px-3 py-2">
                <span className="text-2xl">🧒</span>
                <span className="flex-1 font-bold">{c.displayName}</span>
                <span className="text-xs font-bold text-ink/40">Ages {c.ageBand}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-brand-50 p-3">
            <CardLabel>Add a child</CardLabel>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input value={child.displayName} onChange={(e) => setChild((c) => ({ ...c, displayName: e.target.value }))}
                placeholder="Child's name" className="min-w-0 flex-1 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-brand-400" />
              <select value={child.ageBand} onChange={(e) => setChild((c) => ({ ...c, ageBand: e.target.value as AgeBand }))}
                className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm font-bold" aria-label="Age group">
                {AGE_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <Button onClick={() => { if (child.displayName.trim()) { addChild(child); setChild({ displayName: "", ageBand: "8-10" }); } }}>Add</Button>
            </div>
          </div>
        </Card>
      )}

      {/* School info */}
      {school && (
        <Card>
          <CardTitle>School</CardTitle>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="font-bold">{school.name}</p>
              <p className="text-sm font-semibold text-ink/50">{school.region} · {school.plan} plan</p>
            </div>
            <span className="rounded-xl bg-brand-50 px-3 py-1.5 font-display font-extrabold tracking-widest text-brand-700">{school.joinCode}</span>
          </div>
        </Card>
      )}

      {/* Plan */}
      {(account.role === "student" || account.role === "parent") && (
        <Card className="flex items-center justify-between">
          <div>
            <CardLabel>Plan</CardLabel>
            <p className="font-display text-lg font-extrabold capitalize">{account.plan ?? "free"}</p>
          </div>
          <Link href="/pricing" className={buttonVariants({ variant: "outline", size: "sm" })}>Upgrade</Link>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="border-streak/20">
        <CardTitle>Account</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {account.role === "student" && (
            <Button variant="outline" onClick={() => { if (confirm("Reset all game progress (XP, coins, pets)? This can't be undone.")) resetProgress(); }}>
              Reset game progress
            </Button>
          )}
          <Button variant="danger" onClick={() => { logout(); router.replace("/"); }}>
            {account.isGuest ? "Exit guest" : "Sign out"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
