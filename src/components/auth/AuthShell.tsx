"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Centered, branded wrapper for sign-in / sign-up screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-brand-50 via-white to-white px-4 py-10">
      <div className={cn("w-full", wide ? "max-w-lg" : "max-w-md")}>
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-pop-sm">🚀</span>
          <span className="bg-gradient-to-r from-brand-600 to-gem bg-clip-text text-transparent">LearnQuest</span>
        </Link>
        <div className="card p-6 sm:p-8">
          <h1 className="text-center font-display text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-center font-semibold text-ink/50">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm font-semibold text-ink/60">{footer}</div>}
      </div>
    </div>
  );
}

export function TextField({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink/70">{label}</span>
      <input
        className={cn(
          "w-full rounded-2xl border-2 px-4 py-2.5 font-semibold outline-none transition-colors",
          error ? "border-streak" : "border-black/10 focus:border-brand-400",
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs font-bold text-streak">{error}</span>}
    </label>
  );
}

export function FormError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="rounded-2xl bg-streak/10 px-4 py-2.5 text-sm font-bold text-streak" role="alert">
      {children}
    </p>
  );
}
