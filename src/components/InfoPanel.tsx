"use client";

import { useState, useEffect } from "react";
import { VirtualFS } from "@/lib/filesystem";
import {
  AchievementState,
  achievements,
  getUnlockedAchievements,
} from "@/lib/achievements";

interface InfoPanelProps {
  fs: VirtualFS;
  achievementState: AchievementState;
  themeName: string;
  soundEnabled: boolean;
  sessionStart: number;
}

export function InfoPanel({
  fs,
  achievementState,
  themeName,
  soundEnabled,
  sessionStart,
}: InfoPanelProps) {
  // Force re-render every second for uptime + clock
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const unlocked = getUnlockedAchievements(achievementState);
  const elapsed = Math.floor((now - sessionStart) / 1000);
  const uptime =
    elapsed >= 3600
      ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
      : elapsed >= 60
        ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
        : `${elapsed}s`;

  const currentPath = fs.pwd();
  const dirListing = fs
    .ls(undefined, [])
    .split("  ")
    .filter(Boolean);

  return (
    <div className="w-48 border-l border-[var(--color-crt-dim)] p-3 overflow-y-auto terminal-text-dim text-xs font-mono flex flex-col gap-3 shrink-0">
      <section>
        <div className="terminal-text text-xs mb-1">{"[ System ]"}</div>
        <div>Theme: {themeName}</div>
        <div>Sound: {soundEnabled ? "On" : "Off"}</div>
        <div>Uptime: {uptime}</div>
      </section>

      <section>
        <div className="terminal-text text-xs mb-1 truncate">
          {"[ "}{currentPath}{" ]"}
        </div>
        {dirListing.slice(0, 10).map((item, i) => (
          <div key={i} className="truncate">
            {item}
          </div>
        ))}
        {dirListing.length > 10 && (
          <div className="opacity-50">...+{dirListing.length - 10} more</div>
        )}
      </section>

      <section>
        <div className="terminal-text text-xs mb-1">{"[ Progress ]"}</div>
        <div className="mb-1">
          {unlocked.length}/{achievements.length}
        </div>
        <div className="leading-relaxed">
          {achievements.map((a) => (
            <span
              key={a.id}
              title={`${a.name}: ${a.description}`}
            >
              {unlocked.some((u) => u.id === a.id) ? "■ " : "□ "}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-auto text-right">
        <div className="terminal-text text-xs">
          {new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </section>
    </div>
  );
}
