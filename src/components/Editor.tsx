"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { readFile, writeFile } from "@/lib/user-files";
import { useResponsive } from "@/hooks/useResponsive";

interface EditorProps {
  filePath: string;
  onExit: () => void;
}

type EditorMode = "normal" | "insert" | "command";

export function Editor({ filePath, onExit }: EditorProps) {
  const { isMobile } = useResponsive();
  const [lines, setLines] = useState<string[]>([""]);
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);
  const [mode, setMode] = useState<EditorMode>("normal");
  const [commandBuffer, setCommandBuffer] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [ctrlXPressed, setCtrlXPressed] = useState(false);
  const ctrlXTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load file content on mount
  useEffect(() => {
    const content = readFile(filePath);
    if (content !== null && content.length > 0) {
      setLines(content.split("\n"));
    } else {
      setLines([""]);
    }
  }, [filePath]);

  // Keep focus on container
  useEffect(() => {
    containerRef.current?.focus();
  }, [mode]);

  // Clear Ctrl+X timeout on unmount
  useEffect(() => {
    return () => {
      if (ctrlXTimerRef.current) clearTimeout(ctrlXTimerRef.current);
    };
  }, []);

  const saveFile = useCallback(() => {
    const content = lines.join("\n");
    const err = writeFile(filePath, content);
    if (err) {
      setStatusMessage(err);
    } else {
      setDirty(false);
      setStatusMessage(`"${filePath}" written`);
    }
  }, [lines, filePath]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // --- Emacs chords (work in any mode) ---

      // Ctrl+X starts a chord
      if (e.ctrlKey && e.key === "x") {
        setCtrlXPressed(true);
        setStatusMessage("C-x -");
        if (ctrlXTimerRef.current) clearTimeout(ctrlXTimerRef.current);
        ctrlXTimerRef.current = setTimeout(() => {
          setCtrlXPressed(false);
          setStatusMessage("");
        }, 2000);
        return;
      }

      // Ctrl+X Ctrl+S → save
      if (ctrlXPressed && e.ctrlKey && e.key === "s") {
        setCtrlXPressed(false);
        saveFile();
        return;
      }

      // Ctrl+X Ctrl+C → save and quit
      if (ctrlXPressed && e.ctrlKey && e.key === "c") {
        setCtrlXPressed(false);
        saveFile();
        onExit();
        return;
      }

      // Any other key after Ctrl+X cancels the chord
      if (ctrlXPressed) {
        setCtrlXPressed(false);
        setStatusMessage("");
      }

      // Ctrl+S → save (standalone, no chord needed)
      if (e.ctrlKey && e.key === "s") {
        saveFile();
        return;
      }

      // --- Emacs cursor bindings (insert mode only) ---
      if (mode === "insert" && e.ctrlKey) {
        switch (e.key) {
          case "a": // beginning of line
            setCursorCol(0);
            return;
          case "e": // end of line
            setCursorCol(lines[cursorRow].length);
            return;
          case "f": // forward char
            setCursorCol((c) => Math.min(lines[cursorRow].length, c + 1));
            return;
          case "b": // backward char
            setCursorCol((c) => Math.max(0, c - 1));
            return;
          case "n": // next line
            setCursorRow((r) => Math.min(lines.length - 1, r + 1));
            return;
          case "p": // previous line
            setCursorRow((r) => Math.max(0, r - 1));
            return;
          case "k": { // kill to end of line
            const line = lines[cursorRow];
            if (cursorCol < line.length) {
              setLines((prev) => {
                const next = [...prev];
                next[cursorRow] = line.slice(0, cursorCol);
                return next;
              });
              setDirty(true);
            }
            return;
          }
        }
      }

      // --- Vim command mode ---
      if (mode === "command") {
        if (e.key === "Enter") {
          const cmd = commandBuffer.trim();
          if (cmd === "w") {
            saveFile();
            setMode("normal");
            setCommandBuffer("");
          } else if (cmd === "q") {
            if (dirty) {
              setStatusMessage("No write since last change (use :wq or :q!)");
              setMode("normal");
              setCommandBuffer("");
            } else {
              onExit();
            }
          } else if (cmd === "wq" || cmd === "x") {
            saveFile();
            onExit();
          } else if (cmd === "q!") {
            onExit();
          } else {
            setStatusMessage(`Not a command: ${cmd}`);
            setMode("normal");
            setCommandBuffer("");
          }
          return;
        }
        if (e.key === "Escape") {
          setMode("normal");
          setCommandBuffer("");
          return;
        }
        if (e.key === "Backspace") {
          setCommandBuffer((b) => b.slice(0, -1));
          if (commandBuffer.length <= 1) {
            setMode("normal");
            setCommandBuffer("");
          }
          return;
        }
        if (e.key.length === 1) {
          setCommandBuffer((b) => b + e.key);
        }
        return;
      }

      // --- Vim normal mode ---
      if (mode === "normal") {
        setStatusMessage("");
        switch (e.key) {
          case "i":
            setMode("insert");
            break;
          case "a":
            setMode("insert");
            setCursorCol((c) => Math.min(c + 1, lines[cursorRow].length));
            break;
          case "o":
            setMode("insert");
            setLines((prev) => {
              const next = [...prev];
              next.splice(cursorRow + 1, 0, "");
              return next;
            });
            setCursorRow((r) => r + 1);
            setCursorCol(0);
            setDirty(true);
            break;
          case "O":
            setMode("insert");
            setLines((prev) => {
              const next = [...prev];
              next.splice(cursorRow, 0, "");
              return next;
            });
            setCursorCol(0);
            setDirty(true);
            break;
          case ":":
            setMode("command");
            setCommandBuffer("");
            break;
          case "h":
          case "ArrowLeft":
            setCursorCol((c) => Math.max(0, c - 1));
            break;
          case "l":
          case "ArrowRight":
            setCursorCol((c) => Math.min(lines[cursorRow].length - 1, c + 1));
            break;
          case "j":
          case "ArrowDown":
            setCursorRow((r) => {
              const next = Math.min(lines.length - 1, r + 1);
              setCursorCol((c) => Math.min(c, lines[next].length));
              return next;
            });
            break;
          case "k":
          case "ArrowUp":
            setCursorRow((r) => {
              const next = Math.max(0, r - 1);
              setCursorCol((c) => Math.min(c, lines[next].length));
              return next;
            });
            break;
          case "0":
            setCursorCol(0);
            break;
          case "$":
            setCursorCol(Math.max(0, lines[cursorRow].length - 1));
            break;
          case "g":
            setCursorRow(0);
            setCursorCol(0);
            break;
          case "G":
            setCursorRow(lines.length - 1);
            setCursorCol(0);
            break;
          case "x": {
            const line = lines[cursorRow];
            if (line.length > 0) {
              setLines((prev) => {
                const next = [...prev];
                next[cursorRow] = line.slice(0, cursorCol) + line.slice(cursorCol + 1);
                return next;
              });
              setCursorCol((c) => Math.min(c, Math.max(0, line.length - 2)));
              setDirty(true);
            }
            break;
          }
          case "d":
            // Simple dd — delete whole line
            if (lines.length > 1) {
              setLines((prev) => {
                const next = [...prev];
                next.splice(cursorRow, 1);
                return next;
              });
              setCursorRow((r) => Math.min(r, lines.length - 2));
              setCursorCol(0);
              setDirty(true);
            } else {
              setLines([""]);
              setCursorCol(0);
              setDirty(true);
            }
            break;
        }
        return;
      }

      // --- Insert mode ---
      if (e.key === "Escape") {
        setMode("normal");
        setCursorCol((c) => Math.max(0, c - 1));
        return;
      }

      if (e.key === "Enter") {
        setLines((prev) => {
          const line = prev[cursorRow];
          const before = line.slice(0, cursorCol);
          const after = line.slice(cursorCol);
          const next = [...prev];
          next.splice(cursorRow, 1, before, after);
          return next;
        });
        setCursorRow((r) => r + 1);
        setCursorCol(0);
        setDirty(true);
        return;
      }

      if (e.key === "Backspace") {
        if (cursorCol > 0) {
          setLines((prev) => {
            const line = prev[cursorRow];
            const next = [...prev];
            next[cursorRow] = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
            return next;
          });
          setCursorCol((c) => c - 1);
          setDirty(true);
        } else if (cursorRow > 0) {
          // Join with previous line
          const prevLineLen = lines[cursorRow - 1].length;
          setLines((prev) => {
            const next = [...prev];
            next[cursorRow - 1] = next[cursorRow - 1] + next[cursorRow];
            next.splice(cursorRow, 1);
            return next;
          });
          setCursorRow((r) => r - 1);
          setCursorCol(prevLineLen);
          setDirty(true);
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        setCursorCol((c) => Math.max(0, c - 1));
        return;
      }
      if (e.key === "ArrowRight") {
        setCursorCol((c) => Math.min(lines[cursorRow].length, c + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        setCursorRow((r) => Math.max(0, r - 1));
        return;
      }
      if (e.key === "ArrowDown") {
        setCursorRow((r) => Math.min(lines.length - 1, r + 1));
        return;
      }

      // Regular character input
      if (e.key.length === 1) {
        setLines((prev) => {
          const line = prev[cursorRow];
          const next = [...prev];
          next[cursorRow] = line.slice(0, cursorCol) + e.key + line.slice(cursorCol);
          return next;
        });
        setCursorCol((c) => c + 1);
        setDirty(true);
      }
    },
    [mode, lines, cursorRow, cursorCol, commandBuffer, dirty, saveFile, onExit, ctrlXPressed]
  );

  const modeLabel =
    mode === "insert"
      ? "-- INSERT -- (C-x C-s save, C-x C-c quit)"
      : mode === "command"
        ? `:${commandBuffer}`
        : "";

  const fileName = filePath.split("/").pop() || filePath;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full font-mono ${isMobile ? "text-crt-small" : "text-crt-base"} leading-[1.4] focus:outline-none`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Title bar */}
      <div className={`terminal-text-dim ${isMobile ? "px-1 py-0.5" : "px-2 py-1"} border-b border-current/20 flex justify-between`}>
        <span>{fileName}{dirty ? " [+]" : ""}</span>
        <span className="text-crt-small">vim</span>
      </div>

      {/* Editor content */}
      <div className={`flex-1 overflow-auto ${isMobile ? "px-0.5" : "px-1"} py-1`}>
        {lines.map((line, row) => (
          <div key={row} className="flex">
            <span className={`terminal-text-dim ${isMobile ? "w-6 mr-1" : "w-8 mr-2"} text-right select-none shrink-0`}>
              {row + 1}
            </span>
            <span className="terminal-text whitespace-pre">
              {row === cursorRow ? (
                <>
                  {line.slice(0, cursorCol)}
                  <span
                    className="bg-[var(--color-crt-text)] text-[var(--color-crt-bg)]"
                  >
                    {line[cursorCol] || " "}
                  </span>
                  {line.slice(cursorCol + 1)}
                </>
              ) : (
                line || " "
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="terminal-text-dim px-2 py-1 border-t border-current/20 flex justify-between">
        <span>{statusMessage || modeLabel}</span>
        <span>
          {cursorRow + 1},{cursorCol + 1}
        </span>
      </div>
    </div>
  );
}
