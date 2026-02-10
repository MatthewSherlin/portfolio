"use client";

import { useRef, useEffect } from "react";
import { useResponsive } from "@/hooks/useResponsive";

export interface Suggestion {
  name: string;
  description: string;
}

interface AutocompleteProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  visible: boolean;
}

export function Autocomplete({
  suggestions,
  selectedIndex,
  visible,
}: AutocompleteProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();
  const maxVisible = isMobile ? 5 : 8;

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 w-full mb-1 z-10">
      <div
        className="mx-2 sm:mx-4 border border-[var(--color-crt-dim)] rounded overflow-y-auto"
        style={{
          background: "var(--color-crt-bg)",
          maxHeight: `${maxVisible * 24}px`,
        }}
      >
        {suggestions.map((s, i) => (
          <div
            key={s.name}
            ref={i === selectedIndex ? selectedRef : undefined}
            className={`px-3 py-0.5 text-crt-small font-mono flex justify-between gap-4 ${
              i === selectedIndex
                ? "terminal-text"
                : "terminal-text-dim"
            }`}
            style={
              i === selectedIndex
                ? {
                    background: "var(--color-crt-dim)",
                    color: "var(--color-crt-bg)",
                    textShadow: "none",
                  }
                : undefined
            }
          >
            <span className="truncate">{s.name}</span>
            <span className="truncate opacity-70">{s.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
