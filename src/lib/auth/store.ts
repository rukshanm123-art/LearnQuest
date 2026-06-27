"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { AgeBand } from "@/types";
import { useGameStore } from "@/lib/store/useGameStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  cloudSignIn, cloudSignUp, cloudSignOut, cloudCurrentProfile,
  loadPlayerState, savePlayerState, type CloudProfile,
} from "@/lib/supabase/cloud";
import type {
  Account,
  Announcement,
  AuditEntry,
  AuthResult,
  Invitation,
  Role,
  School,
  SchoolPlan,
} from "./types";

/**
 * LearnQuest auth store — a fully working, browser-local implementation of the
 * identity / RBAC / multi-tenancy layer so the entire product is usable with
 * zero backend. In production these actions become Supabase Auth calls + RLS-
 * guarded table writes; the component layer (pages, guards) stays unchanged.
 */

const now = () => new Date().toISOString();
const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2);
const genCode = (n = 6) =>
  Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

const norm = (e: string) => e.trim().toLowerCase();

/** Seeded demo logins surfaced on the sign-in page for one-click exploration. */
export const DEMO_ACCOUNTS: { role: Role; label: string; id: string; email: string }[] = [
  { role: "student", label: "Student", id: "acc-stu-aroha", email: "aroha@aotearoa.school.nz" },
  { role: "parent", label: "Parent", id: "acc-parent", email: "sarah@learnquest.nz" },
  { role: "teacher", label: "Teacher", id: "acc-teacher-hana", email: "hana@aotearoa.school.nz" },
  { role: "school_admin", label: "School admin", id: "acc-principal", email: "principal@aotearoa.school.nz" },
  { role: "author", label: "Author", id: "acc-author", email: "author@learnquest.nz" },
  { role: "reviewer", label: "Reviewer", id: "acc-reviewer", email: "reviewer@learnquest.nz" },
  { role: "admin", label: "Platform admin", id: "acc-admin", email: "admin@learnquest.nz" },
];

export const DEMO_PASSWORD = "demo1234";

interface AuthState {
  accounts: Record<string, Account>;
  schools: Record<string, School>;
  invitations: Invitation[];
  audit: AuditEntry[];
  announcements: Announcement[];
  currentId: string | null;
  seeded: boolean;
  _hydrated: boolean;
}

interface AuthActions {
  setHydrated: (v: boolean) => void;
  seedDemo: () => void;

  login: (email: string, password: string) => Promise<AuthResult>;
  loginAs: (accountId: string) => AuthResult;
  loginAsGuest: () => void;
  logout: () => void;
  restoreSession: () => Promise<void>;

  registerStudent: (i: { displayName: string; email: string; password: string; ageBand: AgeBand; schoolCode?: string; consent: boolean }) => Promise<AuthResult>;
  registerParent: (i: { displayName: string; email: string; password: string; consent: boolean }) => Promise<AuthResult>;
  registerTeacher: (i: { displayName: string; email: string; password: string; schoolCode?: string }) => Promise<AuthResult>;
  registerSchool: (i: { schoolName: string; region?: string; adminName: string; email: string; password: string; seats?: number }) => AuthResult;

  addChild: (i: { displayName: string; ageBand: AgeBand }) => AuthResult;
  updateProfile: (patch: Partial<Pick<Account, "displayName" | "ageBand" | "plan" | "bio" | "favouriteSubject" | "avatarUrl">>) => void;

  invite: (email: string, role: Role, schoolId?: string) => Invitation;
  postAnnouncement: (i: { title: string; body: string; audience: Announcement["audience"] }) => void;

  suspendAccount: (id: string) => void;
  reactivateAccount: (id: string) => void;
  setSchoolPlan: (schoolId: string, plan: SchoolPlan, seats?: number) => void;
  removeSchool: (schoolId: string) => void;
}

type AuthStore = AuthState & AuthActions;

