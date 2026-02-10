export interface Achievement {
  id: string;
  name: string;
  description: string;
  check: (state: AchievementState) => boolean;
}

export interface AchievementState {
  commandsUsed: Set<string>;
  easterEggsFound: Set<string>;
  themesUsed: Set<string>;
  gamesPlayed: Set<string>;
  totalCommands: number;
  filesViewed: Set<string>;
  directoriesVisited: Set<string>;
  pipeUsed: boolean;
}

export const achievements: Achievement[] = [
  {
    id: "hidden_path",
    name: "Hidden Path",
    description: "Discover a hidden dotfile",
    check: (s) => [...s.filesViewed].some((f) => f.includes("/.")),
  },
  {
    id: "pipe_dream",
    name: "Pipe Dream",
    description: "Use a pipe to chain commands",
    check: (s) => s.pipeUsed,
  },
  {
    id: "full_spectrum",
    name: "Full Spectrum",
    description: "Try every available theme",
    check: (s) => s.themesUsed.size >= 5,
  },
  {
    id: "deep_reader",
    name: "Deep Reader",
    description: "Read 8 different files",
    check: (s) => s.filesViewed.size >= 8,
  },
  {
    id: "egg_hunter",
    name: "Egg Hunter",
    description: "Discover 3 easter eggs",
    check: (s) => s.easterEggsFound.size >= 3,
  },
  {
    id: "root_access",
    name: "Root Access",
    description: "Attempt to sudo",
    check: (s) => s.easterEggsFound.has("sudo"),
  },
  {
    id: "game_on",
    name: "Game On",
    description: "Play a mini-game",
    check: (s) => s.gamesPlayed.size >= 1,
  },
  {
    id: "navigator",
    name: "Navigator",
    description: "Visit 5 different directories",
    check: (s) => s.directoriesVisited.size >= 5,
  },
  {
    id: "power_user",
    name: "Power User",
    description: "Use 15 different commands",
    check: (s) => s.commandsUsed.size >= 15,
  },
  {
    id: "glitch_lord",
    name: "Glitch Lord",
    description: "Unlock the glitch theme",
    check: (s) => s.easterEggsFound.has("rm_rf"),
  },
  {
    id: "hacker",
    name: "Hacker",
    description: "Unlock the editor",
    check: (s) =>
      s.easterEggsFound.has("editor_vim") ||
      s.easterEggsFound.has("editor_emacs") ||
      s.easterEggsFound.has("editor_nano"),
  },
  {
    id: "secret_code",
    name: "Secret Code",
    description: "Enter the Konami code",
    check: (s) => s.easterEggsFound.has("konami"),
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Unlock all other achievements",
    check: (s) => {
      return achievements
        .filter((a) => a.id !== "completionist")
        .every((a) => a.check(s));
    },
  },
];

const STORAGE_KEY = "portfolio_achievements";

export function createInitialState(): AchievementState {
  return {
    commandsUsed: new Set(),
    easterEggsFound: new Set(),
    themesUsed: new Set(),
    gamesPlayed: new Set(),
    totalCommands: 0,
    filesViewed: new Set(),
    directoriesVisited: new Set(),
    pipeUsed: false,
  };
}

export function loadAchievementState(): AchievementState {
  if (typeof window === "undefined") return createInitialState();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();

    const parsed = JSON.parse(saved);
    return {
      commandsUsed: new Set(parsed.commandsUsed || []),
      easterEggsFound: new Set(parsed.easterEggsFound || []),
      themesUsed: new Set(parsed.themesUsed || []),
      gamesPlayed: new Set(parsed.gamesPlayed || []),
      totalCommands: parsed.totalCommands || 0,
      filesViewed: new Set(parsed.filesViewed || []),
      directoriesVisited: new Set(parsed.directoriesVisited || []),
      pipeUsed: parsed.pipeUsed || false,
    };
  } catch {
    return createInitialState();
  }
}

export function saveAchievementState(state: AchievementState) {
  if (typeof window === "undefined") return;

  const serializable = {
    commandsUsed: Array.from(state.commandsUsed),
    easterEggsFound: Array.from(state.easterEggsFound),
    themesUsed: Array.from(state.themesUsed),
    gamesPlayed: Array.from(state.gamesPlayed),
    totalCommands: state.totalCommands,
    filesViewed: Array.from(state.filesViewed),
    directoriesVisited: Array.from(state.directoriesVisited),
    pipeUsed: state.pipeUsed,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function checkNewAchievements(
  prevUnlocked: Set<string>,
  state: AchievementState
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of achievements) {
    if (!prevUnlocked.has(achievement.id) && achievement.check(state)) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

export function getUnlockedAchievements(
  state: AchievementState
): Achievement[] {
  return achievements.filter((a) => a.check(state));
}

export function isFullyUnlocked(state: AchievementState): boolean {
  return achievements.every((a) => a.check(state));
}

export function formatAchievements(state: AchievementState): string {
  const lines = ["Achievements", "============", ""];
  const unlocked = getUnlockedAchievements(state);

  for (const a of achievements) {
    const isUnlocked = unlocked.some((u) => u.id === a.id);
    const icon = isUnlocked ? "[x]" : "[ ]";
    lines.push(`  ${icon} ${a.name}`);
    lines.push(`      ${a.description}`);
    lines.push("");
  }

  lines.push(`Progress: ${unlocked.length}/${achievements.length}`);

  return lines.join("\n");
}
