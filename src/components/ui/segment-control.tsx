import * as React from "react";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string = string> = {
  value: T;
  label: string;
};

type SegmentControlProps<T extends string = string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
};

/** Segmentação em pills (estilo dashboard moderno / Helios → B&Z). */
export function SegmentControl<T extends string = string>({
  value,
  options,
  onChange,
  className,
  size = "sm",
}: SegmentControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border/60 bg-muted/40 p-1 scrollbar-none",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full font-medium transition-all duration-200",
              size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-sm",
              active
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7)]"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
