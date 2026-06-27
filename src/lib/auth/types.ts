import type { AgeBand } from "@/types";

/**
 * Auth & multi-tenancy domain types.
 *
 * These describe the identity / RBAC / institution layer that sits above the
 * gameplay. In demo mode they're persisted in localStorage by the auth store;
 * in production they map to Supabase Auth + the `profiles`, `schools`,
 * `school_members`, `invitations`, `subscriptions` and `audit_log` tables
 * (see supabase/schema.sql).
 */

export type Role = "student" | "parent" | "teacher" | "school_admin" | "author" | "reviewer" | "admin";

export const ROLES: Role[] = ["student", "parent", "teacher", "school_admin", "author", "reviewer", "admin"];

export type AccountStatus = "active" | "invited" | "suspended";

/** Individual / family billing tiers (schools use SchoolPlan). */
export type AccountPlan = "free" | "family";

export interface Account {
  id: string;
  email: string;
  /**
   * DEMO ONLY — stored locally in the browser. In production authentication is
   * handled by Supabase Auth (passwords are bcrypt-hashed server-side and never
   * reach this layer).
   */
  password: string;
  role: Role;
  displayName: string;
  ageBand?: AgeBand; // students
  plan?: AccountPlan; // parents/students
  schoolId?: string; // teacher / school_admin / enrolled student
  childIds?: string[]; // parent → student account ids
  guardianIds?: string[]; // student → parent account ids
  status: AccountStatus;
  isGuest?: boolean;
  /** True when this account is backed by Supabase Auth (cloud), not demo-local. */
  cloud?: boolean;
  consent?: boolean; // parental/privacy consent captured at sign-up
  bio?: string;
  favouriteSubject?: string;
  avatarUrl?: string; // profile photo URL
  createdAt: string;
  lastLogin?: string;
}

export type SchoolPlan = "trial" | "school" | "district";
export type SchoolStatus = "trial" | "active" | "suspended";

export interface School {
  id: string;
  name: string;
  contactEmail: string;
  region?: string;
  joinCode: string; // staff/students join with this
  plan: SchoolPlan;
  seats: number;
  status: SchoolStatus;
  adminId: string; // owning school_admin account id
  createdAt: string;
  trialEndsAt?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  schoolId?: string;
  code: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId?: string;
  actorName?: string;
  action: string;
  detail?: string;
}

export interface Announcement {
  id: string;
  at: string;
  title: string;
  body: string;
  audience: "all" | "teachers" | "parents" | "students" | "school_admins";
  authorName?: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  accountId?: string;
  /** Cloud sign-up that requires email confirmation before sign-in. */
  needsVerification?: boolean;
}
