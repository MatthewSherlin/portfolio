import { getResumeData } from "./resume-data";
import { VirtualFS } from "./filesystem";
import {
  themes,
  secretThemes,
  getTheme,
  getThemeNames,
  applyTheme,
} from "./themes";
import { parsePipeline, applyFilter } from "./pipe-system";
import { generateNeofetch } from "./neofetch";
import { handleEasterEgg } from "./easter-eggs";
import { AchievementState, formatAchievements, isFullyUnlocked } from "./achievements";
import { soundManager } from "./sound-manager";

export interface CommandResult {
  output: string;
  type: "output" | "error" | "system";
  clearScreen?: boolean;
  switchMode?: "command" | "chat";
  startGame?: "snake" | "invaders" | "breakout";
  startGui?: boolean;
  togglePanel?: boolean;
  unlockAll?: boolean;
  resetTerminal?: boolean;
  confirmReset?: boolean;
}

export interface CommandContext {
  fs: VirtualFS;
  achievementState: AchievementState;
  sessionStart: number;
  currentTheme: string;
  onThemeChange: (name: string) => void;
  commandHistory: string[];
  soundEnabled: boolean;
  onSoundToggle: () => boolean;
  trackEasterEgg: (id: string) => void;
}

interface CommandDefinition {
  name: string;
  description: string;
  category: "nav" | "info" | "system" | "fun";
  aliases?: string[];
  secret?: boolean;
  handler: (args: string[], ctx: CommandContext) => CommandResult;
}

const commands = new Map<string, CommandDefinition>();

function register(cmd: CommandDefinition) {
  commands.set(cmd.name, cmd);
  cmd.aliases?.forEach((alias) => commands.set(alias, cmd));
}

export function executeCommand(
  rawInput: string,
  context: CommandContext
): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { output: "", type: "output" };

  // Handle mode switches
  if (trimmed === "/chat") {
    return {
      output:
        "Entering chat mode. Ask me anything about Matt.\n(Type /command to switch back)\n\nNote: AI chat is coming soon. For now, use commands.",
      type: "system",
      switchMode: "chat",
    };
  }
  if (trimmed === "/command") {
    return {
      output: 'Returning to command mode. Type "help" for available commands.',
      type: "system",
      switchMode: "command",
    };
  }

  // Parse pipeline
  const pipeline = parsePipeline(trimmed);

  if (pipeline.length === 1) {
    return executeSingle(pipeline[0], context);
  }

  // Execute first command, pipe through filters
  const result = executeSingle(pipeline[0], context);
  if (result.type === "error") return result;

  let piped = { text: result.output };
  for (let i = 1; i < pipeline.length; i++) {
    piped = applyFilter(pipeline[i], piped);
  }

  return { ...result, output: piped.text };
}

function executeSingle(
  input: string,
  ctx: CommandContext
): CommandResult {
  const parts = input.split(/\s+/);
  const name = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Check easter eggs first
  const egg = handleEasterEgg(name, args);
  if (egg) {
    ctx.trackEasterEgg(egg.eggId);
    return { output: egg.output, type: "output" };
  }

  const cmd = commands.get(name);
  if (!cmd) {
    return {
      output: `Command not found: ${name}. Type "help" for available commands.`,
      type: "error",
    };
  }

  return cmd.handler(args, ctx);
}

// --- Exported helpers for autocomplete ---

export interface Suggestion {
  name: string;
  description: string;
}