function syncStudentIntoGame(a: Account) {
  if (a.role !== "student") return;
  try {
    const g = useGameStore.getState();
    g.setDisplayName(a.displayName);
    if (a.ageBand) g.setAgeBand(a.ageBand);
  } catch {
    /* game store not ready during SSR — ignored */
  }
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => {
      const log = (action: string, detail?: string) => {
        const cur = get().currentId ? get().accounts[get().currentId!] : undefined;
        const entry: AuditEntry = {
          id: genId(), at: now(), actorId: cur?.id, actorName: cur?.displayName, action, detail,
        };
        set((s) => ({ audit: [entry, ...s.audit].slice(0, 200) }));
      };

      const finishLogin = (a: Account): AuthResult => {
        if (a.status === "suspended") return { ok: false, error: "This account is suspended. Contact support." };
        set((s) => ({ currentId: a.id, accounts: { ...s.accounts, [a.id]: { ...a, lastLogin: now() } } }));
        syncStudentIntoGame(a);
        log("login", a.email);
        return { ok: true, accountId: a.id };
      };

      const createAccount = (a: Account): AuthResult => {
        set((s) => ({ accounts: { ...s.accounts, [a.id]: a } }));
        return finishLogin(a);
      };

      const emailTaken = (email: string) =>
        Object.values(get().accounts).some((a) => a.email === norm(email));

      // Map a Supabase profile → local Account cache + load cloud progress.
      const adoptCloudUser = async (profile: CloudProfile): Promise<AuthResult> => {
        const acc: Account = {
          id: profile.id, email: profile.email, password: "", role: profile.role,
          displayName: profile.displayName, ageBand: profile.ageBand, status: "active",
          cloud: true, createdAt: profile.createdAt, lastLogin: now(),
          bio: profile.bio, favouriteSubject: profile.favouriteSubject, avatarUrl: profile.avatarUrl,
        };
        set((s) => ({ accounts: { ...s.accounts, [acc.id]: acc }, currentId: acc.id }));
        try {
          const g = useGameStore.getState();
          const blob = await loadPlayerState(profile.id);
          if (blob) {
            g.hydratePlayer(blob);
          } else {
            g.resetProgress();
            if (acc.role === "student") syncStudentIntoGame(acc);
            await savePlayerState(profile.id, g.snapshot());
          }
        } catch {
          /* progress sync is best-effort */
        }
        log("cloud_login", profile.email);
        return { ok: true, accountId: acc.id };
      };

      return {
        accounts: {},
        schools: {},
        invitations: [],
        audit: [],
        announcements: [],
        currentId: null,
        seeded: false,
        _hydrated: false,

        setHydrated: (v) => set({ _hydrated: v }),

        login: async (email, password) => {
          if (isSupabaseConfigured) {
            const r = await cloudSignIn(email, password);
            if (r.ok && r.profile) return adoptCloudUser(r.profile);
            // Allow seeded demo emails typed into the form to still work.
            const local = Object.values(get().accounts).find((x) => x.email === norm(email) && !x.cloud);
            if (local && local.password === password) return finishLogin(local);
            return { ok: false, error: r.error ?? "Incorrect email or password." };
          }
          const a = Object.values(get().accounts).find((x) => x.email === norm(email));
          if (!a || a.password !== password) return { ok: false, error: "Incorrect email or password." };
          return finishLogin(a);
        },

        loginAs: (id) => {
          const a = get().accounts[id];
          if (!a) return { ok: false, error: "Account not found." };
          return finishLogin(a);
        },

        loginAsGuest: () => {
          const a: Account = {
            id: genId(), email: `guest-${genCode(4)}@local`, password: "", role: "student",
            displayName: "Explorer", ageBand: "8-10", status: "active", isGuest: true, createdAt: now(),
          };
          createAccount(a);
        },

        logout: () => {
          const cur = get().currentId ? get().accounts[get().currentId!] : undefined;
          log("logout");
          set({ currentId: null });
          if (isSupabaseConfigured && cur?.cloud) void cloudSignOut();
        },

        restoreSession: async () => {
          if (!isSupabaseConfigured) return;
          const profile = await cloudCurrentProfile();
          if (profile) {
            await adoptCloudUser(profile);
            return;
          }
          const cur = get().currentId ? get().accounts[get().currentId!] : undefined;
          if (cur?.cloud) set({ currentId: null });
        },

        registerStudent: async (i) => {
          if (i.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
          if (isSupabaseConfigured) {
            const r = await cloudSignUp({ email: i.email, password: i.password, displayName: i.displayName || "Explorer", role: "student", ageBand: i.ageBand });
            if (r.needsVerification) return { ok: true, needsVerification: true };
            if (!r.ok || !r.profile) return { ok: false, error: r.error ?? "Sign up failed." };
            return adoptCloudUser(r.profile);
          }
          if (!i.email || !i.password) return { ok: false, error: "Email and password are required." };
          if (emailTaken(i.email)) return { ok: false, error: "An account with that email already exists." };
          const school = i.schoolCode ? Object.values(get().schools).find((s) => s.joinCode === i.schoolCode!.toUpperCase()) : undefined;
          if (i.schoolCode && !school) return { ok: false, error: "We couldn't find a school with that code." };
          const a: Account = {
            id: genId(), email: norm(i.email), password: i.password, role: "student",
            displayName: i.displayName || "Explorer", ageBand: i.ageBand, plan: "free",
            schoolId: school?.id, status: "active", consent: i.consent, createdAt: now(),
          };
          log("register_student", a.email);
          return createAccount(a);
        },

        registerParent: async (i) => {
          if (i.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
          if (isSupabaseConfigured) {
            const r = await cloudSignUp({ email: i.email, password: i.password, displayName: i.displayName || "Parent", role: "parent" });
            if (r.needsVerification) return { ok: true, needsVerification: true };
            if (!r.ok || !r.profile) return { ok: false, error: r.error ?? "Sign up failed." };
            return adoptCloudUser(r.profile);
          }
          if (emailTaken(i.email)) return { ok: false, error: "An account with that email already exists." };
          const a: Account = {
            id: genId(), email: norm(i.email), password: i.password, role: "parent",
            displayName: i.displayName || "Parent", plan: "free", childIds: [], status: "active",
            consent: i.consent, createdAt: now(),
          };
          log("register_parent", a.email);
          return createAccount(a);
        },

        registerTeacher: async (i) => {
          if (i.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
          if (isSupabaseConfigured) {
            const r = await cloudSignUp({ email: i.email, password: i.password, displayName: i.displayName || "Teacher", role: "teacher" });
            if (r.needsVerification) return { ok: true, needsVerification: true };
            if (!r.ok || !r.profile) return { ok: false, error: r.error ?? "Sign up failed." };
            return adoptCloudUser(r.profile);
          }
          if (emailTaken(i.email)) return { ok: false, error: "An account with that email already exists." };
          const school = i.schoolCode ? Object.values(get().schools).find((s) => s.joinCode === i.schoolCode!.toUpperCase()) : undefined;
          if (i.schoolCode && !school) return { ok: false, error: "We couldn't find a school with that code." };
          const a: Account = {
            id: genId(), email: norm(i.email), password: i.password, role: "teacher",
            displayName: i.displayName || "Teacher", schoolId: school?.id, status: "active", createdAt: now(),
          };
          log("register_teacher", a.email);
          return createAccount(a);
        },

        registerSchool: (i) => {
          if (emailTaken(i.email)) return { ok: false, error: "An account with that email already exists." };
          if (i.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
          const schoolId = genId();
          const adminId = genId();
          const school: School = {
            id: schoolId, name: i.schoolName, contactEmail: norm(i.email), region: i.region,
            joinCode: genCode(8), plan: "trial", seats: i.seats ?? 30, status: "trial", adminId,
            createdAt: now(), trialEndsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          };
          const admin: Account = {
            id: adminId, email: norm(i.email), password: i.password, role: "school_admin",
            displayName: i.adminName || "School admin", schoolId, status: "active", createdAt: now(),
          };
          set((s) => ({ schools: { ...s.schools, [schoolId]: school }, accounts: { ...s.accounts, [adminId]: admin } }));
          log("register_school", `${i.schoolName} (${school.joinCode})`);
          return finishLogin(admin);
        },

        addChild: (i) => {
          const parent = get().currentId ? get().accounts[get().currentId!] : null;
          if (!parent || parent.role !== "parent") return { ok: false, error: "Only a parent can add a child." };
          const childId = genId();
          const child: Account = {
            id: childId, email: `${i.displayName.toLowerCase().replace(/\s+/g, "")}-${genCode(3)}@child.local`,
            password: "", role: "student", displayName: i.displayName, ageBand: i.ageBand,
            plan: "family", guardianIds: [parent.id], status: "active", createdAt: now(),
          };
          set((s) => ({
            accounts: {
              ...s.accounts,
              [childId]: child,
              [parent.id]: { ...parent, childIds: [...(parent.childIds ?? []), childId] },
            },
          }));
          log("add_child", i.displayName);
          return { ok: true, accountId: childId };
        },

        updateProfile: (patch) => {
          const id = get().currentId;
          if (!id) return;
          set((s) => ({ accounts: { ...s.accounts, [id]: { ...s.accounts[id], ...patch } } }));
          const a = get().accounts[id];
          syncStudentIntoGame(a);
        },

        invite: (email, role, schoolId) => {
          const inv: Invitation = {
            id: genId(), email: norm(email), role, schoolId, code: genCode(8), status: "pending", createdAt: now(),
          };
          set((s) => ({ invitations: [inv, ...s.invitations] }));
          log("invite", `${email} as ${role}`);
          return inv;
        },

        postAnnouncement: (i) => {
          const cur = get().currentId ? get().accounts[get().currentId!] : undefined;
          const ann: Announcement = { id: genId(), at: now(), authorName: cur?.displayName, ...i };
          set((s) => ({ announcements: [ann, ...s.announcements] }));
          log("announcement", i.title);
        },

        suspendAccount: (id) => {
          set((s) => ({ accounts: { ...s.accounts, [id]: { ...s.accounts[id], status: "suspended" } } }));
          log("suspend_account", get().accounts[id]?.email);
        },
        reactivateAccount: (id) => {
          set((s) => ({ accounts: { ...s.accounts, [id]: { ...s.accounts[id], status: "active" } } }));
          log("reactivate_account", get().accounts[id]?.email);
        },
        setSchoolPlan: (schoolId, plan, seats) => {
          set((s) => ({
            schools: {
              ...s.schools,
              [schoolId]: {
                ...s.schools[schoolId],
                plan,
                status: plan === "trial" ? "trial" : "active",
                seats: seats ?? s.schools[schoolId].seats,
              },
            },
          }));
          log("set_school_plan", `${get().schools[schoolId]?.name} → ${plan}`);
        },
        removeSchool: (schoolId) => {
          const name = get().schools[schoolId]?.name ?? schoolId;
          set((s) => {
            const schools = { ...s.schools };
            delete schools[schoolId];
            return { schools };
          });
          log("remove_school", name);
        },

        seedDemo: () => {
          if (get().seeded) return;

          const schoolId = "sch-aotearoa";
          const school: School = {
            id: schoolId, name: "Aotearoa Primary School", contactEmail: "principal@aotearoa.school.nz",
            region: "Wellington", joinCode: "AOTEAROA", plan: "school", seats: 300, status: "active",
            adminId: "acc-principal", createdAt: now(),
          };

          const mk = (a: Partial<Account> & Pick<Account, "id" | "email" | "role" | "displayName">): Account => ({
            password: DEMO_PASSWORD, status: "active", createdAt: now(), ...a,
          });

          const students = [
            mk({ id: "acc-stu-aroha", email: "aroha@aotearoa.school.nz", role: "student", displayName: "Aroha", ageBand: "8-10", schoolId }),
            mk({ id: "acc-stu-liam", email: "liam@aotearoa.school.nz", role: "student", displayName: "Liam", ageBand: "8-10", schoolId }),
            mk({ id: "acc-stu-mere", email: "mere@aotearoa.school.nz", role: "student", displayName: "Mereana", ageBand: "11-14", schoolId }),
            mk({ id: "acc-stu-tama", email: "tama@aotearoa.school.nz", role: "student", displayName: "Tama", ageBand: "5-7", schoolId }),
            mk({ id: "acc-stu-sophie", email: "sophie@aotearoa.school.nz", role: "student", displayName: "Sophie", ageBand: "8-10", schoolId }),
            mk({ id: "acc-stu-hemi", email: "hemi@aotearoa.school.nz", role: "student", displayName: "Hemi", ageBand: "11-14", schoolId }),
          ];

          const accounts: Account[] = [
            mk({ id: "acc-admin", email: "admin@learnquest.nz", role: "admin", displayName: "Platform Admin" }),
            mk({ id: "acc-author", email: "author@learnquest.nz", role: "author", displayName: "Author Ana" }),
            mk({ id: "acc-reviewer", email: "reviewer@learnquest.nz", role: "reviewer", displayName: "Reviewer Rua" }),
            mk({ id: "acc-principal", email: "principal@aotearoa.school.nz", role: "school_admin", displayName: "Principal Ngata", schoolId }),
            mk({ id: "acc-teacher-hana", email: "hana@aotearoa.school.nz", role: "teacher", displayName: "Whaea Hana", schoolId }),
            mk({ id: "acc-teacher-tane", email: "tane@aotearoa.school.nz", role: "teacher", displayName: "Matua Tāne", schoolId }),
            mk({ id: "acc-parent", email: "sarah@learnquest.nz", role: "parent", displayName: "Sarah", plan: "family", childIds: ["acc-stu-liam", "acc-stu-aroha"] }),
            ...students,
          ];
          accounts.find((a) => a.id === "acc-stu-liam")!.guardianIds = ["acc-parent"];
          accounts.find((a) => a.id === "acc-stu-aroha")!.guardianIds = ["acc-parent"];

          set((s) => ({
            seeded: true,
            schools: { ...s.schools, [schoolId]: school },
            accounts: { ...s.accounts, ...Object.fromEntries(accounts.map((a) => [a.id, a])) },
            announcements: [
              { id: genId(), at: now(), title: "Welcome to LearnQuest 🎉", body: "Term 3 challenges are live. Keep those streaks going!", audience: "all", authorName: "LearnQuest" },
              ...s.announcements,
            ],
            audit: [
              { id: genId(), at: now(), actorName: "System", action: "seed", detail: "Demo school + accounts created" },
              ...s.audit,
            ],
          }));
        },
      };
    },
    {
      name: "learnquest-auth-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
      partialize: ({ _hydrated, ...rest }) => rest,
    },
  ),
);
