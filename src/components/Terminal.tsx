"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TerminalOutput, OutputLine } from "./TerminalOutput";
import { TerminalInput } from "./TerminalInput";
import { SnakeGame } from "./SnakeGame";
import { InvadersGame } from "./InvadersGame";
import { BreakoutGame } from "./BreakoutGame";
import { GuiMode } from "./GuiMode";
import { InfoPanel } from "./InfoPanel";
import {
  executeCommand,
  getCommandSuggestions,
  CommandContext,
  Suggestion,
} from "@/lib/commands";
import { bootSequence } from "@/lib/boot-sequence";
import { VirtualFS } from "@/lib/filesystem";
import { loadSavedTheme, applyTheme } from "@/lib/themes";
import { soundManager } from "@/lib/sound-manager";
import {
  AchievementState,
  loadAchievementState,
  saveAchievementState,
  checkNewAchievements,
  getUnlockedAchievements,
} from "@/lib/achievements";
import { KonamiTracker } from "@/lib/easter-eggs";
import {
  hasCelebrationBeenShown,
  markCelebrationShown,
  getCelebrationSequence,
} from "@/lib/celebration";

let idCounter = Date.now();
function uid() {
  return `line-${++idCounter}`;
}

export function Terminal() {
  const [history, setHistory] = useState<OutputLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [mode, setMode] = useState<"command" | "chat">("command");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // New feature state
  const [gameMode, setGameMode] = useState<"snake" | "invaders" | "breakout" | null>(null);
  const [guiMode, setGuiMode] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("amber");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [achievementState, setAchievementState] = useState<AchievementState>(
    () => loadAchievementState()
  );

  // Confirmation state
  const [pendingConfirm, setPendingConfirm] = useState<"reset" | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const fsRef = useRef<VirtualFS>(new VirtualFS());
  const sessionStartRef = useRef(Date.now());
  const konamiRef = useRef(new KonamiTracker());
  const achievementStateRef = useRef(achievementState);
  achievementStateRef.current = achievementState;
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  // Load saved theme on mount
  useEffect(() => {
    const saved = loadSavedTheme();
    setCurrentTheme(saved.name);
    applyTheme(saved);
  }, []);

  // Disco mode: cycle CSS text/glow colors when toggled
  useEffect(() => {
    let active = false;
    let rafId: number;

    const toggle = () => {
      active = !active;
      if (active) {
        const cycle = () => {
          if (!active) return;
          const hue = (performance.now() * 0.5) % 360;
          const color = `hsl(${hue}, 100%, 50%)`;
          // Convert HSL to RGB for the glow-rgb var
          const el = document.createElement("canvas").getContext("2d")!;
          el.fillStyle = color;
          const hex = el.fillStyle; // browser normalizes to #rrggbb
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const root = document.documentElement;
          root.style.setProperty("--color-crt-text", color);
          root.style.setProperty("--color-crt-glow", color);
          root.style.setProperty("--color-crt-glow-rgb", `${r}, ${g}, ${b}`);
          root.style.setProperty("--color-crt-dim", color);
          rafId = requestAnimationFrame(cycle);
        };
        cycle();
      } else {
        cancelAnimationFrame(rafId);
        // Restore current theme colors
        const saved = loadSavedTheme();
        applyTheme(saved);
      }
    };

    window.addEventListener("disco-mode-toggle", toggle);
    return () => {
      window.removeEventListener("disco-mode-toggle", toggle);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Initialize previously-unlocked achievements on mount
  useEffect(() => {
    const state = loadAchievementState();
    const unlocked = getUnlockedAchievements(state);
    prevUnlockedRef.current = new Set(unlocked.map((a) => a.id));
  }, []);

  // Detect newly unlocked achievements and show notifications
  useEffect(() => {
    const newlyUnlocked = checkNewAchievements(
      prevUnlockedRef.current,
      achievementState
    );

    if (newlyUnlocked.length > 0) {
      for (const achievement of newlyUnlocked) {
        prevUnlockedRef.current.add(achievement.id);

        setHistory((prev) => [
          ...prev,
          {
            id: uid(),
            content: `\n  ★ Achievement Unlocked: ${achievement.name}\n    ${achievement.description}\n`,
            type: "system",
            animate: false,
          },
        ]);

        soundManager.achievement();

        if (achievement.id === "completionist") {
          triggerCompletionCelebration();
        }
      }
    }
  }, [achievementState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Grand celebration when all achievements unlocked (one-time)
  const triggerCompletionCelebration = useCallback(() => {
    if (hasCelebrationBeenShown()) return;
    markCelebrationShown();

    // CRT static effect
    window.dispatchEvent(
      new CustomEvent("crt-celebration", { detail: { phase: "start" } })
    );

    // End CRT static after 1.2s
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("crt-celebration", { detail: { phase: "end" } })
      );
    }, 1200);

    const elapsed = Math.floor(
      (Date.now() - sessionStartRef.current) / 1000
    );
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const sequence = getCelebrationSequence(timeStr);

    // Stagger the celebration messages
    let delay = 1500;
    for (const text of sequence) {
      setTimeout(() => {
        setHistory((prev) => [
          ...prev,
          {
            id: uid(),
            content: text,
            type: "system",
            animate: false,
          },
        ]);
      }, delay);
      delay += 1500;
    }
  }, []);

  // Always keep input focused
  useEffect(() => {
    if (gameMode) return; // Don't steal focus during games

    const focusInput = () => {
      const input = containerRef.current?.querySelector("input");
      if (input) input.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Konami code tracking
      if (konamiRef.current.handleKey(e.key)) {
        triggerKonami();
      }

      focusInput();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", focusInput);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", focusInput);
    };
  }, [gameMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Boot sequence
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (
        typeof window !== "undefined" &&
        sessionStorage.getItem("hasBooted")
      ) {
        setHistory([
          {
            id: uid(),
            content: 'System ready. Type "help" to see available commands.',
            type: "system",
            animate: false,
          },
        ]);
        setIsBooting(false);
        return;
      }

      for (const msg of bootSequence) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, msg.delay));
        if (cancelled) return;

        setHistory((prev) => [
          ...prev,
          {
            id: uid(),
            content: msg.text,
            type: "system",
            animate: msg.typeSpeed > 0,
          },
        ]);

        if (msg.typeSpeed > 0) {
          setIsTyping(true);
          const duration = msg.text.length * msg.typeSpeed + 200;
          await new Promise((r) => setTimeout(r, duration));
          if (cancelled) return;
          setIsTyping(false);
        }
      }

      if (!cancelled) {
        setIsBooting(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hasBooted", "true");
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // Achievement tracking — silent, no history injection
  const updateAchievements = useCallback(
    (updater: (state: AchievementState) => AchievementState) => {
      setAchievementState((prev) => {
        const next = updater(prev);
        saveAchievementState(next);
        return next;
      });
    },
    []
  );

  const trackCommand = useCallback(
    (cmdName: string) => {
      updateAchievements((s) => ({
        ...s,
        commandsUsed: new Set(s.commandsUsed).add(cmdName),
        totalCommands: s.totalCommands + 1,
      }));
    },
    [updateAchievements]
  );

  const trackEasterEgg = useCallback(
    (eggId: string) => {
      updateAchievements((s) => ({
        ...s,
        easterEggsFound: new Set(s.easterEggsFound).add(eggId),
      }));
    },
    [updateAchievements]
  );

  const trackDirectory = useCallback(
    (path: string) => {
      updateAchievements((s) => ({
        ...s,
        directoriesVisited: new Set(s.directoriesVisited).add(path),
      }));
    },
    [updateAchievements]
  );

  const trackFile = useCallback(
    (path: string) => {
      updateAchievements((s) => ({
        ...s,
        filesViewed: new Set(s.filesViewed).add(path),
      }));
    },
    [updateAchievements]
  );

  const trackTheme = useCallback(
    (theme: string) => {
      updateAchievements((s) => ({
        ...s,
        themesUsed: new Set(s.themesUsed).add(theme),
      }));
    },
    [updateAchievements]
  );

  const trackGame = useCallback(
    (game: string) => {
      updateAchievements((s) => ({
        ...s,
        gamesPlayed: new Set(s.gamesPlayed).add(game),
      }));
    },
    [updateAchievements]
  );

  const triggerKonami = useCallback(() => {
    trackEasterEgg("konami");
    setHistory((prev) => [
      ...prev,
      {
        id: uid(),
        content: [
          "",
          "  +-------------------------------+",
          "  |    KONAMI CODE ACTIVATED!      |",
          "  |                               |",
          "  |  +30 lives... just kidding.   |",
          "  |  But you found a secret!      |",
          "  +-------------------------------+",
          "",
        ].join("\n"),
        type: "system",
        animate: false,
      },
    ]);
  }, [trackEasterEgg]);

  const handleTypingComplete = useCallback(() => {
    setIsTyping(false);
    skipRef.current = null;
    setHistory((prev) =>
      prev.map((line) =>
        line.animate ? { ...line, animate: false } : line
      )
    );
  }, []);

  const handleSkip = useCallback(() => {
    if (!isTyping) return;
    setHistory((prev) => prev.map((line) => ({ ...line, animate: false })));
    setIsTyping(false);
  }, [isTyping]);

  const handleSubmit = useCallback(
    (input: string) => {
      if (isBooting) return;

      // If still animating, skip the animation first then process
      if (isTyping) {
        handleSkip();
      }
      const trimmed = input.trim();
      if (!trimmed) return;

      // Close autocomplete
      setShowAutocomplete(false);
      setSuggestions([]);

      // Sound effect
      soundManager.enter();

      // Handle pending confirmation
      if (pendingConfirm === "reset") {
        setPendingConfirm(null);
        setHistory((prev) => [
          ...prev,
          { id: uid(), content: `> ${trimmed}`, type: "input", animate: false },
        ]);
        if (trimmed.toLowerCase() === "y") {
          localStorage.removeItem("portfolio_achievements");
          localStorage.removeItem("portfolio_celebration_shown");
          const freshState: AchievementState = {
            commandsUsed: new Set(),
            easterEggsFound: new Set(),
            themesUsed: new Set(),
            gamesPlayed: new Set(),
            totalCommands: 0,
            filesViewed: new Set(),
            directoriesVisited: new Set(),
            pipeUsed: false,
          };
          setAchievementState(freshState);
          saveAchievementState(freshState);
          prevUnlockedRef.current = new Set();
          setHistory((prev) => [
            ...prev,
            { id: uid(), content: "  All progress has been reset. Achievements cleared.", type: "system", animate: false },
          ]);
        } else {
          setHistory((prev) => [
            ...prev,
            { id: uid(), content: "  Reset cancelled.", type: "system", animate: false },
          ]);
        }
        setInputValue("");
        return;
      }

      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex((prev) => prev + 1);

      // Echo the command
      const promptPath = fsRef.current.getPromptPath();
      setHistory((prev) => [
        ...prev,
        {
          id: uid(),
          content: `visitor@portfolio:${promptPath}$ ${trimmed}`,
          type: "input",
          animate: false,
        },
      ]);

      // Build command context
      const context: CommandContext = {
        fs: fsRef.current,
        achievementState: achievementStateRef.current,
        sessionStart: sessionStartRef.current,
        currentTheme,
        onThemeChange: (name: string) => {
          setCurrentTheme(name);
          trackTheme(name);
        },
        commandHistory,
        soundEnabled,
        onSoundToggle: () => {
          const enabled = !soundManager.muted;
          setSoundEnabled(enabled);
          return enabled;
        },
        trackEasterEgg,
      };

      const result = executeCommand(trimmed, context);

      // Track the command for achievements
      const cmdName = trimmed.split(/\s+/)[0].toLowerCase();
      trackCommand(cmdName);

      // Track filesystem activity
      if (cmdName === "cd") {
        trackDirectory(fsRef.current.pwd());
      }
      if (cmdName === "cat" && trimmed.split(/\s+/)[1]) {
        const arg = trimmed.split(/\s+/)[1];
        const cwd = fsRef.current.pwd();
        const fullPath = arg.startsWith("~") ? arg : `${cwd}/${arg}`;
        trackFile(fullPath);
      }
      if (trimmed.includes("|")) {
        updateAchievements((s) => ({ ...s, pipeUsed: true }));
      }

      if (result.clearScreen) {
        setHistory([]);
        setInputValue("");
        return;
      }

      if (result.switchMode) {
        setMode(result.switchMode);
      }

      if (result.startGame) {
        setGameMode(result.startGame);
        trackGame(result.startGame);
        setInputValue("");
        return;
      }

      if (result.startGui) {
        setGuiMode(true);
        setInputValue("");
        return;
      }

      if (result.togglePanel) {
        setShowPanel((p) => !p);
        setInputValue("");
        return;
      }

      if (result.confirmReset) {
        setPendingConfirm("reset");
      }

      if (result.unlockAll) {
        updateAchievements(() => ({
          commandsUsed: new Set([
            "help", "ls", "cd", "cat", "pwd", "tree", "about",
            "experience", "skills", "projects", "contact", "theme",
            "neofetch", "history", "achievements",
          ]),
          easterEggsFound: new Set(["sudo", "rm_rf", "exit", "cowsay"]),
          themesUsed: new Set(["amber", "green", "blue", "matrix", "dracula"]),
          gamesPlayed: new Set(["snake"]),
          totalCommands: 50,
          filesViewed: new Set([
            "~/.bashrc", "~/.vimrc", "~/about.txt", "~/contact.txt",
            "~/projects/terminal-portfolio/README.md", "~/projects/cloud-dashboard/README.md",
            "~/projects/cli-task-manager/README.md", "~/experience/acme-corp.txt",
          ]),
          directoriesVisited: new Set([
            "~", "~/projects", "~/experience", "~/skills", "~/education",
          ]),
          pipeUsed: true,
        }));
      }

      if (result.output) {
        setHistory((prev) => [
          ...prev,
          {
            id: uid(),
            content: result.output,
            type: result.type,
            animate: true,
          },
        ]);
        setIsTyping(true);
      }

      setInputValue("");
    },
    [
      isTyping,
      isBooting,
      handleSkip,
      pendingConfirm,
      currentTheme,
      commandHistory,
      soundEnabled,
      trackCommand,
      trackDirectory,
      trackFile,
      trackTheme,
      trackGame,
      trackEasterEgg,
    ]
  );


  const handleHistoryUp = useCallback(() => {
    if (commandHistory.length === 0) return;
    setShowAutocomplete(false);
    const newIndex = Math.max(0, historyIndex - 1);
    setHistoryIndex(newIndex);
    setInputValue(commandHistory[newIndex] || "");
  }, [commandHistory, historyIndex]);

  const handleHistoryDown = useCallback(() => {
    if (commandHistory.length === 0) return;
    setShowAutocomplete(false);
    const newIndex = Math.min(commandHistory.length, historyIndex + 1);
    setHistoryIndex(newIndex);
    setInputValue(
      newIndex < commandHistory.length ? commandHistory[newIndex] : ""
    );
  }, [commandHistory, historyIndex]);

  // Autocomplete handlers
  const handleTab = useCallback(() => {
    if (isBooting) return;

    const sug = getCommandSuggestions(inputValue, fsRef.current, achievementStateRef.current);

    if (sug.length === 1) {
      // Single match — auto-fill
      const parts = inputValue.trim().split(/\s+/);
      if (parts.length <= 1) {
        setInputValue(sug[0].name + " ");
      } else {
        parts[parts.length - 1] = sug[0].name;
        setInputValue(parts.join(" ") + (sug[0].name.endsWith("/") ? "" : " "));
      }
      setShowAutocomplete(false);
    } else if (sug.length > 1) {
      setSuggestions(sug);
      setSelectedSuggestion(0);
      setShowAutocomplete(true);
    }
  }, [inputValue, isTyping, isBooting]);

  const handleAutocompleteNav = useCallback(
    (direction: "up" | "down") => {
      if (!showAutocomplete || suggestions.length === 0) return;
      setSelectedSuggestion((prev) => {
        if (direction === "up")
          return prev <= 0 ? suggestions.length - 1 : prev - 1;
        return prev >= suggestions.length - 1 ? 0 : prev + 1;
      });
    },
    [showAutocomplete, suggestions]
  );

  const handleAutocompleteSelect = useCallback(() => {
    if (!showAutocomplete || suggestions.length === 0) return;
    const selected = suggestions[selectedSuggestion];
    if (!selected) return;

    const parts = inputValue.trim().split(/\s+/);
    if (parts.length <= 1) {
      setInputValue(selected.name + " ");
    } else {
      parts[parts.length - 1] = selected.name;
      setInputValue(parts.join(" ") + (selected.name.endsWith("/") ? "" : " "));
    }
    setShowAutocomplete(false);
  }, [showAutocomplete, suggestions, selectedSuggestion, inputValue]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setShowAutocomplete(false);
      soundManager.keypress();
    },
    []
  );

  const handleEscape = useCallback(() => {
    setShowAutocomplete(false);
  }, []);

  // Game exit handler (snake)
  const handleGameExit = useCallback(
    (score: number) => {
      setGameMode(null);
      soundManager.gameOver();
      setHistory((prev) => [
        ...prev,
        {
          id: uid(),
          content: `  Game over! Final score: ${score}`,
          type: "system",
          animate: false,
        },
      ]);
    },
    []
  );

  // Render games
  if (gameMode) {
    const GameComponent = {
      snake: SnakeGame,
      invaders: InvadersGame,
      breakout: BreakoutGame,
    }[gameMode];

    return (
      <div ref={containerRef} className="flex flex-col h-full font-mono">
        <GameComponent onExit={handleGameExit} />
      </div>
    );
  }

  // Render GUI mode
  if (guiMode) {
    return (
      <div ref={containerRef} className="flex flex-col h-full font-mono">
        <GuiMode
          onExit={() => setGuiMode(false)}
          currentTheme={currentTheme}
          onThemeChange={(name: string) => {
            setCurrentTheme(name);
            trackTheme(name);
          }}
          achievementState={achievementState}
          soundEnabled={soundEnabled}
          onSoundToggle={() => {
            setSoundEnabled(soundManager.toggle());
          }}
          sessionStart={sessionStartRef.current}
        />
      </div>
    );
  }

  const currentPath = fsRef.current.getPromptPath();

  return (
    <div ref={containerRef} className="flex h-full font-mono">
      <div className="flex flex-col flex-1 min-w-0">
        <TerminalOutput
          lines={history}
          onTypingComplete={handleTypingComplete}
          onSkip={handleSkip}
        />
        <TerminalInput
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onHistoryUp={handleHistoryUp}
          onHistoryDown={handleHistoryDown}
          onTab={handleTab}
          onAutocompleteNav={handleAutocompleteNav}
          onAutocompleteSelect={handleAutocompleteSelect}
          onEscape={handleEscape}
          disabled={isBooting}
          mode={mode}
          currentPath={currentPath}
          suggestions={suggestions}
          selectedSuggestion={selectedSuggestion}
          showAutocomplete={showAutocomplete}
        />
      </div>
      {showPanel && (
        <InfoPanel
          fs={fsRef.current}
          achievementState={achievementState}
          themeName={currentTheme}
          soundEnabled={soundEnabled}
          sessionStart={sessionStartRef.current}
        />
      )}
    </div>
  );
}
