"use client";

import { useEffect, useRef } from "react";
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
      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed m-0">
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the last animating line
  const lastAnimatingIndex = lines.reduce(
    (acc, line, i) => (line.animate ? i : acc),
    -1
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, lastAnimatingIndex]);

  return (
    <div
      ref={containerRef}
      className="terminal-output flex-1 overflow-y-auto p-4 pb-0"
      onClick={onSkip}
    >
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
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed m-0">
              {line.content}
            </pre>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
}
