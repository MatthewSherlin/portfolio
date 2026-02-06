"use client";

import { useRef, useEffect } from "react";
import { Autocomplete, Suggestion } from "./Autocomplete";

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

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

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
      ? `visitor@portfolio:${currentPath}$`
      : "chat>";

  return (
    <div className="relative shrink-0">
      <Autocomplete
        suggestions={suggestions}
        selectedIndex={selectedSuggestion}
        visible={showAutocomplete}
      />
      <div
        className="flex items-center px-4 py-2 terminal-text"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="terminal-text-dim mr-2 select-none whitespace-nowrap text-sm">
          {prompt}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none terminal-text font-mono text-sm caret-crt-text"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
