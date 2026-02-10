"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface DukeGameProps {
  onExit: (score: number) => void;
}

const JSDOS_CSS = "https://v8.js-dos.com/latest/js-dos.css";
const JSDOS_JS = "https://v8.js-dos.com/latest/js-dos.js";
const DUKE_BUNDLE = "/games/duke3d.jsdos?v=2";

export function DukeGame({ onExit }: DukeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ciRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExit = useCallback(() => {
    onExit(0);
  }, [onExit]);

  useEffect(() => {
    let cancelled = false;
    let linkEl: HTMLLinkElement | null = null;
    let scriptEl: HTMLScriptElement | null = null;

    async function loadJsDos() {
      // Inject CSS
      linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = JSDOS_CSS;
      document.head.appendChild(linkEl);

      // Inject JS and wait for load
      await new Promise<void>((resolve, reject) => {
        scriptEl = document.createElement("script");
        scriptEl.src = JSDOS_JS;
        scriptEl.onload = () => resolve();
        scriptEl.onerror = () => reject(new Error("Failed to load js-dos"));
        document.head.appendChild(scriptEl);
      });

      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Dos = (window as any).Dos;
      if (!Dos) {
        setError("js-dos failed to initialize");
        return;
      }

      setLoading(false);

      try {
        const ci = await Dos(containerRef.current, {
          url: DUKE_BUNDLE,
          autoStart: true,
          kiosk: true,
          mouseCapture: true,
          imageRendering: "pixelated",
        });
        if (!cancelled) {
          ciRef.current = ci;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to start game");
        }
      }
    }

    loadJsDos().catch((err) => {
      if (!cancelled) setError(err.message);
    });

    return () => {
      cancelled = true;
      // Stop the emulator instance
      if (ciRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ci = ciRef.current as any;
          if (typeof ci.exit === "function") ci.exit();
          else if (typeof ci.stop === "function") ci.stop();
        } catch {
          // Ignore cleanup errors
        }
        ciRef.current = null;
      }
      // Remove injected elements
      if (linkEl) linkEl.remove();
      if (scriptEl) scriptEl.remove();
      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  // Ctrl+Q exit shortcut (ESC is used in-game)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "q" && e.ctrlKey) {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleExit]);

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-2 right-2 z-50 px-3 py-1 text-crt-small font-mono
                   bg-black/80 border cursor-pointer hover:opacity-80"
        style={{
          color: "var(--color-crt-text)",
          borderColor: "var(--color-crt-text)",
        }}
      >
        [EXIT] Ctrl+Q
      </button>

      {/* Loading state */}
      {loading && !error && (
        <div className="flex items-center justify-center h-full">
          <pre
            className="font-mono text-crt-base"
            style={{ color: "var(--color-crt-text)" }}
          >
            {[
              "",
              "     ██████╗ ██╗   ██╗██╗  ██╗███████╗",
              "     ██╔══██╗██║   ██║██║ ██╔╝██╔════╝",
              "     ██║  ██║██║   ██║█████╔╝ █████╗  ",
              "     ██║  ██║██║   ██║██╔═██╗ ██╔══╝  ",
              "     ██████╔╝╚██████╔╝██║  ██╗███████╗",
              "     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝",
              "",
              '  "It\'s time to kick ass and chew bubblegum..."',
              "",
              "              ...and I\'m all outta gum.",
              "",
              "  Loading DOSBox emulator...",
              "  Initializing Duke Nukem 3D (Shareware)...",
              "",
            ].join("\n")}
          </pre>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center h-full">
          <pre
            className="font-mono text-crt-base"
            style={{ color: "var(--color-crt-text)" }}
          >
            {`  Error: ${error}\n\n  Click [EXIT] or press Ctrl+Q to return.`}
          </pre>
        </div>
      )}

      {/* js-dos container — always rendered so Dos() can attach to it */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: loading || error ? 0 : 1,
          zIndex: loading || error ? -1 : 0,
        }}
      />
    </div>
  );
}