export function getCommandSuggestions(
  input: string,
  fs: VirtualFS,
  achievementState?: AchievementState
): Suggestion[] {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const unlocked = achievementState ? isFullyUnlocked(achievementState) : false;

  if (parts.length <= 1) {
    const prefix = parts[0]?.toLowerCase() || "";
    const seen = new Set<string>();
    const suggestions: Suggestion[] = [];

    commands.forEach((cmd) => {
      if (seen.has(cmd.name)) return;
      seen.add(cmd.name);
      if (cmd.secret && !unlocked) return;
      if (cmd.name.startsWith(prefix)) {
        suggestions.push({ name: cmd.name, description: cmd.description });
      }
    });

    // Add discoverable easter egg commands
    const easterCmds: Suggestion[] = [
      { name: "cowsay", description: "Moo!" },
      { name: "whoami", description: "Who are you?" },
      { name: "ping", description: "Ping a host" },
      { name: "date", description: "Current date/time" },
      { name: "exit", description: "Try to leave" },
    ];
    for (const ec of easterCmds) {
      if (ec.name.startsWith(prefix) && !seen.has(ec.name)) {
        suggestions.push(ec);
        seen.add(ec.name);
      }
    }

    return suggestions.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Complete filesystem paths
  const cmd = parts[0].toLowerCase();
  if (["cd", "ls", "cat", "tree"].includes(cmd)) {
    const partial = parts[parts.length - 1] || "";
    const completions = fs.getCompletions(partial);
    return completions.map((c) => ({
      name: c.name + (c.isDir ? "/" : ""),
      description: c.isDir ? "directory" : "file",
    }));
  }

  // Complete theme names
  if (cmd === "theme") {
    const prefix = (parts[1] || "").toLowerCase();
    return getThemeNames(unlocked)
      .filter((n) => n.startsWith(prefix))
      .map((n) => ({
        name: n,
        description: (themes[n] || secretThemes[n])?.label || n,
      }));
  }

  return [];
}

// ==========================================================
// COMMAND REGISTRATIONS
// ==========================================================

// --- Navigation ---

register({
  name: "cd",
  description: "Change directory",
  category: "nav",
  handler: (args, ctx) => {
    const error = ctx.fs.cd(args[0] || "~");
    if (error) return { output: error, type: "error" };
    return { output: ctx.fs.pwd(), type: "output" };
  },
});

register({
  name: "ls",
  description: "List directory contents",
  category: "nav",
  handler: (args, ctx) => {
    const flags: string[] = [];
    const paths: string[] = [];
    for (const a of args) {
      if (a.startsWith("-")) flags.push(a);
      else paths.push(a);
    }
    return { output: ctx.fs.ls(paths[0], flags), type: "output" };
  },
});

register({
  name: "cat",
  description: "View file contents",
  category: "nav",
  handler: (args, ctx) => {
    if (!args[0])
      return { output: "cat: missing file operand", type: "error" };
    const content = ctx.fs.cat(args[0]);
    if (content.startsWith("cat:")) return { output: content, type: "error" };
    return { output: content, type: "output" };
  },
});

register({
  name: "pwd",
  description: "Print working directory",
  category: "nav",
  handler: (_args, ctx) => ({ output: ctx.fs.pwd(), type: "output" }),
});

register({
  name: "tree",
  description: "Show directory tree",
  category: "nav",
  handler: (args, ctx) => ({
    output: ctx.fs.tree(args[0]),
    type: "output",
  }),
});

// --- Info ---

register({
  name: "about",
  description: "About me",
  category: "info",
  handler: () => {
    const d = getResumeData();
    return {
      output: [
        d.name,
        "=".repeat(d.name.length),
        "",
        d.title,
        "",
        d.summary,
        "",
        `Location: ${d.location}`,
        `Email:    ${d.email}`,
      ].join("\n"),
      type: "output",
    };
  },
});

register({
  name: "experience",
  aliases: ["exp", "work"],
  description: "Work experience",
  category: "info",
  handler: () => {
    const d = getResumeData();
    const lines = ["Experience", "==========", ""];
    d.experience.forEach((e) => {
      lines.push(`${e.role} @ ${e.company}`);
      lines.push(`${e.period}`);
      e.highlights.forEach((h) => lines.push(`  - ${h}`));
      lines.push("");
    });
    return { output: lines.join("\n"), type: "output" };
  },
});

register({
  name: "projects",
  description: "Notable projects",
  category: "info",
  handler: () => {
    const d = getResumeData();
    const lines = ["Projects", "========", ""];
    d.projects.forEach((p, i) => {
      lines.push(`[${i + 1}] ${p.name}`);
      lines.push(`    ${p.description}`);
      lines.push(`    Tech: ${p.tech.join(", ")}`);
      if (p.url) lines.push(`    URL:  ${p.url}`);
      lines.push("");
    });
    return { output: lines.join("\n"), type: "output" };
  },
});

register({
  name: "skills",
  description: "Technical skills",
  category: "info",
  handler: () => {
    const d = getResumeData();
    const lines = ["Skills", "======", ""];
    d.skills.forEach((s) => {
      lines.push(`${s.category}:`);
      lines.push(`  ${s.items.join(", ")}`);
      lines.push("");
    });
    return { output: lines.join("\n"), type: "output" };
  },
});

register({
  name: "education",
  aliases: ["edu"],
  description: "Education",
  category: "info",
  handler: () => {
    const d = getResumeData();
    const lines = ["Education", "=========", ""];
    d.education.forEach((e) => {
      lines.push(`${e.degree}`);
      lines.push(`${e.institution} (${e.year})`);
      lines.push("");
    });
    return { output: lines.join("\n"), type: "output" };
  },
});

register({
  name: "contact",
  description: "Contact information",
  category: "info",
  handler: () => {
    const d = getResumeData();
    const lines = ["Contact", "=======", ""];
    lines.push(`Email:    ${d.contact.email}`);
    if (d.contact.github) lines.push(`GitHub:   ${d.contact.github}`);
    if (d.contact.linkedin) lines.push(`LinkedIn: ${d.contact.linkedin}`);
    if (d.contact.website) lines.push(`Website:  ${d.contact.website}`);
    lines.push("");
    return { output: lines.join("\n"), type: "output" };
  },
});

// --- System ---

register({
  name: "help",
  description: "Show available commands",
  category: "system",
  handler: (_args, ctx) => {
    const allUnlocked = isFullyUnlocked(ctx.achievementState);
    const sections: Record<string, string[]> = {
      Navigation: [],
      Info: [],
      System: [],
      Fun: [],
    };
    if (allUnlocked) {
      sections["Secret (100%)"] = [];
    }
    const catMap: Record<string, string> = {
      nav: "Navigation",
      info: "Info",
      system: "System",
      fun: "Fun",
    };

    const seen = new Set<string>();
    commands.forEach((cmd) => {
      if (seen.has(cmd.name)) return;
      seen.add(cmd.name);
      if (cmd.secret && !allUnlocked) return;
      const section = cmd.secret
        ? "Secret (100%)"
        : catMap[cmd.category] || "System";
      const aliases = cmd.aliases?.length
        ? ` (${cmd.aliases.join(", ")})`
        : "";
      sections[section].push(
        `  ${cmd.name.padEnd(16)} ${cmd.description}${aliases}`
      );
    });

    const lines = ["Available commands:", ""];
    for (const [title, cmds] of Object.entries(sections)) {
      if (cmds.length === 0) continue;
      lines.push(`  ${title}:`);
      lines.push(...cmds);
      lines.push("");
    }

    lines.push("Tips:");
    lines.push("  Use Tab for autocomplete");
    lines.push("  Use Up/Down for command history");
    lines.push("  Try pipes: skills | grep Python");
    lines.push("  Explore the filesystem: cd ~/projects");

    return { output: lines.join("\n"), type: "output" };
  },
});

register({
  name: "clear",
  aliases: ["cls"],
  description: "Clear the terminal",
  category: "system",
  handler: () => ({ output: "", type: "output", clearScreen: true }),
});

register({
  name: "theme",
  description: "Change color theme",
  category: "system",
  handler: (args, ctx) => {
    const allUnlocked = isFullyUnlocked(ctx.achievementState);

    if (!args[0] || args[0] === "--list") {
      const lines = ["Available themes:", ""];
      for (const name of getThemeNames()) {
        const t = themes[name];
        const current = name === ctx.currentTheme ? " (active)" : "";
        lines.push(`  ${name.padEnd(12)} ${t.label}${current}`);
      }
      if (allUnlocked) {
        lines.push("");
        lines.push("  Secret themes (100% completion):");
        for (const name of Object.keys(secretThemes)) {
          const t = secretThemes[name];
          const current = name === ctx.currentTheme ? " (active)" : "";
          lines.push(`  ${name.padEnd(12)} ${t.label}${current}`);
        }
      }
      lines.push("");
      lines.push("Usage: theme <name>");
      return { output: lines.join("\n"), type: "output" };
    }

    const themeName = args[0].toLowerCase();
    const theme = getTheme(themeName);
    if (!theme) {
      return {
        output: `Unknown theme: ${args[0]}. Type 'theme --list' for options.`,
        type: "error",
      };
    }

    if (secretThemes[themeName] && !allUnlocked) {
      return {
        output: `Theme '${themeName}' requires 100% completion to unlock.`,
        type: "error",
      };
    }

    applyTheme(theme);
    ctx.onThemeChange(theme.name);

    return { output: `Theme changed to ${theme.label}`, type: "system" };
  },
});

register({
  name: "neofetch",
  description: "System information",
  category: "system",
  handler: (_args, ctx) => {
    const themeLabel =
      (themes[ctx.currentTheme] || secretThemes[ctx.currentTheme])?.label ||
      ctx.currentTheme;
    return {
      output: generateNeofetch(ctx.sessionStart, themeLabel),
      type: "output",
    };
  },
});

register({
  name: "achievements",
  aliases: ["progress"],
  description: "View achievements",
  category: "system",
  handler: (_args, ctx) => ({
    output: formatAchievements(ctx.achievementState),
    type: "output",
  }),
});

register({
  name: "history",
  description: "Command history",
  category: "system",
  handler: (_args, ctx) => {
    if (ctx.commandHistory.length === 0) {
      return { output: "  (no history)", type: "output" };
    }
    const lines = ctx.commandHistory.map(
      (cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`
    );
    return { output: lines.join("\n"), type: "output" };
  },
});

register({
  name: "mute",
  description: "Mute sound effects",
  category: "system",
  handler: (_args, ctx) => {
    soundManager.mute();
    ctx.onSoundToggle();
    return { output: "  Sound muted", type: "system" };
  },
});

register({
  name: "unmute",
  description: "Unmute sound effects",
  category: "system",
  handler: (_args, ctx) => {
    soundManager.unmute();
    ctx.onSoundToggle();
    return { output: "  Sound unmuted", type: "system" };
  },
});

register({
  name: "split",
  description: "Toggle info panel",
  category: "system",
  aliases: ["panel"],
  handler: () => ({
    output: "",
    type: "output",
    togglePanel: true,
  }),
});

register({
  name: "reset",
  description: "Reset all progress",
  category: "system",
  handler: () => ({
    output: "  Are you sure you want to reset all progress? This cannot be undone. (y/n)",
    type: "system",
    confirmReset: true,
  }),
});

// --- Fun ---

register({
  name: "snake",
  description: "Play snake game",
  category: "fun",
  handler: () => ({
    output: "",
    type: "output",
    startGame: "snake",
  }),
});

register({
  name: "invaders",
  description: "Play Space Invaders",
  category: "fun",
  handler: () => ({
    output: "",
    type: "output",
    startGame: "invaders",
  }),
});

register({
  name: "breakout",
  description: "Play Breakout",
  category: "fun",
  handler: () => ({
    output: "",
    type: "output",
    startGame: "breakout",
  }),
});


register({
  name: "gui",
  description: "Visual portfolio (click-friendly)",
  category: "system",
  handler: () => ({
    output: "",
    type: "output",
    startGui: true,
  }),
});

// --- Secret Commands (require 100% completion) ---

register({
  name: "disco",
  description: "Disco mode",
  category: "fun",
  secret: true,
  handler: (_args, ctx) => {
    if (!isFullyUnlocked(ctx.achievementState)) {
      return {
        output: 'Command not found: disco. Type "help" for available commands.',
        type: "error",
      };
    }
    ctx.trackEasterEgg("disco");

    window.dispatchEvent(new CustomEvent("disco-mode-toggle"));

    return { output: "  Disco mode activated! The lights are going wild.", type: "system" };
  },
});

register({
  name: "iddqd",
  description: "???",
  category: "fun",
  secret: true,
  handler: (_args, ctx) => {
    if (isFullyUnlocked(ctx.achievementState)) {
      return {
        output: "  God mode already active. You have nothing left to prove.",
        type: "system",
      };
    }
    return {
      output: [
        "  IDDQD",
        "",
        "  God mode activated.",
        "  All achievements unlocked.",
        "",
        "  (You cheater.)",
      ].join("\n"),
      type: "system",
      unlockAll: true,
    };
  },
});
