"use client";

/** Small, accessible form primitives shared by the sidebar. */

import { useId, useState, type ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-5 last:border-b-0">
      <h2 className="mb-3 text-[0.95rem] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

const inputBase =
  "h-9 w-full rounded-md border bg-white px-2.5 text-[0.95rem] tabular-nums text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25";

interface NumberInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  label: string; // accessible name
  suffix?: string;
  testId?: string;
}

/**
 * Text input (not type="number") so partial values like "-" or "0." are allowed
 * while typing and browsers don't silently swallow invalid text.
 */
export function NumberInput({ value, onChange, error, label, suffix, testId }: NumberInputProps) {
  const errId = useId();
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} text-right ${suffix ? "pr-8" : ""} ${
            error ? "border-danger bg-danger-soft" : "border-line-strong"
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={errId} role="alert" className="mt-1 text-[0.8rem] leading-snug text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Field that shows a derived value (e.g. number of squares) and only commits
 * on Enter or blur, so typing "1" on the way to "12" doesn't rewrite the grid.
 */
export function CommitInput({
  value,
  onCommit,
  label,
  testId,
}: {
  value: string;
  onCommit: (v: string) => boolean;
  label: string;
  testId?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const commit = () => {
    if (draft === null) return;
    const ok = onCommit(draft);
    setBad(!ok);
    if (ok) setDraft(null);
  };
  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        aria-invalid={bad || undefined}
        data-testid={testId}
        value={draft ?? value}
        onFocus={() => setDraft(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          commit();
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(null);
            setBad(false);
          }
        }}
        className={`${inputBase} text-right ${bad ? "border-danger bg-danger-soft" : "border-line-strong"}`}
      />
      {bad ? <p className="mt-1 text-[0.8rem] text-danger">Whole number, 1 or more</p> : null}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  label,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  testId?: string;
}) {
  return (
    <input
      type="text"
      aria-label={label}
      data-testid={testId}
      value={value}
      maxLength={12}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} border-line-strong text-center font-serif italic`}
    />
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  testId?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-3 py-1.5">
      <span>
        <span className="block text-[0.95rem] text-ink">{label}</span>
        {hint ? <span className="block text-[0.8rem] text-muted">{hint}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          data-testid={testId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-focus-visible:ring-offset-1" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} data-testid={testId} className="flex rounded-md bg-desk p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`h-8 flex-1 rounded-[5px] px-2 text-[0.9rem] transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              on ? "bg-white font-bold text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FieldRow({ label, htmlHint, children }: { label: string; htmlHint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_7.5rem] items-start gap-3 py-1">
      <div className="pt-2 text-[0.95rem] text-ink">
        {label}
        {htmlHint ? <span className="block text-[0.8rem] text-muted">{htmlHint}</span> : null}
      </div>
      {children}
    </div>
  );
}
