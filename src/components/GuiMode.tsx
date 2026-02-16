"use client";

import { useState, useEffect, useRef } from "react";
import { getResumeData } from "@/lib/resume-data";
import { themes, secretThemes, applyTheme } from "@/lib/themes";
import {
  AchievementState,
  achievements,
  getUnlockedAchievements,
} from "@/lib/achievements";
import { VirtualFS } from "@/lib/filesystem";
import { soundManager } from "@/lib/sound-manager";

type Section =
  | "about" | "experience" | "projects" | "skills" | "education" | "contact"
  | "themes" | "achievements" | "settings" | "games" | "files"
  | null;

interface GuiModeProps {
  onExit: () => void;
  currentTheme: string;
  onThemeChange: (themeName: string) => void;
  achievementState: AchievementState;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  sessionStart: number;
  onStartGame: (game: string) => void;
  fs: VirtualFS;
  allUnlocked: boolean;
  isMobile: boolean;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
}

const contentSections: { key: Section; label: string; icon: string }[] = [
  { key: "about", label: "About", icon: ">" },
  { key: "experience", label: "Experience", icon: ">" },
  { key: "projects", label: "Projects", icon: ">" },
  { key: "skills", label: "Skills", icon: ">" },
  { key: "education", label: "Education", icon: ">" },
  { key: "contact", label: "Contact", icon: ">" },
];

const funSections: { key: Section; label: string; icon: string }[] = [
  { key: "games", label: "Games", icon: "!" },
  { key: "files", label: "Files", icon: "/" },
];

const systemSections: { key: Section; label: string; icon: string }[] = [
  { key: "themes", label: "Themes", icon: "#" },
  { key: "achievements", label: "Achievements", icon: "*" },
  { key: "settings", label: "Settings", icon: "~" },
];

function ThemeButton({
  theme,
  isActive,
  onClick,
}: {
  theme: { name: string; label: string; colors: { text: string; dim: string } };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => { soundManager.guiClick(); onClick(); }}
      className={`w-full text-left text-crt-small px-2 py-1.5 mb-0.5 flex items-center gap-2 cursor-pointer transition-colors ${
        isActive
          ? "bg-[var(--color-crt-text)] text-[var(--color-crt-bg)]"
          : "hover:bg-[rgba(var(--color-crt-glow-rgb),0.1)]"
      }`}
    >
      <span
        className="inline-block w-4 h-3 border shrink-0"
        style={{
          backgroundColor: theme.colors.text,
          borderColor: theme.colors.dim,
        }}
      />
      <span className="w-16">{theme.name}</span>
      <span style={{ color: isActive ? undefined : "var(--color-crt-dim)" }}>
        {theme.label}
      </span>
    </button>
  );
}

