"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";

export interface OutputLine {
  id: string;
  content: string;
  type: "system" | "input" | "output" | "error";
  animate: boolean;
}

interface TerminalOutputProps {
  lines: OutputLine[];
  onTypingComplete: () => void;
  onSkip: () => void;
}

function getLineClass(type: OutputLine["type"]) {
  switch (type) {
    case "input":
      return "terminal-text-dim";
    case "error":
      return "terminal-text-error";
    case "system":
      return "terminal-text-dim";
    case "output":
    default:
      return "terminal-text";
  }
}

function TypewriterLine({
  line,
  onComplete,
}: {
  line: OutputLine;
  onComplete: () => void;
}) {
  const { displayedText } = useTypewriter({
    text: line.content,
    speed: 10,
    onComplete,
    enabled: true,
  });

  return (
    <div className={getLineClass(line.type)}>
      <pre className="whitespace-pre-wrap font-mono leading-relaxed m-0">
        {displayedText}
        <span className="block-cursor" />
      </pre>
    </div>
  );
}

export function TerminalOutput({
  lines,
  onTypingComplete,
  onSkip,
}: TerminalOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const programmaticScrollRef = useRef(false);

  // Find the last animating line
  const lastAnimatingIndex = lines.reduce(
    (acc, line, i) => (line.animate ? i : acc),
    -1
  );

  // Detect if user manually scrolled away from bottom
  const handleScroll = useCallback(() => {
    // Ignore scroll events we caused ourselves
    if (programmaticScrollRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    userScrolledRef.current = !atBottom;
  }, []);

  // Scroll container to bottom without affecting ancestors
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    programmaticScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
    // Clear the flag after the scroll event fires
    requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
    });
  }, []);

  // When new lines arrive, reset user-scroll override and snap to bottom
  useEffect(() => {
    userScrolledRef.current = false;
    scrollToBottom();
  }, [lines, scrollToBottom]);

  // ResizeObserver: follow content growth during typewriter animation
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (!userScrolledRef.current) {
        scrollToBottom();
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className="terminal-output flex-1 overflow-y-auto p-2 sm:p-4 pb-0"
      onScroll={handleScroll}
      onClick={onSkip}
    >
      {/* Inner wrapper pins content to bottom when short, scrolls normally when tall */}
      <div ref={contentRef} className="min-h-full flex flex-col justify-end">
        {lines.map((line, index) => {
          if (line.animate && index === lastAnimatingIndex) {
            return (
              <TypewriterLine
                key={line.id}
                line={line}
                onComplete={onTypingComplete}
              />
            );
          }

          if (!line.content) {
            return <div key={line.id} className="h-4" />;
          }

          return (
            <div key={line.id} className={getLineClass(line.type)}>
              <pre className="whitespace-pre-wrap font-mono leading-relaxed m-0">
                {line.content}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
