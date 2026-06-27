import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "brand" | "coin" | "xp" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  brand: "bg-brand-500 hover:bg-brand-600 shadow-[0_6px_0_0_#1467e1]",
  coin: "bg-coin hover:brightness-105 text-ink shadow-[0_6px_0_0_#d99a05]",
  xp: "bg-xp hover:brightness-105 shadow-[0_6px_0_0_#15803d]",
  danger: "bg-streak hover:brightness-105 shadow-[0_6px_0_0_#be123c]",
  ghost: "bg-transparent text-ink shadow-none hover:bg-black/5 active:translate-y-0",
  outline: "bg-white text-ink border-2 border-black/10 shadow-[0_6px_0_0_rgba(0,0,0,0.08)]",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
  xl: "px-9 py-4 text-xl",
};

/** Shared class string so links can look identical to buttons. */
export function buttonVariants({
  variant = "brand",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn("btn-pop", VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => (
    <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
  ),
);
Button.displayName = "Button";
