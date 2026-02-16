"use client";

import { useRef, useEffect } from "react";
import { Autocomplete, Suggestion } from "./Autocomplete";
import { useResponsive } from "@/hooks/useResponsive";

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onTab: () => void;
  onAutocompleteNav: (direction: "up" | "down") => void;
  onAutocompleteSelect: () => void;
  onEscape: () => void;
  disabled: boolean;
  mode: "command" | "chat";
  currentPath: string;
  suggestions: Suggestion[];
  selectedSuggestion: number;
  showAutocomplete: boolean;
}

export function TerminalInput({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onTab,
  onAutocompleteNav,
  onAutocompleteSelect,
  onEscape,
  disabled,
  mode,
  currentPath,
  suggestions,
  selectedSuggestion,
  showAutocomplete,
}: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Scroll input into view when virtual keyboard opens on mobile
  useEffect(() => {
    if (!isMobile) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      if (document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
    };
    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const handleFocus = () => {
    if (isMobile) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (showAutocomplete) {
        onAutocompleteSelect();
      } else {
        onTab();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (showAutocomplete) {
        onAutocompleteSelect();
      } else {
        onSubmit(value);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showAutocomplete) {
        onAutocompleteNav("up");
      } else {
        onHistoryUp();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showAutocomplete) {
        onAutocompleteNav("down");
      } else {
        onHistoryDown();
      }
    }
  };

  const prompt =
    mode === "command"
      ? isMobile
        ? "~$"
        : `visitor@portfolio:${currentPath}$`
      : "chat>";

  return (
    <div className="relative shrink-0">
      <Autocomplete
        suggestions={suggestions}
        selectedIndex={selectedSuggestion}
        visible={showAutocomplete}
      />
      <div
        className="flex items-center px-2 sm:px-4 py-2 terminal-text"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="terminal-text-dim mr-2 select-none whitespace-nowrap">
          {prompt}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none terminal-text font-mono caret-crt-text"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