export function GuiMode({
  onExit,
  currentTheme,
  onThemeChange,
  achievementState,
  soundEnabled,
  onSoundToggle,
  sessionStart,
  onStartGame,
  fs,
  allUnlocked: allUnlockedProp,
  isMobile,
  fontSize,
  onFontSizeChange,
}: GuiModeProps) {
  const [activeSection, setActiveSection] = useState<Section>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [fileBrowserPath, setFileBrowserPath] = useState("~");
  const [fileViewContent, setFileViewContent] = useState<{ name: string; content: string } | null>(null);
  const data = getResumeData();

  // Live clock for status bar + settings uptime
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Escape key to return to terminal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onExit]);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    if (isMobile && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeSection, isMobile]);

  // Computed values for status bar + sections
  const unlocked = getUnlockedAchievements(achievementState);
  const allUnlocked = allUnlockedProp;
  const elapsed = Math.floor((now - sessionStart) / 1000);
  const uptime =
    elapsed >= 3600
      ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
      : elapsed >= 60
        ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
        : `${elapsed}s`;

  const click = () => soundManager.guiClick();

  const handleThemeClick = (theme: { name: string }) => {
    const t = themes[theme.name] || secretThemes[theme.name];
    if (!t) return;
    applyTheme(t);
    onThemeChange(t.name);
    window.dispatchEvent(
      new CustomEvent("party-mode", {
        detail: { enabled: t.name === "party" },
      })
    );
  };

  const renderSidebarGroup = (
    items: { key: Section; label: string; icon: string }[]
  ) =>
    items.map((s) => (
      <button
        key={s.key}
        onClick={() => { click(); setActiveSection(activeSection === s.key ? null : s.key); }}
        className={`w-full text-left text-crt-small px-2 py-1.5 mb-0.5 cursor-pointer transition-colors ${
          activeSection === s.key
            ? "bg-[var(--color-crt-text)] text-[var(--color-crt-bg)]"
            : "hover:bg-[rgba(var(--color-crt-glow-rgb),0.1)]"
        }`}
      >
        {s.icon} {s.label}
      </button>
    ));

  return (
    <div className="flex flex-col h-full font-mono text-[var(--color-crt-text)] overflow-hidden">
      {/* Header */}
      <div className={`border-b border-[var(--color-crt-dim)] ${isMobile ? "px-2 py-1.5" : "p-3"} shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className={`${isMobile ? "text-crt-small" : "text-crt-base"} font-bold truncate`}>{data.name}</div>
            {!isMobile && <div className="text-crt-small" style={{ color: "var(--color-crt-dim)" }}>{data.title}</div>}
          </div>
          <button
            onClick={() => { click(); onExit(); }}
            className={`${isMobile ? "text-crt-small px-2 py-1" : "text-crt-base px-3 py-1.5"} border border-[var(--color-crt-text)] hover:bg-[var(--color-crt-text)] hover:text-[var(--color-crt-bg)] cursor-pointer terminal-glow-btn shrink-0 ml-2`}
          >
            {isMobile ? "[term]" : "[terminal]"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — horizontal scroll on mobile, vertical on desktop */}
        {isMobile ? (
          <div className="relative border-b border-[var(--color-crt-dim)] shrink-0">
            <div className="overflow-x-auto">
              <nav className="flex gap-0.5 p-1 min-w-max">
                {[...contentSections, ...funSections, ...systemSections].map((s) => (
                  <button
                    key={s.key}
                    ref={activeSection === s.key ? activeTabRef : undefined}
                    onClick={() => { click(); setActiveSection(activeSection === s.key ? null : s.key); }}
                    className={`text-crt-small px-2 py-1 whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                      activeSection === s.key
                        ? "bg-[var(--color-crt-text)] text-[var(--color-crt-bg)]"
                        : "hover:bg-[rgba(var(--color-crt-glow-rgb),0.1)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
            {/* Scroll fade indicators */}
            <div
              className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none"
              style={{ background: "linear-gradient(to right, var(--color-crt-bg), transparent)" }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-3 pointer-events-none"
              style={{ background: "linear-gradient(to left, var(--color-crt-bg), transparent)" }}
            />
          </div>
        ) : (
          <nav className="w-36 border-r border-[var(--color-crt-dim)] p-2 shrink-0 overflow-y-auto">
            {renderSidebarGroup(contentSections)}
            <div className="border-t border-[var(--color-crt-dim)] my-1.5" />
            {renderSidebarGroup(funSections)}
            <div className="border-t border-[var(--color-crt-dim)] my-1.5" />
            {renderSidebarGroup(systemSections)}
          </nav>
        )}

        {/* Content */}
        <div className={`flex-1 ${isMobile ? "p-2" : "p-3"} overflow-y-auto text-crt-small leading-relaxed`}>
          {!activeSection && (
            <div className={`flex flex-col items-center ${isMobile ? "justify-start pt-8" : "justify-center"} h-full`} style={{ color: "var(--color-crt-dim)" }}>
              <div className="text-crt-base mb-2">{data.name}</div>
              <div className="mb-4">{data.title}</div>
              <div className="text-center max-w-xs">{data.summary}</div>
              <div className="mt-4 text-crt-small">Select a section, or try Themes, Achievements, and Settings</div>
            </div>
          )}

          {activeSection === "about" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">About</h2>
              <p className="mb-2">{data.summary}</p>
              <div className="mt-2" style={{ color: "var(--color-crt-dim)" }}>
                <div>Location: {data.location}</div>
                <div>Email: {data.email}</div>
              </div>
            </div>
          )}

          {activeSection === "experience" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Experience</h2>
              {data.experience.map((exp, i) => (
                <div key={i} className="mb-3">
                  <div className="font-bold">{exp.role}</div>
                  <div style={{ color: "var(--color-crt-dim)" }}>{exp.company} | {exp.period}</div>
                  <ul className="mt-1 ml-2">
                    {exp.highlights.map((h, j) => (
                      <li key={j} className="before:content-['-_'] before:mr-0">{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeSection === "projects" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Projects</h2>
              {data.projects.map((proj, i) => (
                <div key={i} className="mb-3 p-2 border border-[var(--color-crt-dim)]">
                  <div className="font-bold">{proj.name}</div>
                  <div className="mt-1">{proj.description}</div>
                  <div className="mt-1" style={{ color: "var(--color-crt-dim)" }}>
                    {proj.tech.join(" / ")}
                  </div>
                  {proj.url && (
                    <div className="mt-1">
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        {proj.url}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === "skills" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Skills</h2>
              {data.skills.map((cat, i) => (
                <div key={i} className="mb-2">
                  <div className="font-bold" style={{ color: "var(--color-crt-dim)" }}>{cat.category}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cat.items.map((item, j) => (
                      <span
                        key={j}
                        className="px-1.5 py-0.5 border border-[var(--color-crt-dim)] text-crt-tiny"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "education" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Education</h2>
              {data.education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <div className="font-bold">{edu.degree}</div>
                  <div style={{ color: "var(--color-crt-dim)" }}>{edu.institution} ({edu.year})</div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "contact" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Contact</h2>
              <div className="space-y-1">
                <div>Email: {data.contact.email}</div>
                {data.contact.github && (
                  <div>
                    GitHub:{" "}
                    <a href={data.contact.github} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      {data.contact.github}
                    </a>
                  </div>
                )}
                {data.contact.linkedin && (
                  <div>
                    LinkedIn:{" "}
                    <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      {data.contact.linkedin}
                    </a>
                  </div>
                )}
                {data.contact.website && (
                  <div>
                    Website:{" "}
                    <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      {data.contact.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Games */}
          {activeSection === "games" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Games</h2>
              {[
                { id: "snake", name: "Snake", desc: "Classic snake game. Eat, grow, survive." },
                { id: "invaders", name: "Invaders", desc: "Defend Earth from pixel invaders." },
                { id: "breakout", name: "Breakout", desc: "Break all the blocks with your paddle." },
              ].map((game) => (
                <div key={game.id} className="mb-3 p-2 border border-[var(--color-crt-dim)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{game.name}</div>
                      <div style={{ color: "var(--color-crt-dim)" }}>{game.desc}</div>
                    </div>
                    <button
                      onClick={() => { click(); onStartGame(game.id); }}
                      className="text-crt-small px-2 py-1 border border-[var(--color-crt-text)] hover:bg-[var(--color-crt-text)] hover:text-[var(--color-crt-bg)] cursor-pointer shrink-0 ml-2"
                    >
                      [PLAY]
                    </button>
                  </div>
                </div>
              ))}
              {allUnlocked && (
                <div className="mt-2 p-2 border border-[var(--color-crt-text)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">??? Secret Game ???</div>
                      <div style={{ color: "var(--color-crt-dim)" }}>It&apos;s time to kick ass and chew bubblegum...</div>
                    </div>
                    <button
                      onClick={() => { click(); onStartGame("duke"); }}
                      className="text-crt-small px-2 py-1 border border-[var(--color-crt-text)] hover:bg-[var(--color-crt-text)] hover:text-[var(--color-crt-bg)] cursor-pointer shrink-0 ml-2"
                    >
                      [PLAY]
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Files */}
          {activeSection === "files" && (() => {
            const listing = fs.ls(fileBrowserPath, ["-a"]);
            const names = listing.split(/\s{2,}/);

            return (
              <div>
                <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Files</h2>
                <div className="mb-2 flex items-center gap-2">
                  <span style={{ color: "var(--color-crt-dim)" }}>{fileBrowserPath}/</span>
                  {fileBrowserPath !== "~" && (
                    <button
                      onClick={() => {
                        click();
                        const parts = fileBrowserPath.split("/");
                        parts.pop();
                        setFileBrowserPath(parts.join("/") || "~");
                        setFileViewContent(null);
                      }}
                      className="text-crt-small px-1.5 py-0.5 border border-[var(--color-crt-dim)] hover:border-[var(--color-crt-text)] cursor-pointer"
                    >
                      [..]
                    </button>
                  )}
                </div>
                <div className="font-mono text-crt-small space-y-0.5">
                  {names.map((entry, i) => {
                    const clean = entry.replace(/\/$/, "");
                    if (clean === "." || clean === ".." || !clean) return null;
                    const isDir = entry.endsWith("/");

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          click();
                          if (isDir) {
                            const newPath = fileBrowserPath === "~"
                              ? `~/${clean}`
                              : `${fileBrowserPath}/${clean}`;
                            setFileBrowserPath(newPath);
                            setFileViewContent(null);
                          } else {
                            const fullPath = fileBrowserPath === "~"
                              ? `~/${clean}`
                              : `${fileBrowserPath}/${clean}`;
                            setFileViewContent({
                              name: clean,
                              content: fs.cat(fullPath),
                            });
                          }
                        }}
                        className="block w-full text-left px-1 py-0.5 hover:bg-[rgba(var(--color-crt-glow-rgb),0.1)] cursor-pointer"
                      >
                        <span style={{ color: isDir ? "var(--color-crt-text)" : "var(--color-crt-dim)" }}>
                          {isDir ? "[dir] " : "      "}{clean}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {fileViewContent && (
                  <div className="mt-3 border border-[var(--color-crt-dim)] p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{fileViewContent.name}</span>
                      <button
                        onClick={() => { click(); setFileViewContent(null); }}
                        className="text-crt-small px-1 border border-[var(--color-crt-dim)] hover:border-[var(--color-crt-text)] cursor-pointer"
                      >
                        [x]
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-crt-tiny leading-relaxed" style={{ color: "var(--color-crt-dim)" }}>
                      {fileViewContent.content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Themes */}
          {activeSection === "themes" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Themes</h2>
              {Object.values(themes).map((theme) => (
                <ThemeButton
                  key={theme.name}
                  theme={theme}
                  isActive={currentTheme === theme.name}
                  onClick={() => handleThemeClick(theme)}
                />
              ))}
              {allUnlocked && (
                <>
                  <div className="mt-3 mb-1" style={{ color: "var(--color-crt-dim)" }}>
                    Secret themes (100% completion):
                  </div>
                  {Object.values(secretThemes).map((theme) => (
                    <ThemeButton
                      key={theme.name}
                      theme={theme}
                      isActive={currentTheme === theme.name}
                      onClick={() => handleThemeClick(theme)}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Achievements */}
          {activeSection === "achievements" && (() => {
            const unlockedIds = new Set(unlocked.map((a) => a.id));
            const total = achievements.length;
            const count = unlocked.length;
            const barLen = 10;
            const filled = Math.round((count / total) * barLen);
            const progressBar = "#".repeat(filled) + "-".repeat(barLen - filled);

            return (
              <div>
                <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Achievements</h2>
                <div className="mb-3">
                  <span>Progress: {count}/{total} </span>
                  <span style={{ color: "var(--color-crt-dim)" }}>[{progressBar}]</span>
                </div>
                {achievements.map((a) => {
                  const isUnlocked = unlockedIds.has(a.id);
                  return (
                    <div key={a.id} className="mb-2">
                      <div className={isUnlocked ? "" : "opacity-50"}>
                        <span>{isUnlocked ? "[x]" : "[ ]"} </span>
                        <span className="font-bold">{a.name}</span>
                      </div>
                      <div className="ml-6" style={{ color: "var(--color-crt-dim)" }}>
                        {a.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Settings */}
          {activeSection === "settings" && (
            <div>
              <h2 className="text-crt-base font-bold mb-2 border-b border-[var(--color-crt-dim)] pb-1">Settings</h2>

              <div className="mb-4">
                <div className="font-bold mb-1">Sound Effects</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { click(); onSoundToggle(); }}
                    className="text-crt-small px-2 py-1 border border-[var(--color-crt-dim)] hover:border-[var(--color-crt-text)] cursor-pointer transition-colors"
                  >
                    {soundEnabled ? "[ON ]" : "[OFF]"}
                  </button>
                  <span style={{ color: "var(--color-crt-dim)" }}>
                    {soundEnabled ? "CRT hum + key sounds" : "Silent mode"}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="font-bold mb-1">Text Size</div>
                <div className="flex items-center gap-1">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => { click(); onFontSizeChange(size); }}
                      className={`text-crt-small px-2 py-1 border cursor-pointer transition-colors ${
                        fontSize === size
                          ? "bg-[var(--color-crt-text)] text-[var(--color-crt-bg)] border-[var(--color-crt-text)]"
                          : "border-[var(--color-crt-dim)] hover:border-[var(--color-crt-text)]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="font-bold mb-1">System</div>
                <div style={{ color: "var(--color-crt-dim)" }}>
                  <div>Theme: {currentTheme}</div>
                  <div>Session: {uptime}</div>
                </div>
              </div>

              <div>
                <div className="font-bold mb-1">Keyboard</div>
                <div style={{ color: "var(--color-crt-dim)" }}>
                  <div>Esc &mdash; Return to terminal</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-[var(--color-crt-dim)] px-2 sm:px-3 py-1 shrink-0 flex justify-between text-crt-tiny" style={{ color: "var(--color-crt-dim)" }}>
        <div className="flex gap-2 sm:gap-3 overflow-hidden">
          {!isMobile && <span>Theme: {currentTheme}</span>}
          <span>{soundEnabled ? "SND" : "MUTE"}</span>
          <span>{uptime}</span>
          <span>{unlocked.length}/{achievements.length}</span>
        </div>
        <div className="shrink-0">
          {new Date(now).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            ...(isMobile ? {} : { second: "2-digit" }),
          })}
        </div>
      </div>
    </div>
  );
}
