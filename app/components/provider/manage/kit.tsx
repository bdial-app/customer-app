"use client";
/**
 * Building blocks for the Manage Business screens, so every section looks and
 * behaves the same: one header style, one card, one empty state, one way to
 * add things (an in-page action bar — never a floating button, which escaped
 * its tab and covered other screens), one bottom sheet and one set of inputs.
 */
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { Sheet } from "@/app/components/ui/sheet";

/** Space the bottom navigation (and its Business Mode pill) takes up. */
export const BOTTOM_NAV_SPACE = "calc(6.5rem + var(--sab, 0px))";

// ─── Layout ─────────────────────────────────────────────────────────────

/** The page body under the tab bar: soft background, consistent padding. */
export function ManagePage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 px-4 pt-4 flex flex-col gap-4" style={{ paddingBottom: BOTTOM_NAV_SPACE }}>
      {children}
    </div>
  );
}

/** A section's title row: what this is, a one-line why, and its main action. */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** The standard surface. */
export function Card({
  children,
  className = "",
  padded = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`block w-full ${onClick ? "text-left" : ""} bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${padded ? "p-4" : ""} ${onClick ? "active:scale-[0.99] transition-transform" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Small label above a group inside a page. */
export function GroupLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 -mb-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{children}</p>
      {action}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  body,
  action,
  secondary,
}: {
  icon: string;
  title: string;
  body: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <Card className="text-center py-9 px-6">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-indigo-500 to-violet-500 rotate-6 opacity-20" />
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <IonIcon icon={icon} className="text-[34px] text-white" />
        </div>
      </div>
      <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-[280px] mx-auto">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
      {secondary && <div className="mt-2.5 flex justify-center">{secondary}</div>}
    </Card>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  full?: boolean;
  size?: "md" | "sm";
  className?: string;
};

const spinner = <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />;

export function PrimaryButton({ children, onClick, icon, disabled, loading, type = "button", full, size = "md", className = "" }: BtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:shadow-none ${size === "sm" ? "h-11 px-4 text-[13px]" : "h-12 px-5 text-[14px]"} ${full ? "w-full" : ""} ${className}`}
    >
      {loading ? spinner : icon && <IonIcon icon={icon} className={size === "sm" ? "text-[15px]" : "text-[18px]"} />}
      {children}
    </motion.button>
  );
}

export function SecondaryButton({ children, onClick, icon, disabled, loading, type = "button", full, size = "md", className = "" }: BtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 disabled:opacity-50 ${size === "sm" ? "h-11 px-4 text-[13px]" : "h-12 px-5 text-[14px]"} ${full ? "w-full" : ""} ${className}`}
    >
      {loading ? spinner : icon && <IonIcon icon={icon} className={size === "sm" ? "text-[15px]" : "text-[18px]"} />}
      {children}
    </motion.button>
  );
}

/**
 * The way to add things on a list page: a bar that sticks to the bottom of
 * the page just above the navigation, inside the tab — so it scrolls away with
 * the tab and can never sit over another screen or a sheet.
 */
export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky z-10 -mx-4 px-4 pt-3 pb-3 bg-gradient-to-t from-slate-50 via-slate-50/95 to-slate-50/0 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/0" style={{ bottom: BOTTOM_NAV_SPACE }}>
      {children}
      {/* Fill down to the navigation, so the list never shows between the two */}
      <div aria-hidden className="absolute inset-x-0 top-full bg-slate-50 dark:bg-slate-950" style={{ height: BOTTOM_NAV_SPACE }} />
    </div>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────────

export function StatRow({ items }: { items: { label: string; value: ReactNode; tone?: "indigo" | "amber" | "emerald" | "slate" | "rose" }[] }) {
  const tones = {
    indigo: "text-indigo-600 dark:text-indigo-300",
    amber: "text-amber-600 dark:text-amber-300",
    emerald: "text-emerald-600 dark:text-emerald-300",
    rose: "text-rose-600 dark:text-rose-300",
    slate: "text-slate-900 dark:text-white",
  };
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((s) => (
        <Card key={s.label} className="!p-3 text-center">
          <p className={`text-[19px] font-extrabold tabular-nums leading-none ${tones[s.tone ?? "slate"]}`}>{s.value}</p>
          <p className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wide">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}

/** Two- or three-way switch (filters, product/service, etc.). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="flex p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 h-8 rounded-lg text-[12.5px] font-bold transition-colors ${on ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sheet ──────────────────────────────────────────────────────────────

/**
 * Bottom sheet on document.body (above the tab bar and bottom navigation, and
 * just below AppDialog, so a confirm dialog opened from a sheet dims it),
 * with a fixed header, a scrolling body and an optional fixed footer for the
 * main action — so Save is always reachable, even with the keyboard open.
 */
export function ManageSheet({
  open,
  onClose,
  title,
  subtitle,
  headerRight,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const keyboard = useKeyboardOffset();
  return (
    <Sheet open={open} onClose={onClose} zIndex={9996} label={title} safeArea={!footer}>
      <div className="shrink-0 flex items-start gap-3 px-5 pt-1 sm:pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
        <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-1 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <IonIcon icon={closeOutline} className="text-xl text-slate-500" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      {footer && (
        <div
          className="shrink-0 px-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
          style={{ paddingBottom: keyboard > 0 ? 12 : "max(var(--sab, env(safe-area-inset-bottom)), 14px)" }}
        >
          {footer}
        </div>
      )}
    </Sheet>
  );
}

// ─── Form fields ────────────────────────────────────────────────────────

export const inputCls =
  "w-full h-12 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
export const textareaCls =
  "w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none";

export function FieldBlock({
  label,
  hint,
  optional,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">
        {label}
        {optional && <span className="ml-1 font-medium text-slate-400 dark:text-slate-500">· optional</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] font-medium text-rose-500">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-slate-400 dark:text-slate-500 leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}

/** Status pill on list rows. */
export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "indigo" | "amber" | "emerald" | "rose" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${tones[tone]}`}>{children}</span>;
}
